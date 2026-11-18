package com.senviet.service;

import com.senviet.domain.dto.request.*;
import com.senviet.domain.dto.response.*;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.exception.UnapprovedDamageReportException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
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
    private final DailyWasteConfirmationRepository dailyWasteConfirmationRepository;

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

        // Quy tắc chặn cứng (Phase 8): Nếu món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt -> Chặn ngay lập tức (HTTP 422)
        boolean hasUnapprovedDamage = damageReportRepository.existsByBranchIdAndItemIdAndStatus(
                branch.getId(), item.getId(), "CHO_DUYET");
        if (hasUnapprovedDamage) {
            throw new UnapprovedDamageReportException(
                    "Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!");
        }

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
     *
     * NGHIỆP VỤ BẤT KHẢ XÂM PHẠM (Phase 8 - Task 8.4):
     * Thao tác Ra line (+1) CHỈ DÙNG ĐỂ THEO DÕI tần suất tiếp khay đồ ra quầy buffet và đối chiếu số liệu
     * khách ăn từ CukCuk POS, TUYỆT ĐỐI KHÔNG TRỪ TỒN KHO NGUYÊN LIỆU.
     * Lượng xuất kho thực tế đã được hạch toán đầy đủ thông qua Phiếu xuất kho hoặc Mẻ chế biến đầu vào.
     * Mọi thay đổi trừ tồn kho tại phương thức này đều vi phạm nghiêm ngặt nguyên tắc kế toán kho của chuỗi.
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

        // CHỈ GHI NHẬN NHẬT KÝ, KHÔNG TRỪ TỒN KHO NGUYÊN LIỆU
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
     * Bí danh (Alias method) cho thao tác bấm khay ra line (Task 8.4).
     * Đảm bảo kiểm toán code khẳng định phương thức không trừ tồn kho.
     */
    @Transactional
    public LineItemLog incrementLineTray(LineItemIncRequest request, UserPrincipal currentUser) {
        return recordLineItem(request, currentUser);
    }

    /**
     * Thao tác Thêm nhanh món mới ra Line buffet (Phase 8 - Task 8.5).
     * Cho phép Bếp/Quản lý bổ sung ngay món mới trong ca trực mà không cần vào trang cấu hình Admin.
     */
    @Transactional
    public Item quickAddLineItem(QuickAddLineItemRequest request, UserPrincipal currentUser) {
        String itemName = request.getItemName().trim();
        String itemCode = request.getItemCode();
        if (itemCode == null || itemCode.trim().isEmpty()) {
            String rawCode = "MON_" + (System.currentTimeMillis() % 1000000);
            itemCode = rawCode.toUpperCase();
        } else {
            itemCode = itemCode.trim().toUpperCase();
        }

        if (itemRepository.existsByItemCode(itemCode)) {
            throw new ApiException(HttpStatus.CONFLICT, "Mã món ăn đã tồn tại: " + itemCode);
        }

        Item item = Item.builder()
                .itemCode(itemCode)
                .barcode(request.getBarcode() != null && !request.getBarcode().trim().isEmpty() ? request.getBarcode().trim() : null)
                .itemName(itemName)
                .category(request.getCategory() != null && !request.getCategory().trim().isEmpty() ? request.getCategory().trim().toUpperCase() : "HAI_SAN")
                .unit(request.getUnit() != null && !request.getUnit().trim().isEmpty() ? request.getUnit().trim().toUpperCase() : "ĐĨA")
                .costPrice(request.getCostPrice() != null ? request.getCostPrice() : BigDecimal.ZERO)
                .isBuffetLine(request.getIsBuffetLine() != null ? request.getIsBuffetLine() : true)
                .isDailyOnly(request.getIsDailyOnly() != null ? request.getIsDailyOnly() : false)
                .build();

        Item saved = itemRepository.save(item);
        log.info("Thêm nhanh món mới ra line buffet: {} - {}", saved.getItemCode(), saved.getItemName());
        return saved;
    }

    /**
     * Lấy danh sách các món chỉ dùng trong ngày và tồn kho hiện tại cuối ca (Task 8.3).
     */
    @Transactional(readOnly = true)
    public List<DailyOnlyItemRemainingResponse> getDailyRemainingItems(Long branchId) {
        List<Item> dailyItems = itemRepository.findByIsDailyOnlyTrue();
        return dailyItems.stream().map(item -> {
            BigDecimal stock = inventoryStockRepository.getTotalStockByBranchAndItem(branchId, item.getId());
            return DailyOnlyItemRemainingResponse.builder()
                    .itemId(item.getId())
                    .itemCode(item.getItemCode())
                    .itemName(item.getItemName())
                    .category(item.getCategory())
                    .unit(item.getUnit())
                    .costPrice(item.getCostPrice())
                    .currentStock(stock != null ? stock : BigDecimal.ZERO)
                    .isDailyOnly(item.getIsDailyOnly())
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Xác nhận hủy bỏ món tươi chỉ dùng trong ngày cuối ca (Task 8.3).
     * Số liệu ghi nhận vào cột Hỏng/bỏ có báo của Bảng cuối ngày, không phạt nhân viên.
     */
    @Transactional
    public List<DailyWasteConfirmationResponse> confirmDailyWaste(ConfirmDailyWasteRequest request, UserPrincipal currentUser) {
        Long branchId = request.getBranchId() != null ? request.getBranchId() : currentUser.getBranchId();
        Branch branch = getBranch(branchId);
        User user = getUser(currentUser.getId());

        LocalDate wasteDate = request.getWasteDate() != null ? request.getWasteDate() : LocalDate.now();
        String shift = request.getShift() != null && !request.getShift().trim().isEmpty()
                ? request.getShift().trim().toUpperCase() : "CA_NGAY";

        List<DailyWasteConfirmationResponse> responses = new ArrayList<>();

        for (DailyWasteItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemReq.getItemId()));

            DailyWasteConfirmation confirmation = DailyWasteConfirmation.builder()
                    .branch(branch)
                    .item(item)
                    .wasteDate(wasteDate)
                    .shift(shift)
                    .quantity(itemReq.getQuantity())
                    .unit(itemReq.getUnit() != null ? itemReq.getUnit() : item.getUnit())
                    .confirmedByUser(user)
                    .status("DA_XAC_NHAN")
                    .note(itemReq.getNote() != null ? itemReq.getNote() : request.getNote())
                    .build();

            DailyWasteConfirmation saved = dailyWasteConfirmationRepository.save(confirmation);

            // Trừ tồn kho tương ứng
            BigDecimal remainingToDeduct = itemReq.getQuantity();
            List<ImportBatch> batches = importBatchRepository
                    .findByBranchIdAndItemIdAndCurrentStockGreaterThanOrderByImportDateAsc(branch.getId(), item.getId(), BigDecimal.ZERO);

            for (ImportBatch b : batches) {
                if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;
                BigDecimal deduct = remainingToDeduct.min(b.getCurrentStock());
                b.setCurrentStock(b.getCurrentStock().subtract(deduct));
                if (b.getCurrentStock().compareTo(BigDecimal.ZERO) == 0) {
                    b.setStatus("HET_HANG");
                }
                importBatchRepository.save(b);

                inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), b.getId())
                        .ifPresent(st -> {
                            st.setQuantity(b.getCurrentStock());
                            st.setLastUpdatedAt(Instant.now());
                            inventoryStockRepository.save(st);
                        });

                remainingToDeduct = remainingToDeduct.subtract(deduct);
            }

            responses.add(DailyWasteConfirmationResponse.builder()
                    .id(saved.getId())
                    .branchId(branch.getId())
                    .branchName(branch.getBranchName())
                    .itemId(item.getId())
                    .itemCode(item.getItemCode())
                    .itemName(item.getItemName())
                    .wasteDate(saved.getWasteDate())
                    .shift(saved.getShift())
                    .quantity(saved.getQuantity())
                    .unit(saved.getUnit())
                    .confirmedById(user.getId())
                    .confirmedByName(user.getFullName())
                    .status(saved.getStatus())
                    .note(saved.getNote())
                    .createdAt(saved.getCreatedAt())
                    .build());
        }

        log.info("Xác nhận hủy bỏ cuối ca {} cho chi nhánh {}: {} món dùng trong ngày",
                shift, branch.getBranchCode(), responses.size());

        return responses;
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
