package com.senviet.controller;

import com.senviet.domain.dto.request.CreateSupplierRequest;
import com.senviet.domain.dto.request.UpdateSupplierRequest;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.SupplierResponse;
import com.senviet.service.SupplierService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller Quản lý Nhà Cung Cấp.
 */
@RestController
@RequestMapping("/api/v1/suppliers")
@RequiredArgsConstructor
@Tag(name = "Suppliers Management", description = "Các API tra cứu, thêm mới, sửa đổi thông tin Nhà cung cấp")
public class SupplierController {

    private final SupplierService supplierService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy danh sách nhà cung cấp", description = "Hỗ trợ tìm kiếm theo từ khóa (mã, tên, số điện thoại) và lọc theo trạng thái")
    public ResponseEntity<ApiResponse<List<SupplierResponse>>> getSuppliers(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status) {
        List<SupplierResponse> suppliers = supplierService.getSuppliers(keyword, status);
        return ResponseEntity.ok(ApiResponse.ok(suppliers));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Lấy chi tiết nhà cung cấp theo ID")
    public ResponseEntity<ApiResponse<SupplierResponse>> getSupplierById(@PathVariable Long id) {
        SupplierResponse supplier = supplierService.getSupplierById(id);
        return ResponseEntity.ok(ApiResponse.ok(supplier));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Thêm mới nhà cung cấp", description = "Yêu cầu mã NCC duy nhất, không trùng lặp")
    public ResponseEntity<ApiResponse<SupplierResponse>> createSupplier(
            @Valid @RequestBody CreateSupplierRequest request) {
        SupplierResponse created = supplierService.createSupplier(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Thêm mới nhà cung cấp thành công", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Cập nhật thông tin nhà cung cấp")
    public ResponseEntity<ApiResponse<SupplierResponse>> updateSupplier(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSupplierRequest request) {
        SupplierResponse updated = supplierService.updateSupplier(id, request);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật thông tin nhà cung cấp thành công", updated));
    }
}
