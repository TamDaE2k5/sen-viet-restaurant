package com.senviet.controller;

import com.senviet.domain.dto.request.*;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.BatchResponse;
import com.senviet.domain.dto.response.RecipeResponse;
import com.senviet.domain.entity.DamageReport;
import com.senviet.domain.entity.Item;
import com.senviet.domain.entity.LineItemLog;
import com.senviet.domain.entity.Recipe;
import com.senviet.domain.entity.TakeOutLog;
import com.senviet.security.UserPrincipal;
import com.senviet.service.KitchenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller cho Phân hệ Bếp (4 Nút Bấm Lớn Mobile) & Quản lý Chế Biến Mẻ.
 */
@RestController
@RequestMapping("/api/v1/kitchen")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Kitchen Operations", description = "Các API vận hành kho bếp: Lấy hàng, Chế biến mẻ, Ra line, Báo hỏng")
public class KitchenController {

    private final KitchenService kitchenService;

    @GetMapping("/items")
    @Operation(summary = "Lấy danh sách các món ăn quầy buffet")
    public ResponseEntity<ApiResponse<List<Item>>> getBuffetItems() {
        List<Item> items = kitchenService.getAllBuffetItems();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách món ăn", items));
    }

    @GetMapping("/recipes")
    @Operation(summary = "Lấy danh sách công thức & % hao hụt chuẩn")
    public ResponseEntity<ApiResponse<List<RecipeResponse>>> getAllRecipes() {
        List<RecipeResponse> recipes = kitchenService.getAllRecipes();
        return ResponseEntity.ok(ApiResponse.ok("Danh sách công thức chế biến", recipes));
    }

    @GetMapping("/items/search")
    @Operation(summary = "Tìm kiếm nguyên liệu / món ăn", description = "Tìm kiếm theo Barcode, Mã Code hoặc Tên nguyên liệu")
    public ResponseEntity<ApiResponse<List<Item>>> searchItems(@RequestParam(required = false) String code) {
        List<Item> items = kitchenService.searchItems(code);
        return ResponseEntity.ok(ApiResponse.ok("Kết quả tìm kiếm", items));
    }

    @PostMapping("/take-out")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nút 1: Lấy Hàng", description = "Ghi nhận xuất kho sơ bộ nguyên liệu ra khu vực bếp")
    public ResponseEntity<ApiResponse<TakeOutLog>> recordTakeOut(
            @Valid @RequestBody TakeOutRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        TakeOutLog logEntry = kitchenService.recordTakeOut(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy hàng thành công", logEntry));
    }

    @PostMapping("/processing/start")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nút 2A: Khởi tạo mẻ chế biến", description = "Tạo mẻ chế biến kèm cảnh báo đỏ nếu đang có mẻ chưa hoàn thành")
    public ResponseEntity<ApiResponse<BatchResponse>> startBatch(
            @Valid @RequestBody StartBatchRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BatchResponse response = kitchenService.startBatch(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Khởi tạo mẻ thành công", response));
    }

    @PostMapping("/processing/finish")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nút 2B: Hoàn thành cân mẻ thành phẩm", description = "Tính % hao hụt thực tế và đánh dấu cờ nếu vượt định mức")
    public ResponseEntity<ApiResponse<BatchResponse>> finishBatch(
            @Valid @RequestBody FinishBatchRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BatchResponse response = kitchenService.finishBatch(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Hoàn thành mẻ thành công", response));
    }

    @GetMapping("/processing/active")
    @Operation(summary = "Lấy danh sách các mẻ đang chế biến dở dang (DANG_LAM)")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getActiveBatches(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BatchResponse> batches = kitchenService.getActiveBatches(currentUser.getBranchId());
        return ResponseEntity.ok(ApiResponse.ok("Danh sách mẻ đang làm", batches));
    }

    @GetMapping("/processing/batches")
    @Operation(summary = "Lấy toàn bộ lịch sử các mẻ chế biến của chi nhánh")
    public ResponseEntity<ApiResponse<List<BatchResponse>>> getAllBatches(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<BatchResponse> batches = kitchenService.getAllBatches(currentUser.getBranchId());
        return ResponseEntity.ok(ApiResponse.ok("Lịch sử mẻ chế biến", batches));
    }

    @PostMapping("/line-items/inc")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nút 3: Ra Line (+1)", description = "Ghi nhận đưa khay ra line buffet kèm cơ chế chống double-click")
    public ResponseEntity<ApiResponse<LineItemLog>> recordLineItem(
            @Valid @RequestBody LineItemIncRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        LineItemLog logEntry = kitchenService.recordLineItem(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Ghi nhận ra line thành công", logEntry));
    }

    @PostMapping("/damage-reports")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nút 4: Báo Hỏng nguyên liệu", description = "Báo hỏng kèm ảnh và tự động duyệt nếu giá trị <= 500k")
    public ResponseEntity<ApiResponse<DamageReport>> recordDamageReport(
            @Valid @RequestBody DamageReportRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DamageReport report = kitchenService.recordDamageReport(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Ghi nhận báo hỏng thành công", report));
    }

    @GetMapping("/damage-reports")
    @Operation(summary = "Lấy danh sách các đơn báo hỏng của chi nhánh")
    public ResponseEntity<ApiResponse<List<DamageReport>>> getDamageReports(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<DamageReport> reports = kitchenService.getDamageReports(currentUser.getBranchId());
        return ResponseEntity.ok(ApiResponse.ok("Danh sách báo hỏng", reports));
    }

    @PutMapping("/damage-reports/{id}/approve")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Duyệt đơn báo hỏng nguyên liệu", description = "Dành cho Quản lý chi nhánh / Kế toán duyệt các đơn > 500k")
    public ResponseEntity<ApiResponse<DamageReport>> approveDamageReport(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        DamageReport report = kitchenService.approveDamageReport(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Duyệt đơn báo hỏng thành công", report));
    }
}
