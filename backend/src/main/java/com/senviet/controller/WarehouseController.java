package com.senviet.controller;

import com.senviet.domain.dto.request.CreateInventoryCheckRequest;
import com.senviet.domain.dto.request.CreateRecipeIngredientRequest;
import com.senviet.domain.dto.request.CreateWarehouseDocumentRequest;
import com.senviet.domain.dto.response.*;
import com.senviet.security.UserPrincipal;
import com.senviet.service.InventoryCheckService;
import com.senviet.service.WarehouseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

/**
 * Controller Quản trị Kho Cơ Sở, Lô Nhập & Kiểm Kê.
 */
@RestController
@RequestMapping("/api/v1/warehouse")
@RequiredArgsConstructor
@Tag(name = "Warehouse & Lots Management", description = "Các API Phiếu nhập/xuất/huỷ kho, Lô hàng, Tồn kho, Kiểm kê đầu/cuối ca và Báo cáo NCC")
public class WarehouseController {

    private final WarehouseService warehouseService;
    private final InventoryCheckService inventoryCheckService;

    // --- 1. Phiếu Kho (Warehouse Documents) ---

    @PostMapping("/documents")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tạo phiếu nhập / xuất chuyển / huỷ kho",
            description = "Tự động sinh mã phiếu, cập nhật tồn kho tức thời, sinh mã lô nhập mới khi nhập hàng")
    public ResponseEntity<ApiResponse<WarehouseDocumentResponse>> createDocument(
            @Valid @RequestBody CreateWarehouseDocumentRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        WarehouseDocumentResponse response = warehouseService.createDocument(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Tạo phiếu kho thành công", response));
    }

    @GetMapping("/documents")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tra cứu danh sách phiếu kho", description = "Lọc theo chi nhánh, loại phiếu, trạng thái và thời gian")
    public ResponseEntity<ApiResponse<List<WarehouseDocumentResponse>>> getDocuments(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String docType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Instant fromTime,
            @RequestParam(required = false) Instant toTime,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId :
                (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());

        List<WarehouseDocumentResponse> documents = warehouseService.getDocuments(targetBranchId, docType, status, fromTime, toTime);
        return ResponseEntity.ok(ApiResponse.ok(documents));
    }

    @GetMapping("/documents/{id}")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy chi tiết phiếu kho theo ID")
    public ResponseEntity<ApiResponse<WarehouseDocumentResponse>> getDocumentById(@PathVariable Long id) {
        WarehouseDocumentResponse document = warehouseService.getDocumentById(id);
        return ResponseEntity.ok(ApiResponse.ok(document));
    }

    // --- 2. Lô Hàng & Tồn Kho (Batches & Inventory Stocks) ---

    @GetMapping("/batches/available")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy danh sách lô hàng còn tồn kho",
            description = "Tra cứu các lô hàng còn current_stock > 0 theo chi nhánh và mặt hàng")
    public ResponseEntity<ApiResponse<List<ImportBatchResponse>>> getAvailableBatches(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) Long itemId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : currentUser.getBranchId();
        List<ImportBatchResponse> batches = warehouseService.getAvailableBatches(targetBranchId, itemId);
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }

    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tra cứu tất cả lô hàng với bộ lọc")
    public ResponseEntity<ApiResponse<List<ImportBatchResponse>>> searchBatches(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) Long itemId,
            @RequestParam(required = false) Long supplierId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId :
                (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());

        List<ImportBatchResponse> batches = warehouseService.searchBatches(targetBranchId, startDate, endDate, itemId, supplierId);
        return ResponseEntity.ok(ApiResponse.ok(batches));
    }

    @GetMapping("/stocks")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy danh sách tồn kho theo chi nhánh", description = "Tồn kho chi tiết theo mặt hàng và từng lô nhập")
    public ResponseEntity<ApiResponse<List<InventoryStockResponse>>> getInventoryStocks(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : currentUser.getBranchId();
        List<InventoryStockResponse> stocks = warehouseService.getInventoryStocks(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok(stocks));
    }

    // --- 3. Kiểm Kê Kho (Inventory Checks) ---

    @PostMapping("/inventory-checks")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tạo biên bản kiểm kê kho đầu ca / cuối ca",
            description = "Tự động tính chênh lệch thực tế vs hệ thống, bắt buộc nhập lý do khi có sai lệch, đồng bộ vào snapshot đối soát")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> createInventoryCheck(
            @Valid @RequestBody CreateInventoryCheckRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        InventoryCheckResponse check = inventoryCheckService.createInventoryCheck(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Lập biên bản kiểm kê kho thành công", check));
    }

    @GetMapping("/inventory-checks")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Tra cứu danh sách biên bản kiểm kê")
    public ResponseEntity<ApiResponse<List<InventoryCheckResponse>>> getInventoryChecks(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkDate,
            @RequestParam(required = false) String shift,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId :
                (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());

        List<InventoryCheckResponse> checks = inventoryCheckService.getInventoryChecks(targetBranchId, checkDate, shift);
        return ResponseEntity.ok(ApiResponse.ok(checks));
    }

    @GetMapping("/inventory-checks/{id}")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy chi tiết biên bản kiểm kê theo ID")
    public ResponseEntity<ApiResponse<InventoryCheckResponse>> getInventoryCheckById(@PathVariable Long id) {
        InventoryCheckResponse check = inventoryCheckService.getInventoryCheckById(id);
        return ResponseEntity.ok(ApiResponse.ok(check));
    }

    // --- 4. Báo Cáo % Hỏng Theo Nhà Cung Cấp & Lô Nhập (Supplier Loss Report) ---

    @GetMapping("/reports/supplier-loss")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Báo cáo tỷ lệ hỏng theo Nhà cung cấp & Lô nhập",
            description = "Tính % Hỏng = (Kg hỏng / Kg nhập) * 100%, sắp xếp giảm dần theo % hỏng")
    public ResponseEntity<ApiResponse<List<SupplierLossResponse>>> getSupplierLossReport(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long itemId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId :
                (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());

        List<SupplierLossResponse> report = warehouseService.getSupplierLossReport(targetBranchId, month, itemId);
        return ResponseEntity.ok(ApiResponse.ok(report));
    }

    @GetMapping("/reports/supplier-loss/export")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Xuất file Excel báo cáo % hỏng theo Nhà cung cấp",
            description = "File Excel định dạng chuẩn Apache POI phục vụ đối soát và khiếu nại nhà cung cấp")
    public ResponseEntity<byte[]> exportSupplierLossReport(
            @RequestParam(required = false) Long branchId,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long itemId,
            @AuthenticationPrincipal UserPrincipal currentUser) throws IOException {
        Long targetBranchId = branchId != null ? branchId :
                (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());

        byte[] excelBytes = warehouseService.exportSupplierLossReportExcel(targetBranchId, month, itemId);
        String filename = "Bao_Cao_Ty_Le_Hong_NCC_" + (month != null ? month : "Tat_Ca") + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // --- 5. Công Thức Định Lượng Nhiều Nguyên Liệu Cấu Thành Món (Recipe Ingredients) ---

    @GetMapping("/recipes/{recipeId}/ingredients")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy danh sách nguyên liệu cấu thành món ăn")
    public ResponseEntity<ApiResponse<List<RecipeIngredientResponse>>> getRecipeIngredients(@PathVariable Long recipeId) {
        List<RecipeIngredientResponse> ingredients = warehouseService.getRecipeIngredients(recipeId);
        return ResponseEntity.ok(ApiResponse.ok(ingredients));
    }

    @PostMapping("/recipes/{recipeId}/ingredients")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Thêm hoặc cập nhật nguyên liệu cấu thành món ăn")
    public ResponseEntity<ApiResponse<RecipeIngredientResponse>> addRecipeIngredient(
            @PathVariable Long recipeId,
            @Valid @RequestBody CreateRecipeIngredientRequest request) {
        RecipeIngredientResponse response = warehouseService.addRecipeIngredient(recipeId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm nguyên liệu vào công thức thành công", response));
    }
}
