package com.senviet.controller;

import com.senviet.domain.dto.request.DisburseAdvanceRequest;
import com.senviet.domain.dto.request.SalaryAdvanceRequest;
import com.senviet.domain.dto.request.UnlockPeriodRequest;
import com.senviet.domain.dto.request.UpdateAdvanceRequest;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.PayrollPeriodResponse;
import com.senviet.domain.dto.response.PayrollResponse;
import com.senviet.domain.dto.response.PayrollSummaryResponse;
import com.senviet.domain.dto.response.SalaryAdvanceResponse;
import com.senviet.domain.dto.response.SalaryIncreaseProposalDto;
import com.senviet.security.UserPrincipal;
import com.senviet.service.PayrollService;
import com.senviet.service.SalaryAdvanceService;
import com.senviet.service.SalaryIncreaseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

/**
 * Controller Quản Lý Ứng Lương, Xét Tăng Lương Định Kỳ, Khóa Bảng Lương & Tổng Hợp Chi Phí.
 */
@RestController
@RequestMapping({"/api/v1/payroll", "/api/v1/hr"})
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payroll & Salary Advances", description = "Các API ứng lương, duyệt chi, khóa bảng lương, bóc tách lương bỏ việc và chốt lương tự động")
public class PayrollController {

    private final SalaryAdvanceService salaryAdvanceService;
    private final SalaryIncreaseService salaryIncreaseService;
    private final PayrollService payrollService;

    // ==========================================
    // 1. TẠM ỨNG LƯƠNG
    // ==========================================

