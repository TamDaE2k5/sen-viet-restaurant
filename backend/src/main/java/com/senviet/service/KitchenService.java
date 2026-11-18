package com.senviet.service;

import com.senviet.domain.dto.request.*;
import com.senviet.domain.dto.response.BatchLossResult;
import com.senviet.domain.dto.response.BatchResponse;
import com.senviet.domain.dto.response.RecipeResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service xử lý toàn bộ nghiệp vụ Phân hệ Bếp:
 * 1. Lấy hàng & tìm kiếm barcode
 * 2. Chế biến mẻ & cảnh báo mẻ 2
 * 3. Ra line (+1) chống double-click
 * 4. Báo hỏng & xét duyệt ngưỡng
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenService {

    private final ItemRepository itemRepository;
    private final RecipeRepository recipeRepository;
    private final TakeOutLogRepository takeOutLogRepository;
    private final ProcessingBatchRepository batchRepository;
    private final DamageReportRepository damageReportRepository;
    private final LineItemLogRepository lineItemLogRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final ImportBatchRepository importBatchRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final SupplierRepository supplierRepository;

    // Ngưỡng giá trị báo hỏng tự động duyệt: 500,000 VNĐ
    private static final BigDecimal AUTO_APPROVE_THRESHOLD = new BigDecimal("500000.00");

    @Transactional(readOnly = true)
    public List<Item> searchItems(String query) {
        if (query == null || query.trim().isEmpty()) {
            return itemRepository.findByIsBuffetLineTrue();
        }
        return itemRepository.searchItems(query.trim());
    }

    @Transactional(readOnly = true)
    public List<Item> getAllBuffetItems() {
        return itemRepository.findByIsBuffetLineTrue();
    }

    @Transactional(readOnly = true)
    public List<RecipeResponse> getAllRecipes() {
        return recipeRepository.findAll().stream()
                .map(r -> RecipeResponse.builder()
                        .id(r.getId())
                        .itemId(r.getItem().getId())
                        .itemCode(r.getItem().getItemCode())
                        .itemName(r.getItem().getItemName())
                        .unit(r.getItem().getUnit())
                        .recipeName(r.getRecipeName())
                        .standardLossRate(r.getStandardLossRate())
                        .description(r.getDescription())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Thao tác 1: Lấy Hàng từ kho sơ bộ ra khu vực bếp.
     */
    @Transactional
    public TakeOutLog recordTakeOut(TakeOutRequest request, UserPrincipal currentUser) {
        Branch branch = getBranch(currentUser.getBranchId());
        User user = getUser(currentUser.getId());
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getItemId()));

        TakeOutLog logEntry = TakeOutLog.builder()
                .branch(branch)
                .item(item)
                .quantity(request.getQuantity())
                .unit(item.getUnit())
                .user(user)
                .note(request.getNote())
                .build();

        log.info("Lấy hàng: Chi nhánh {}, Item {}, Số lượng {} {}",
                branch.getBranchCode(), item.getItemName(), request.getQuantity(), item.getUnit());

        return takeOutLogRepository.save(logEntry);
    }

    /**
     * Thao tác 2A: Khởi tạo mẻ chế biến mới.
     * Cảnh báo nếu món này đang có một mẻ chưa xong (DANG_LAM).
     */
    @Transactional
    public BatchResponse startBatch(StartBatchRequest request, UserPrincipal currentUser) {
        Branch branch = getBranch(currentUser.getBranchId());
        User user = getUser(currentUser.getId());
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getItemId()));

        // Kiểm tra mẻ đang làm dở dang của món này tại chi nhánh
        boolean hasActiveBatch = batchRepository.existsByBranchIdAndItemIdAndStatus(
                branch.getId(), item.getId(), "DANG_LAM");

        if (hasActiveBatch && !request.isForceSecondBatch()) {
            // Ném ngoại lệ hoặc trả về cảnh báo mẻ 2
            throw new ApiException(HttpStatus.CONFLICT,
                    "CẢNH BÁO: Món [" + item.getItemName() + "] đang có một mẻ chưa hoàn tất cân thành phẩm. " +
                    "Bạn có chắc chắn muốn mở thêm mẻ mới?");
        }

        // Tìm công thức chuẩn nếu có
        Recipe recipe = null;
        BigDecimal standardLoss = BigDecimal.ZERO;
        if (request.getRecipeId() != null) {
            recipe = recipeRepository.findById(request.getRecipeId()).orElse(null);
        }
        if (recipe == null) {
            recipe = recipeRepository.findFirstByItemId(item.getId()).orElse(null);
        }
        if (recipe != null) {
            standardLoss = recipe.getStandardLossRate();
        }

        String batchCode = "ME-" + System.currentTimeMillis() % 1000000;

        ProcessingBatch batch = ProcessingBatch.builder()
                .branch(branch)
                .item(item)
                .recipe(recipe)
                .batchCode(batchCode)
                .inputWeight(request.getInputWeight())
                .standardLossRate(standardLoss)
                .isSecondBatch(hasActiveBatch)
                .status("DANG_LAM")
                .startedByUser(user)
                .startedAt(Instant.now())
                .build();

        ProcessingBatch saved = batchRepository.save(batch);

        return mapToBatchResponse(saved, hasActiveBatch ? "Mở mẻ chế biến thứ hai khi mẻ cũ chưa hoàn thành" : null);
    }

    /**
     * Thao tác 2B: Hoàn thành cân mẻ thành phẩm & tính tỷ lệ hao hụt.
     */
    @Transactional
    public BatchResponse finishBatch(FinishBatchRequest request, UserPrincipal currentUser) {
        ProcessingBatch batch = batchRepository.findById(request.getBatchId())
                .orElseThrow(() -> new ResourceNotFoundException("ProcessingBatch", "id", request.getBatchId()));

        if (!"DANG_LAM".equals(batch.getStatus())) {
            throw new ApiException("Mẻ chế biến này đã hoàn thành hoặc đã bị hủy");
        }

        User user = getUser(currentUser.getId());
        BigDecimal inputWeight = batch.getInputWeight();
        BigDecimal outputWeight = request.getOutputWeight();

        // Kiểm tra tính toàn vẹn: Thành phẩm không thể nặng hơn nguyên liệu thô
        if (outputWeight.compareTo(inputWeight) > 0) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "Khối lượng thành phẩm (" + outputWeight + " kg) không thể vượt quá khối lượng đầu vào (" + inputWeight + " kg)");
        }

        // Tính toán hao hụt thực tế
        BatchLossResult lossResult = calculateBatchLoss(inputWeight, outputWeight, batch.getStandardLossRate());

        batch.setOutputWeight(outputWeight);
        batch.setLossRate(lossResult.getLossRate());
        batch.setIsOverStandard(lossResult.isOverStandard());
        batch.setStatus("HOAN_THANH");
        batch.setFinishedByUser(user);
        batch.setFinishedAt(Instant.now());

        ProcessingBatch saved = batchRepository.save(batch);

        log.info("Hoàn thành mẻ {}: Đầu vào {} kg, Đầu ra {} kg, Hao hụt {}%, Vượt chuẩn: {}",
                saved.getBatchCode(), inputWeight, outputWeight, saved.getLossRate(), saved.getIsOverStandard());

        return mapToBatchResponse(saved, saved.getIsOverStandard() ? "Hao hụt thực tế vượt định mức chuẩn cho phép!" : null);
    }

    /**
     * Logic tính tỷ lệ hao hụt chuẩn:
     * Hao hụt % = ((Đầu vào - Đầu ra) / Đầu vào) * 100
     */
    public BatchLossResult calculateBatchLoss(BigDecimal inputWeight, BigDecimal outputWeight, BigDecimal standardLossRate) {
        if (inputWeight == null || inputWeight.compareTo(BigDecimal.ZERO) <= 0) {
            throw new ApiException("Khối lượng đầu vào phải lớn hơn 0");
        }
        if (outputWeight == null || outputWeight.compareTo(BigDecimal.ZERO) < 0) {
            throw new ApiException("Khối lượng thành phẩm không hợp lệ");
        }
        if (outputWeight.compareTo(inputWeight) > 0) {
            throw new ApiException("Khối lượng thành phẩm không thể vượt quá khối lượng đầu vào");
        }

        BigDecimal lossWeight = inputWeight.subtract(outputWeight);
        BigDecimal lossRate = lossWeight.divide(inputWeight, 4, RoundingMode.HALF_UP)
                .multiply(new BigDecimal("100"))
                .setScale(2, RoundingMode.HALF_UP);

        boolean overStandard = false;
        if (standardLossRate != null && standardLossRate.compareTo(BigDecimal.ZERO) > 0) {
            overStandard = lossRate.compareTo(standardLossRate) > 0;
        }

        return BatchLossResult.builder()
                .lossRate(lossRate)
                .standardLossRate(standardLossRate != null ? standardLossRate : BigDecimal.ZERO)
                .overStandard(overStandard)
                .build();
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> getActiveBatches(Long branchId) {
        return batchRepository.findByBranchIdAndStatusOrderByStartedAtDesc(branchId, "DANG_LAM").stream()
                .map(b -> mapToBatchResponse(b, null))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<BatchResponse> getAllBatches(Long branchId) {
        return batchRepository.findByBranchIdOrderByStartedAtDesc(branchId).stream()
                .map(b -> mapToBatchResponse(b, null))
                .collect(Collectors.toList());
    }

    /**
     * Thao tác 3: Ra Line (+1) với cơ chế Idempotency Token chống Double-Click.
     */
    @Transactional
    public LineItemLog recordLineItem(LineItemIncRequest request, UserPrincipal currentUser) {
        Branch branch = getBranch(currentUser.getBranchId());
        User user = getUser(currentUser.getId());
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getItemId()));

        // Chống Double-click: Nếu requestId đã được xử lý trong vòng vài giây, bỏ qua
        final String effectiveRequestId = (request.getRequestId() != null && !request.getRequestId().trim().isEmpty())
                ? request.getRequestId().trim()
                : UUID.randomUUID().toString();

        if (request.getRequestId() != null && !request.getRequestId().trim().isEmpty()) {
            if (lineItemLogRepository.existsByRequestId(effectiveRequestId)) {
                log.warn("Phát hiện request trùng lặp requestId={} (chống double-click)", effectiveRequestId);
                return lineItemLogRepository.findAll().stream()
                        .filter(l -> effectiveRequestId.equals(l.getRequestId()))
                        .findFirst()
                        .orElse(null);
            }
        }

        LineItemLog logEntry = LineItemLog.builder()
                .branch(branch)
                .item(item)
                .quantity(request.getQuantity() != null ? request.getQuantity() : 1)
                .requestId(effectiveRequestId)
                .user(user)
                .build();

        return lineItemLogRepository.save(logEntry);
    }

    /**
     * Thao tác 4: Báo Hỏng nguyên liệu & Tự động duyệt theo ngưỡng giá trị.
     */
    @Transactional
    public DamageReport recordDamageReport(DamageReportRequest request, UserPrincipal currentUser) {
        Branch branch = getBranch(currentUser.getBranchId());
        User user = getUser(currentUser.getId());
        Item item = itemRepository.findById(request.getItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getItemId()));

        // Tính giá trị thiệt hại ước tính
        BigDecimal estimatedValue = request.getQuantity().multiply(item.getCostPrice())
                .setScale(2, RoundingMode.HALF_UP);

        // Quy tắc: Nếu giá trị hỏng > 500k -> Chờ duyệt từ Quản lý nhà hàng
        String status = "TU_DONG_DUYET";
        if (estimatedValue.compareTo(AUTO_APPROVE_THRESHOLD) > 0) {
            status = "CHO_DUYET";
        }

        // Liên kết Lô nhập và Nhà cung cấp nếu có
        ImportBatch batch = null;
        if (request.getBatchId() != null) {
            batch = importBatchRepository.findById(request.getBatchId())
                    .orElseThrow(() -> new ResourceNotFoundException("ImportBatch", "id", request.getBatchId()));
        } else if (request.getBatchNumber() != null && !request.getBatchNumber().trim().isEmpty()) {
            batch = importBatchRepository.findByBatchCode(request.getBatchNumber().trim()).orElse(null);
        }

        Supplier supplier = null;
        if (batch != null) {
            supplier = batch.getSupplier();
            // Trừ tồn của lô nhập khi báo hỏng
            BigDecimal newStock = batch.getCurrentStock().subtract(request.getQuantity());
            if (newStock.compareTo(BigDecimal.ZERO) < 0) {
                newStock = BigDecimal.ZERO;
            }
            batch.setCurrentStock(newStock);
            if (newStock.compareTo(BigDecimal.ZERO) == 0) {
                batch.setStatus("HET_HANG");
            }
            importBatchRepository.save(batch);

            final BigDecimal updatedStock = newStock;
            // Đồng bộ cập nhật tồn kho inventory_stocks
            inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), batch.getId())
                    .ifPresent(stock -> {
                        stock.setQuantity(updatedStock);
                        stock.setLastUpdatedAt(Instant.now());
                        inventoryStockRepository.save(stock);
                    });
        } else if (request.getSupplierCode() != null && !request.getSupplierCode().trim().isEmpty()) {
            supplier = supplierRepository.findBySupplierCode(request.getSupplierCode().trim()).orElse(null);
        }

        DamageReport report = DamageReport.builder()
                .branch(branch)
                .item(item)
                .batch(batch)
                .supplier(supplier)
                .supplierCode(supplier != null ? supplier.getSupplierCode() : request.getSupplierCode())
                .batchNumber(batch != null ? batch.getBatchCode() : request.getBatchNumber())
                .quantity(request.getQuantity())
                .estimatedValue(estimatedValue)
                .reason(request.getReason())
                .imageUrls(request.getImageUrls())
                .status(status)
                .reportedByUser(user)
                .note(request.getNote())
                .build();

        DamageReport saved = damageReportRepository.save(report);

        log.info("Báo hỏng: Chi nhánh {}, Item {}, Số lượng {} {}, Giá trị {} đ, Trạng thái: {}",
                branch.getBranchCode(), item.getItemName(), request.getQuantity(), item.getUnit(), estimatedValue, status);

        return saved;
    }

    /**
     * Duyệt báo hỏng (dành cho ROLE_RESTAURANT_MANAGER).
     */
    @Transactional
    public DamageReport approveDamageReport(Long reportId, UserPrincipal currentUser) {
        DamageReport report = damageReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("DamageReport", "id", reportId));

        User user = getUser(currentUser.getId());
        report.setStatus("DA_DUYET");
        report.setApprovedByUser(user);
        report.setApprovedAt(Instant.now());

        return damageReportRepository.save(report);
    }

    @Transactional(readOnly = true)
    public List<DamageReport> getDamageReports(Long branchId) {
        return damageReportRepository.findByBranchIdOrderByCreatedAtDesc(branchId);
    }

    // --- Private Helper Methods ---

    private Branch getBranch(Long branchId) {
        if (branchId == null) {
            // Mặc định chi nhánh đầu tiên nếu user quản trị chuỗi
            return branchRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy chi nhánh mặc định"));
        }
        return branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
    }

    private BatchResponse mapToBatchResponse(ProcessingBatch b, String warningMsg) {
        return BatchResponse.builder()
                .id(b.getId())
                .batchCode(b.getBatchCode())
                .itemId(b.getItem().getId())
                .itemName(b.getItem().getItemName())
                .itemCode(b.getItem().getItemCode())
                .inputWeight(b.getInputWeight())
                .outputWeight(b.getOutputWeight())
                .lossRate(b.getLossRate())
                .standardLossRate(b.getStandardLossRate())
                .overStandard(Boolean.TRUE.equals(b.getIsOverStandard()))
                .secondBatch(Boolean.TRUE.equals(b.getIsSecondBatch()))
                .status(b.getStatus())
                .startedBy(b.getStartedByUser() != null ? b.getStartedByUser().getFullName() : null)
                .finishedBy(b.getFinishedByUser() != null ? b.getFinishedByUser().getFullName() : null)
                .startedAt(b.getStartedAt())
                .finishedAt(b.getFinishedAt())
                .warningMessage(warningMsg)
                .build();
    }
}
