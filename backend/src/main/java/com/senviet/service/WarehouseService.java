package com.senviet.service;

import com.senviet.domain.dto.request.CreateRecipeIngredientRequest;
import com.senviet.domain.dto.request.CreateWarehouseDocumentRequest;
import com.senviet.domain.dto.request.WarehouseDocumentItemRequest;
import com.senviet.domain.dto.response.*;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service Quản trị Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp.
 * 
 * Nghiệp vụ:
 * 1. Tạo phiếu nhập kho: Tự sinh mã lô nhập (LOT-YYYYMM-XXX), cộng tồn kho tức thời.
 * 2. Tạo phiếu xuất chuyển / huỷ kho: Trừ tồn kho theo lô hoặc FIFO.
 * 3. Báo cáo tỷ lệ hỏng theo nhà cung cấp & lô nhập kèm xuất file Excel chuẩn POI.
 * 4. Quản lý công thức định lượng nhiều nguyên liệu cấu thành món (Recipe Ingredients).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WarehouseService {

    private final WarehouseDocumentRepository documentRepository;
    private final WarehouseDocumentItemRepository documentItemRepository;
    private final ImportBatchRepository importBatchRepository;
    private final InventoryStockRepository inventoryStockRepository;
    private final SupplierRepository supplierRepository;
    private final ItemRepository itemRepository;
    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final DamageReportRepository damageReportRepository;

    /**
     * Tạo mới Phiếu kho (Nhập hàng, Xuất chuyển, Huỷ kho).
     *
     * @param request     DTO CreateWarehouseDocumentRequest
     * @param currentUser Người dùng đăng nhập
     * @return DTO WarehouseDocumentResponse
     */
    @Transactional
    public WarehouseDocumentResponse createDocument(CreateWarehouseDocumentRequest request, UserPrincipal currentUser) {
        Long branchId = request.getBranchId() != null ? request.getBranchId() : currentUser.getBranchId();
        Branch branch = branchRepository.findById(branchId)
                .orElseThrow(() -> new ResourceNotFoundException("Branch", "id", branchId));

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", currentUser.getId()));

        String docType = request.getDocType().trim().toUpperCase();
        if (!Arrays.asList("NHAP", "XUAT_CHUYEN", "HUY", "KIEM_KE").contains(docType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Loại phiếu không hợp lệ: " + docType);
        }

        Supplier supplier = null;
        if (request.getSupplierId() != null) {
            supplier = supplierRepository.findById(request.getSupplierId())
                    .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", request.getSupplierId()));
        } else if ("NHAP".equals(docType)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Phiếu nhập kho bắt buộc phải chọn Nhà cung cấp");
        }

        // Kiểm tra tối đa 5 ảnh đính kèm
        if (request.getImageUrls() != null && !request.getImageUrls().trim().isEmpty()) {
            String[] images = request.getImageUrls().split(",");
            if (images.length > 5) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "Chỉ được đính kèm tối đa 5 ảnh hóa đơn/chứng từ");
            }
        }

        // Tự động sinh mã phiếu kho duy nhất
        String docCode = generateDocumentCode(docType);

        WarehouseDocument document = WarehouseDocument.builder()
                .docType(docType)
                .docCode(docCode)
                .branch(branch)
                .supplier(supplier)
                .createdByUser(user)
                .status("HOAN_THANH")
                .note(request.getNote())
                .imageUrls(request.getImageUrls())
                .totalAmount(BigDecimal.ZERO)
                .build();

        WarehouseDocument savedDoc = documentRepository.save(document);

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<WarehouseDocumentItem> documentItems = new ArrayList<>();

        for (WarehouseDocumentItemRequest itemReq : request.getItems()) {
            Item item = itemRepository.findById(itemReq.getItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Item", "id", itemReq.getItemId()));

            BigDecimal qty = itemReq.getQuantity();
            BigDecimal unitPrice = itemReq.getUnitPrice() != null ? itemReq.getUnitPrice() : item.getCostPrice();
            BigDecimal lineTotal = qty.multiply(unitPrice).setScale(2, RoundingMode.HALF_UP);
            totalAmount = totalAmount.add(lineTotal);

            ImportBatch batch = null;

            if ("NHAP".equals(docType)) {
                // Tạo lô nhập hàng mới
                String batchCode = itemReq.getBatchCode();
                if (batchCode == null || batchCode.trim().isEmpty()) {
                    batchCode = generateBatchCode();
                } else {
                    batchCode = batchCode.trim();
                    if (importBatchRepository.existsByBatchCode(batchCode)) {
                        throw new ApiException(HttpStatus.CONFLICT, "Mã lô nhập đã tồn tại: " + batchCode);
                    }
                }

                batch = ImportBatch.builder()
                        .batchCode(batchCode)
                        .supplier(supplier)
                        .item(item)
                        .branch(branch)
                        .importDate(LocalDate.now())
                        .expiryDate(itemReq.getExpiryDate())
                        .initialQuantity(qty)
                        .currentStock(qty)
                        .unitPrice(unitPrice)
                        .unit(item.getUnit())
                        .status("CON_HANG")
                        .build();

                batch = importBatchRepository.save(batch);

                // Cập nhật bảng tồn kho inventory_stocks
                InventoryStock stock = inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), batch.getId())
                        .orElse(InventoryStock.builder()
                                .branch(branch)
                                .item(item)
                                .batch(batch)
                                .quantity(BigDecimal.ZERO)
                                .build());
                stock.setQuantity(stock.getQuantity().add(qty));
                stock.setLastUpdatedAt(Instant.now());
                inventoryStockRepository.save(stock);

            } else if ("XUAT_CHUYEN".equals(docType) || "HUY".equals(docType)) {
                if (itemReq.getBatchId() != null) {
                    batch = importBatchRepository.findById(itemReq.getBatchId())
                            .orElseThrow(() -> new ResourceNotFoundException("ImportBatch", "id", itemReq.getBatchId()));

                    if (batch.getCurrentStock().compareTo(qty) < 0) {
                        throw new ApiException(HttpStatus.BAD_REQUEST,
                                String.format("Số lượng xuất (%s) vượt quá tồn hiện tại của lô %s (%s)",
                                        qty, batch.getBatchCode(), batch.getCurrentStock()));
                    }

                    batch.setCurrentStock(batch.getCurrentStock().subtract(qty));
                    if (batch.getCurrentStock().compareTo(BigDecimal.ZERO) == 0) {
                        batch.setStatus("HET_HANG");
                    }
                    importBatchRepository.save(batch);

                    final ImportBatch targetBatch = batch;
                    // Trừ tồn inventory_stocks
                    InventoryStock stock = inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), targetBatch.getId())
                            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Không tìm thấy bản ghi tồn kho cho lô: " + targetBatch.getBatchCode()));
                    stock.setQuantity(targetBatch.getCurrentStock());
                    stock.setLastUpdatedAt(Instant.now());
                    inventoryStockRepository.save(stock);

                } else {
                    // Xuất FIFO theo các lô cũ nhất còn tồn
                    List<ImportBatch> availableBatches = importBatchRepository
                            .findByBranchIdAndItemIdAndCurrentStockGreaterThanOrderByImportDateAsc(branch.getId(), item.getId(), BigDecimal.ZERO);

                    BigDecimal remainingToDeduct = qty;
                    for (ImportBatch b : availableBatches) {
                        if (remainingToDeduct.compareTo(BigDecimal.ZERO) <= 0) break;

                        BigDecimal deduct = remainingToDeduct.min(b.getCurrentStock());
                        b.setCurrentStock(b.getCurrentStock().subtract(deduct));
                        if (b.getCurrentStock().compareTo(BigDecimal.ZERO) == 0) {
                            b.setStatus("HET_HANG");
                        }
                        importBatchRepository.save(b);

                        inventoryStockRepository.findByBranchIdAndItemIdAndBatchId(branch.getId(), item.getId(), b.getId())
                                .ifPresent(s -> {
                                    s.setQuantity(b.getCurrentStock());
                                    s.setLastUpdatedAt(Instant.now());
                                    inventoryStockRepository.save(s);
                                });

                        remainingToDeduct = remainingToDeduct.subtract(deduct);
                        if (batch == null) {
                            batch = b;
                        }
                    }

                    if (remainingToDeduct.compareTo(BigDecimal.ZERO) > 0) {
                        throw new ApiException(HttpStatus.BAD_REQUEST, "Tổng tồn kho các lô không đủ để xuất: thiếu " + remainingToDeduct + " " + item.getUnit());
                    }
                }
            }

            WarehouseDocumentItem docItem = WarehouseDocumentItem.builder()
                    .document(savedDoc)
                    .item(item)
                    .batch(batch)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .note(itemReq.getNote())
                    .build();

            documentItems.add(documentItemRepository.save(docItem));
        }

        savedDoc.setTotalAmount(totalAmount);
        savedDoc.getItems().clear();
        savedDoc.getItems().addAll(documentItems);
        savedDoc = documentRepository.save(savedDoc);

        log.info("Tạo thành công phiếu kho {} loại {} cho chi nhánh {}, tổng tiền: {} đ",
                savedDoc.getDocCode(), savedDoc.getDocType(), branch.getBranchCode(), totalAmount);

        return mapToDocumentResponse(savedDoc);
    }

    /**
     * Tra cứu danh sách phiếu kho với các bộ lọc.
     */
    @Transactional(readOnly = true)
    public List<WarehouseDocumentResponse> getDocuments(Long branchId, String docType, String status, Instant fromTime, Instant toTime) {
        String trimmedType = (docType != null && !docType.trim().isEmpty()) ? docType.trim().toUpperCase() : null;
        String trimmedStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        return documentRepository.searchDocuments(branchId, trimmedType, trimmedStatus, fromTime, toTime).stream()
                .map(this::mapToDocumentResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy chi tiết phiếu kho theo ID.
     */
    @Transactional(readOnly = true)
    public WarehouseDocumentResponse getDocumentById(Long id) {
        WarehouseDocument doc = documentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("WarehouseDocument", "id", id));
        return mapToDocumentResponse(doc);
    }

    /**
     * Lấy danh sách lô hàng còn tồn theo chi nhánh và mặt hàng.
     */
    @Transactional(readOnly = true)
    public List<ImportBatchResponse> getAvailableBatches(Long branchId, Long itemId) {
        List<ImportBatch> batches;
        if (itemId != null) {
            batches = importBatchRepository.findByBranchIdAndItemIdAndCurrentStockGreaterThanOrderByImportDateAsc(branchId, itemId, BigDecimal.ZERO);
        } else {
            batches = importBatchRepository.findByBranchIdAndCurrentStockGreaterThanOrderByImportDateAsc(branchId, BigDecimal.ZERO);
        }
        return batches.stream().map(this::mapToBatchResponse).collect(Collectors.toList());
    }

    /**
     * Tra cứu tất cả lô hàng với bộ lọc.
     */
    @Transactional(readOnly = true)
    public List<ImportBatchResponse> searchBatches(Long branchId, LocalDate startDate, LocalDate endDate, Long itemId, Long supplierId) {
        return importBatchRepository.searchBatches(branchId, startDate, endDate, itemId, supplierId).stream()
                .map(this::mapToBatchResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy danh sách tồn kho theo chi nhánh.
     */
    @Transactional(readOnly = true)
    public List<InventoryStockResponse> getInventoryStocks(Long branchId) {
        return inventoryStockRepository.findByBranchIdOrderByItemItemNameAsc(branchId).stream()
                .map(s -> InventoryStockResponse.builder()
                        .id(s.getId())
                        .branchId(s.getBranch().getId())
                        .branchName(s.getBranch().getBranchName())
                        .itemId(s.getItem().getId())
                        .itemCode(s.getItem().getItemCode())
                        .itemName(s.getItem().getItemName())
                        .category(s.getItem().getCategory())
                        .batchId(s.getBatch() != null ? s.getBatch().getId() : null)
                        .batchCode(s.getBatch() != null ? s.getBatch().getBatchCode() : null)
                        .supplierId(s.getBatch() != null && s.getBatch().getSupplier() != null ? s.getBatch().getSupplier().getId() : null)
                        .supplierName(s.getBatch() != null && s.getBatch().getSupplier() != null ? s.getBatch().getSupplier().getSupplierName() : null)
                        .importDate(s.getBatch() != null ? s.getBatch().getImportDate() : null)
                        .expiryDate(s.getBatch() != null ? s.getBatch().getExpiryDate() : null)
                        .quantity(s.getQuantity())
                        .unit(s.getItem().getUnit())
                        .lastUpdatedAt(s.getLastUpdatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * Báo cáo tỷ lệ hỏng theo Nhà cung cấp & Lô nhập.
     * 
     * Công thức: % Hỏng = (Kg hỏng / Kg nhập) * 100%
     * Sắp xếp giảm dần theo % Hỏng (nhà cung cấp hỏng nhiều nhất lên đầu).
     */
    @Transactional(readOnly = true)
    public List<SupplierLossResponse> getSupplierLossReport(Long branchId, String month, Long itemId) {
        LocalDate startDate = null;
        LocalDate endDate = null;
        if (month != null && !month.trim().isEmpty()) {
            YearMonth ym = YearMonth.parse(month.trim());
            startDate = ym.atDay(1);
            endDate = ym.atEndOfMonth();
        }

        List<Supplier> suppliers = supplierRepository.findAll();
        List<ImportBatch> batches = importBatchRepository.searchBatches(branchId, startDate, endDate, itemId, null);
        List<DamageReport> damageReports = (branchId != null) ?
                damageReportRepository.findByBranchIdOrderByCreatedAtDesc(branchId) :
                damageReportRepository.findAll();

        Map<Long, List<ImportBatch>> batchesBySupplier = batches.stream()
                .filter(b -> b.getSupplier() != null)
                .collect(Collectors.groupingBy(b -> b.getSupplier().getId()));

        Map<Long, List<DamageReport>> damagesBySupplier = new HashMap<>();
        for (DamageReport dr : damageReports) {
            Long supplierId = null;
            if (dr.getSupplier() != null) {
                supplierId = dr.getSupplier().getId();
            } else if (dr.getBatch() != null && dr.getBatch().getSupplier() != null) {
                supplierId = dr.getBatch().getSupplier().getId();
            } else if (dr.getSupplierCode() != null) {
                for (Supplier s : suppliers) {
                    if (s.getSupplierCode().equalsIgnoreCase(dr.getSupplierCode())) {
                        supplierId = s.getId();
                        break;
                    }
                }
            }

            if (supplierId != null) {
                damagesBySupplier.computeIfAbsent(supplierId, k -> new ArrayList<>()).add(dr);
            }
        }

        List<SupplierLossResponse> reportList = new ArrayList<>();

        for (Supplier s : suppliers) {
            List<ImportBatch> supBatches = batchesBySupplier.getOrDefault(s.getId(), Collections.emptyList());
            List<DamageReport> supDamages = damagesBySupplier.getOrDefault(s.getId(), Collections.emptyList());

            BigDecimal totalPurchased = supBatches.stream()
                    .map(ImportBatch::getInitialQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalDamaged = supDamages.stream()
                    .map(DamageReport::getQuantity)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal totalEstimatedLoss = supDamages.stream()
                    .map(DamageReport::getEstimatedValue)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal damageRate;
            if (totalPurchased.compareTo(BigDecimal.ZERO) > 0) {
                damageRate = totalDamaged.divide(totalPurchased, 4, RoundingMode.HALF_UP)
                        .multiply(new BigDecimal("100"))
                        .setScale(2, RoundingMode.HALF_UP);
            } else if (totalDamaged.compareTo(BigDecimal.ZERO) > 0) {
                damageRate = new BigDecimal("100.00");
            } else {
                damageRate = BigDecimal.ZERO;
            }

            String evaluation;
            if (damageRate.compareTo(new BigDecimal("5.00")) > 0) {
                evaluation = "NGHIÊM TRỌNG";
            } else if (damageRate.compareTo(new BigDecimal("2.00")) > 0) {
                evaluation = "CẢNH BÁO";
            } else {
                evaluation = "TỐT";
            }

            // Chỉ hiển thị nhà cung cấp có nhập hoặc có báo hỏng
            if (totalPurchased.compareTo(BigDecimal.ZERO) > 0 || totalDamaged.compareTo(BigDecimal.ZERO) > 0) {
                reportList.add(SupplierLossResponse.builder()
                        .supplierCode(s.getSupplierCode())
                        .supplierName(s.getSupplierName())
                        .reportCount((long) supDamages.size())
                        .totalPurchasedQty(totalPurchased.setScale(2, RoundingMode.HALF_UP))
                        .totalDamagedQty(totalDamaged.setScale(2, RoundingMode.HALF_UP))
                        .totalEstimatedLossAmount(totalEstimatedLoss.setScale(0, RoundingMode.HALF_UP))
                        .damageRatePercentage(damageRate)
                        .evaluation(evaluation)
                        .build());
            }
        }

        // Sắp xếp giảm dần theo tỷ lệ % hỏng
        reportList.sort((a, b) -> b.getDamageRatePercentage().compareTo(a.getDamageRatePercentage()));

        for (int i = 0; i < reportList.size(); i++) {
            reportList.get(i).setRank(i + 1);
        }

        return reportList;
    }

    /**
     * Xuất Báo cáo Tỷ lệ Hỏng Nhà cung cấp ra định dạng Microsoft Excel (.xlsx) chuẩn Apache POI.
     */
    @Transactional(readOnly = true)
    public byte[] exportSupplierLossReportExcel(Long branchId, String month, Long itemId) throws IOException {
        List<SupplierLossResponse> reportData = getSupplierLossReport(branchId, month, itemId);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Bao_Cao_Ty_Le_Hong_NCC");

            // Header Style
            CellStyle headerStyle = workbook.createCellStyle();
            Font headerFont = workbook.createFont();
            headerFont.setBold(true);
            headerFont.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(headerFont);
            headerStyle.setFillForegroundColor(IndexedColors.DARK_RED.getIndex());
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Row Title
            Row titleRow = sheet.createRow(0);
            Cell titleCell = titleRow.createCell(0);
            titleCell.setCellValue("BÁO CÁO TỶ LỆ HÀNG HỎNG THEO NHÀ CUNG CẤP & LÔ NHẬP - SEN VIỆT BUFFET");
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 14);
            titleStyle.setFont(titleFont);
            titleCell.setCellStyle(titleStyle);

            // Columns Header
            String[] columns = {"Xếp Hạng", "Mã NCC", "Tên Nhà Cung Cấp", "Số Lần Báo Hỏng", "Tổng Nhập (Kg)", "Tổng Hỏng (Kg)", "Tỷ Lệ Hỏng (%)", "Thiệt Hại Ước Tính (VNĐ)", "Đánh Giá"};
            Row headerRow = sheet.createRow(2);
            for (int i = 0; i < columns.length; i++) {
                Cell cell = headerRow.createCell(i);
                cell.setCellValue(columns[i]);
                cell.setCellStyle(headerStyle);
            }

            int rowIdx = 3;
            for (SupplierLossResponse r : reportData) {
                Row row = sheet.createRow(rowIdx++);
                row.createCell(0).setCellValue(r.getRank() != null ? r.getRank() : 0);
                row.createCell(1).setCellValue(r.getSupplierCode());
                row.createCell(2).setCellValue(r.getSupplierName());
                row.createCell(3).setCellValue(r.getReportCount() != null ? r.getReportCount() : 0);
                row.createCell(4).setCellValue(r.getTotalPurchasedQty() != null ? r.getTotalPurchasedQty().doubleValue() : 0.0);
                row.createCell(5).setCellValue(r.getTotalDamagedQty() != null ? r.getTotalDamagedQty().doubleValue() : 0.0);
                row.createCell(6).setCellValue(r.getDamageRatePercentage() != null ? r.getDamageRatePercentage().doubleValue() : 0.0);
                row.createCell(7).setCellValue(r.getTotalEstimatedLossAmount() != null ? r.getTotalEstimatedLossAmount().doubleValue() : 0.0);
                row.createCell(8).setCellValue(r.getEvaluation() != null ? r.getEvaluation() : "TỐT");
            }

            for (int i = 0; i < columns.length; i++) {
                sheet.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        }
    }

    /**
     * Lấy danh sách nguyên liệu cấu thành món ăn (Recipe Ingredients).
     */
    @Transactional(readOnly = true)
    public List<RecipeIngredientResponse> getRecipeIngredients(Long recipeId) {
        return recipeIngredientRepository.findByRecipeId(recipeId).stream()
                .map(this::mapToRecipeIngredientResponse)
                .collect(Collectors.toList());
    }

    /**
     * Thêm nguyên liệu định lượng vào công thức món.
     */
    @Transactional
    public RecipeIngredientResponse addRecipeIngredient(Long recipeId, CreateRecipeIngredientRequest request) {
        Recipe recipe = recipeRepository.findById(recipeId)
                .orElseThrow(() -> new ResourceNotFoundException("Recipe", "id", recipeId));

        Item ingredientItem = itemRepository.findById(request.getIngredientItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Item", "id", request.getIngredientItemId()));

        RecipeIngredient ingredient = recipeIngredientRepository.findByRecipeIdAndIngredientItemId(recipeId, request.getIngredientItemId())
                .orElse(RecipeIngredient.builder()
                        .recipe(recipe)
                        .ingredientItem(ingredientItem)
                        .build());

        ingredient.setQuantity(request.getQuantity());
        ingredient.setUnit(request.getUnit() != null ? request.getUnit() : ingredientItem.getUnit());
        ingredient.setNote(request.getNote());

        RecipeIngredient saved = recipeIngredientRepository.save(ingredient);
        log.info("Thêm nguyên liệu định lượng {} cho công thức {}", ingredientItem.getItemName(), recipe.getRecipeName());
        return mapToRecipeIngredientResponse(saved);
    }

    // Helper functions
    private String generateDocumentCode(String docType) {
        String prefix = switch (docType) {
            case "NHAP" -> "PN";
            case "XUAT_CHUYEN" -> "PX";
            case "HUY" -> "PH";
            case "KIEM_KE" -> "PK";
            default -> "WH";
        };
        String dateStr = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String searchPrefix = prefix + "-" + dateStr + "-";
        long count = documentRepository.countByDocCodeStartingWith(searchPrefix) + 1;
        String code = String.format("%s%03d", searchPrefix, count);
        while (documentRepository.findByDocCode(code).isPresent()) {
            count++;
            code = String.format("%s%03d", searchPrefix, count);
        }
        return code;
    }

    private String generateBatchCode() {
        String prefix = "LOT-" + YearMonth.now().format(DateTimeFormatter.ofPattern("yyyyMM")) + "-";
        long nextNum = importBatchRepository.countByBatchCodeStartingWith(prefix) + 1;
        String batchCode = String.format("%s%03d", prefix, nextNum);
        while (importBatchRepository.existsByBatchCode(batchCode)) {
            nextNum++;
            batchCode = String.format("%s%03d", prefix, nextNum);
        }
        return batchCode;
    }

    private WarehouseDocumentResponse mapToDocumentResponse(WarehouseDocument doc) {
        List<WarehouseDocumentItemResponse> items = (doc.getItems() != null) ?
                doc.getItems().stream().map(it -> WarehouseDocumentItemResponse.builder()
                        .id(it.getId())
                        .itemId(it.getItem().getId())
                        .itemCode(it.getItem().getItemCode())
                        .itemName(it.getItem().getItemName())
                        .batchId(it.getBatch() != null ? it.getBatch().getId() : null)
                        .batchCode(it.getBatch() != null ? it.getBatch().getBatchCode() : null)
                        .quantity(it.getQuantity())
                        .unitPrice(it.getUnitPrice())
                        .lineTotal(it.getQuantity().multiply(it.getUnitPrice()).setScale(2, RoundingMode.HALF_UP))
                        .unit(it.getItem().getUnit())
                        .note(it.getNote())
                        .build()).collect(Collectors.toList()) :
                Collections.emptyList();

        return WarehouseDocumentResponse.builder()
                .id(doc.getId())
                .docType(doc.getDocType())
                .docCode(doc.getDocCode())
                .branchId(doc.getBranch().getId())
                .branchName(doc.getBranch().getBranchName())
                .supplierId(doc.getSupplier() != null ? doc.getSupplier().getId() : null)
                .supplierCode(doc.getSupplier() != null ? doc.getSupplier().getSupplierCode() : null)
                .supplierName(doc.getSupplier() != null ? doc.getSupplier().getSupplierName() : null)
                .createdById(doc.getCreatedByUser() != null ? doc.getCreatedByUser().getId() : null)
                .createdByName(doc.getCreatedByUser() != null ? doc.getCreatedByUser().getFullName() : null)
                .status(doc.getStatus())
                .note(doc.getNote())
                .totalAmount(doc.getTotalAmount())
                .imageUrls(doc.getImageUrls())
                .createdAt(doc.getCreatedAt())
                .items(items)
                .build();
    }

    public ImportBatchResponse mapToBatchResponse(ImportBatch b) {
        return ImportBatchResponse.builder()
                .id(b.getId())
                .batchCode(b.getBatchCode())
                .supplierId(b.getSupplier().getId())
                .supplierCode(b.getSupplier().getSupplierCode())
                .supplierName(b.getSupplier().getSupplierName())
                .itemId(b.getItem().getId())
                .itemCode(b.getItem().getItemCode())
                .itemName(b.getItem().getItemName())
                .branchId(b.getBranch().getId())
                .branchName(b.getBranch().getBranchName())
                .importDate(b.getImportDate())
                .expiryDate(b.getExpiryDate())
                .initialQuantity(b.getInitialQuantity())
                .currentStock(b.getCurrentStock())
                .unitPrice(b.getUnitPrice())
                .unit(b.getUnit())
                .status(b.getStatus())
                .createdAt(b.getCreatedAt())
                .build();
    }

    private RecipeIngredientResponse mapToRecipeIngredientResponse(RecipeIngredient ri) {
        return RecipeIngredientResponse.builder()
                .id(ri.getId())
                .recipeId(ri.getRecipe().getId())
                .recipeName(ri.getRecipe().getRecipeName())
                .ingredientItemId(ri.getIngredientItem().getId())
                .ingredientItemCode(ri.getIngredientItem().getItemCode())
                .ingredientItemName(ri.getIngredientItem().getItemName())
                .quantity(ri.getQuantity())
                .unit(ri.getUnit())
                .note(ri.getNote())
                .createdAt(ri.getCreatedAt())
                .build();
    }
}