    @PostMapping("/advances")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Nhân viên gửi đơn xin ứng lương", description = "Tối đa 1 đơn chờ duyệt tại một thời điểm")
    public ResponseEntity<ApiResponse<SalaryAdvanceResponse>> requestAdvance(
            @Valid @RequestBody SalaryAdvanceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SalaryAdvanceResponse res = salaryAdvanceService.requestAdvance(request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Gửi đơn xin ứng lương thành công", res));
    }

    @GetMapping("/advances")
    @PreAuthorize("hasAnyRole('ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Danh sách đơn xin ứng lương của chi nhánh", description = "Dành cho Quản lý và Kế toán theo dõi duyệt chi")
    public ResponseEntity<ApiResponse<List<SalaryAdvanceResponse>>> getAdvances(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<SalaryAdvanceResponse> list = salaryAdvanceService.getAdvancesByBranch(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đơn ứng lương thành công", list));
    }

    @GetMapping("/advances/my")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Lịch sử xin ứng lương cá nhân", description = "Nhân viên tra cứu các lần xin ứng lương của mình")
    public ResponseEntity<ApiResponse<List<SalaryAdvanceResponse>>> getMyAdvances(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<SalaryAdvanceResponse> list = salaryAdvanceService.getMyAdvances(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy lịch sử ứng lương thành công", list));
    }

    @PutMapping("/advances/{id}/disburse")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Kế toán duyệt chi ứng lương", description = "Nhập số tiền thực chi và tháng khấu trừ lương YYYY-MM")
    public ResponseEntity<ApiResponse<SalaryAdvanceResponse>> disburseAdvance(
            @PathVariable Long id,
            @Valid @RequestBody DisburseAdvanceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SalaryAdvanceResponse res = salaryAdvanceService.disburseAdvance(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Duyệt chi ứng lương thành công", res));
    }

    @PutMapping({"/advances/{id}", "/payroll/advances/{id}"})
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF')")
    @Operation(summary = "Sửa đơn ứng lương", description = "Chỉ cho phép sửa khi kỳ bảng lương chưa bị khóa (LOCKED)")
    public ResponseEntity<ApiResponse<SalaryAdvanceResponse>> updateAdvance(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAdvanceRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SalaryAdvanceResponse res = salaryAdvanceService.updateAdvance(id, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật đơn ứng lương thành công", res));
    }

    @DeleteMapping({"/advances/{id}", "/payroll/advances/{id}"})
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF')")
    @Operation(summary = "Hủy đơn ứng lương", description = "Chỉ cho phép hủy khi kỳ bảng lương chưa bị khóa (LOCKED)")
    public ResponseEntity<ApiResponse<Void>> deleteAdvance(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        salaryAdvanceService.deleteAdvance(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã hủy đơn ứng lương thành công", null));
    }

    // ==========================================
    // 2. XÉT TĂNG LƯƠNG ĐỊNH KỲ QUÝ
    // ==========================================

    @PostMapping("/increases/scan")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Tự động quét điều kiện tăng lương theo quý", description = "Kiểm tra 3 điều kiện: Điểm thi >=80, Đi muộn <=3, Không nghỉ không phép")
    public ResponseEntity<ApiResponse<List<SalaryIncreaseProposalDto>>> scanIncreaseEligibility(
            @RequestParam(required = false, defaultValue = "Q4-2026") String quarter,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<SalaryIncreaseProposalDto> list = salaryIncreaseService.scanQuarterlyIncreaseEligibility(targetBranchId, quarter);
        return ResponseEntity.ok(ApiResponse.ok("Quét điều kiện tăng lương hoàn tất", list));
    }

    @GetMapping("/increases")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Danh sách đề xuất tăng lương", description = "Theo dõi các đề xuất tăng lương định kỳ")
    public ResponseEntity<ApiResponse<List<SalaryIncreaseProposalDto>>> getIncreaseProposals(
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<SalaryIncreaseProposalDto> list = salaryIncreaseService.getProposalsByBranch(targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách đề xuất tăng lương thành công", list));
    }

    @PutMapping("/increases/{id}/approve")
    @PreAuthorize("hasAnyRole('ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Duyệt tăng lương cho nhân viên", description = "Cộng trực tiếp số tiền tăng vào lương cơ bản của nhân viên")
    public ResponseEntity<ApiResponse<SalaryIncreaseProposalDto>> approveIncrease(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        SalaryIncreaseProposalDto res = salaryIncreaseService.approveProposal(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Đã duyệt tăng lương thành công", res));
    }

    // ==========================================
    // 3. BẢNG LƯƠNG TỰ ĐỘNG & XUẤT CHUYỂN KHOẢN
    // ==========================================

    @PostMapping("/payroll/generate")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Tổng hợp bảng lương tự động", description = "Tự động tính ngày công, khấu trừ tạm ứng, khóa lương bỏ việc và giữ lương đồng phục")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> generatePayroll(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<PayrollResponse> list = payrollService.generateMonthlyPayroll(month, targetBranchId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Tổng hợp bảng lương tháng thành công", list));
    }

    @GetMapping("/payroll")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Xem bảng lương chi nhánh theo tháng", description = "Hiển thị chi tiết lương cơ bản, ngày công, tạm ứng, thực lĩnh")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getPayroll(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        List<PayrollResponse> list = payrollService.getPayrolls(month, targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy bảng lương thành công", list));
    }

    @GetMapping("/payroll/my")
    @PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")
    @Operation(summary = "Xem phiếu lương cá nhân", description = "Nhân viên xem chi tiết thu nhập thực lĩnh của mình theo từng tháng")
    public ResponseEntity<ApiResponse<List<PayrollResponse>>> getMyPayrolls(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        List<PayrollResponse> list = payrollService.getMyPayrolls(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.ok("Lấy phiếu lương cá nhân thành công", list));
    }

    @GetMapping("/payroll/{month}/export-bank")
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Xuất danh sách lệnh chi chuyển khoản ngân hàng", description = "File Excel định dạng chuẩn, tự động loại trừ nhân viên bỏ việc và giữ lương")
    public ResponseEntity<byte[]> exportBankTransfer(
            @PathVariable String month,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) throws IOException {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        byte[] excelBytes = payrollService.exportBankTransferExcel(month, targetBranchId);

        String filename = "Lenh_Chi_Ngan_Hang_" + month + ".xlsx";
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }

    // ==========================================
    // 4. CHỐT & KHÓA BẢNG LƯƠNG (PAYROLL LOCK)
    // ==========================================

    @PostMapping({"/lock/{periodMonth}", "/payroll/lock/{periodMonth}"})
    @PreAuthorize("hasRole('ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Chốt và Khóa bảng lương tháng (Payroll Lock)", description = "Kế toán tổng khóa bảng lương tháng ngăn chặn chỉnh sửa hoặc hủy đơn ứng")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> lockPayrollPeriod(
            @PathVariable String periodMonth,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PayrollPeriodResponse res = payrollService.lockPayrollPeriod(periodMonth, branchId, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Chốt và khóa bảng lương tháng " + periodMonth + " thành công", res));
    }

    @PostMapping({"/unlock/{periodMonth}", "/payroll/unlock/{periodMonth}"})
    @PreAuthorize("hasRole('ROLE_GENERAL_ACCOUNTANT')")
    @Operation(summary = "Mở khóa kỳ bảng lương", description = "Kế toán tổng mở khóa kỳ bảng lương kèm bắt buộc nhập lý do")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> unlockPayrollPeriod(
            @PathVariable String periodMonth,
            @RequestParam(required = false) Long branchId,
            @Valid @RequestBody UnlockPeriodRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        PayrollPeriodResponse res = payrollService.unlockPayrollPeriod(periodMonth, branchId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Mở khóa bảng lương tháng " + periodMonth + " thành công", res));
    }

    @GetMapping({"/periods/{periodMonth}", "/payroll/periods/{periodMonth}"})
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Kiểm tra trạng thái kỳ bảng lương", description = "Kiểm tra kỳ bảng lương đang OPEN hay LOCKED")
    public ResponseEntity<ApiResponse<PayrollPeriodResponse>> getPayrollPeriod(
            @PathVariable String periodMonth,
            @RequestParam(required = false) Long branchId) {
        PayrollPeriodResponse res = payrollService.getPayrollPeriod(periodMonth, branchId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy trạng thái kỳ bảng lương thành công", res));
    }

    @GetMapping({"/summary", "/payroll/summary"})
    @PreAuthorize("hasAnyRole('ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT', 'ROLE_RESTAURANT_MANAGER')")
    @Operation(summary = "Báo cáo tổng hợp chi phí bảng lương chi nhánh", description = "Bóc tách riêng dòng lương không trả do bỏ việc khỏi tổng chi phí lãi lỗ")
    public ResponseEntity<ApiResponse<PayrollSummaryResponse>> getPayrollSummary(
            @RequestParam(required = false) String month,
            @RequestParam(required = false) Long branchId,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        Long targetBranchId = branchId != null ? branchId : (currentUser.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_GENERAL_ACCOUNTANT")) ? null : currentUser.getBranchId());
        PayrollSummaryResponse summary = payrollService.getPayrollSummary(month, targetBranchId);
        return ResponseEntity.ok(ApiResponse.ok("Tổng hợp chi phí bảng lương thành công", summary));
    }
}
