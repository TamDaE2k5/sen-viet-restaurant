package com.senviet.controller;

import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.CukCukImportResponse;
import com.senviet.domain.dto.response.ReconciliationSummaryResponse;
import com.senviet.domain.dto.response.SupplierLossResponse;
import com.senviet.security.UserPrincipal;
import com.senviet.service.CukCukExcelParserService;
import com.senviet.service.ReconciliationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;

/**
 * Controller cho Phân Hệ Đối Soát Bán Hàng CukCuk POS & Động Cơ Chống Thất Thoát Cuối Ngày.
 */
@RestController
@RequestMapping("/api/v1/reconciliation")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Reconciliation & Anti-Loss", description = "Các API đối soát cuối ngày, bóc tách Excel CukCuk POS và báo cáo tỷ lệ hỏng theo NCC")
public class ReconciliationController {

    private final ReconciliationService reconciliationService;
    private final CukCukExcelParserService cukCukExcelParserService;

    @PostMapping(value = "/cukcuk/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Nạp file Excel bán hàng CukCuk POS", description = "Bóc tách tự động doanh thu, số khách buffet người lớn, trẻ em và vé buffet")
    public ResponseEntity<ApiResponse<CukCukImportResponse>> uploadCukCukExcel(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        CukCukImportResponse response = reconciliationService.importCukCukSales(file, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Nạp file CukCuk thành công", response));
    }

    @GetMapping("/cukcuk/sample")
    @Operation(summary = "Tải file Excel mẫu CukCuk POS", description = "Tạo file Excel mẫu để kế toán và người dùng kiểm thử tính năng upload")
    public ResponseEntity<byte[]> downloadSampleCukCukExcel() {
        byte[] excelBytes = cukCukExcelParserService.generateSampleCukCukExcel();

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=CukCuk_Sample_Report.xlsx")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    @GetMapping("/daily-summary")
    @PreAuthorize("hasAnyRole('ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_EMPLOYEE')")
    @Operation(summary = "Lấy Bảng Đối Soát Cuối Ngày (6 Công Thức)", description = "Hiển thị chi tiết 6 chỉ số đối soát, cờ đỏ cảnh báo thất thoát và người kiểm kho")
    public ResponseEntity<ApiResponse<List<ReconciliationSummaryResponse>>> getDailySummary(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String shiftType,
            @RequestParam(required = false) Boolean overThresholdOnly,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long branchId = currentUser.getBranchId();
        List<ReconciliationSummaryResponse> summary = reconciliationService.getDailySummary(
                branchId, date, shiftType, overThresholdOnly);
        return ResponseEntity.ok(ApiResponse.ok("Bảng đối soát cuối ngày", summary));
    }

    @GetMapping("/supplier-loss-report")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Báo cáo tỷ lệ hỏng theo Nhà Cung Cấp", description = "Thống kê % cua chết/hàng hỏng xếp giảm dần theo từng NCC")
    public ResponseEntity<ApiResponse<List<SupplierLossResponse>>> getSupplierLossReport(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long branchId = currentUser.getBranchId();
        List<SupplierLossResponse> report = reconciliationService.getSupplierLossReport(branchId);
        return ResponseEntity.ok(ApiResponse.ok("Báo cáo tỷ lệ hỏng theo nhà cung cấp", report));
    }

    @GetMapping("/export-excel")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Xuất file Excel Bảng Đối Soát Cuối Ngày", description = "Tải file Excel định dạng báo cáo quản trị kèm tô màu đỏ dòng thất thoát")
    public ResponseEntity<byte[]> exportReconciliationExcel(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestParam(required = false) String shiftType,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long branchId = currentUser.getBranchId();
        byte[] excelBytes = reconciliationService.exportReconciliationExcel(branchId, date, shiftType);

        String fileName = String.format("BaoCaoDoiSoat_%s.xlsx", date != null ? date : LocalDate.now());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + fileName)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
