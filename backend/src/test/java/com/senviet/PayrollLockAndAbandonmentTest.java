package com.senviet;

import com.senviet.domain.dto.request.DisburseAdvanceRequest;
import com.senviet.domain.dto.request.UnlockPeriodRequest;
import com.senviet.domain.dto.request.UpdateAdvanceRequest;
import com.senviet.domain.dto.response.PayrollPeriodResponse;
import com.senviet.domain.dto.response.PayrollResponse;
import com.senviet.domain.dto.response.PayrollSummaryResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.*;
import com.senviet.exception.ApiException;
import com.senviet.security.UserPrincipal;
import com.senviet.service.AttendanceService;
import com.senviet.service.PayrollService;
import com.senviet.service.SalaryAdvanceService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử toàn diện các quy tắc nghiệp vụ Phase 10:
 * 1. Khóa bảng lương (Payroll Lock) chặn sửa/hủy đơn ứng lương
 * 2. Nhân viên bỏ việc: Lương = 0 đ, excluded_from_cost = true, note "Bỏ việc — không trả theo quy định"
 * 3. Kế toán tổng hủy xác nhận bỏ việc nhầm
 * 4. Bóc tách dòng 'Lương không trả do bỏ việc' khỏi chi phí chi nhánh
 * 5. Lý do giữ lương chi tiết: 'Đang giữ — thiếu [Danh sách]'
 */
@ExtendWith(MockitoExtension.class)
class PayrollLockAndAbandonmentTest {

    private SalaryAdvanceService salaryAdvanceService;
    private PayrollService payrollService;
    private AttendanceService attendanceService;

    @Mock
    private SalaryAdvanceRepository salaryAdvanceRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BranchRepository branchRepository;

    @Mock
    private PayrollPeriodRepository payrollPeriodRepository;

    @Mock
    private PayrollRepository payrollRepository;

    @Mock
    private AttendanceRepository attendanceRepository;

    @Mock
    private SalaryIncreaseProposalRepository proposalRepository;

    @Mock
    private ResignationRequestRepository resignationRequestRepository;

    @Mock
    private SalaryRuleRepository salaryRuleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    private UserPrincipal generalAccountant;
    private UserPrincipal branchAccountant;
    private Branch branch;
    private User employee;

    @BeforeEach
    void setUp() {
        salaryAdvanceService = new SalaryAdvanceService(
                salaryAdvanceRepository,
                userRepository,
                branchRepository,
                payrollPeriodRepository
        );

        payrollService = new PayrollService(
                payrollRepository,
                userRepository,
                branchRepository,
                attendanceRepository,
                salaryAdvanceRepository,
                proposalRepository,
                resignationRequestRepository,
                salaryRuleRepository,
                payrollPeriodRepository,
                auditLogRepository,
                notificationLogRepository
        );

        attendanceService = new AttendanceService(
                attendanceRepository,
                branchRepository,
                userRepository,
                resignationRequestRepository,
                payrollRepository,
                auditLogRepository,
                notificationLogRepository
        );

        generalAccountant = UserPrincipal.builder()
                .id(1L)
                .username("ketoan_tong")
                .fullName("Kế Toán Tổng")
                .authorities(Collections.emptyList())
                .build();

        branchAccountant = UserPrincipal.builder()
                .id(2L)
                .username("ketoan_thainguyen")
                .fullName("Lê Kế Toán")
                .branchId(1L)
                .authorities(Collections.emptyList())
                .build();

        branch = Branch.builder()
                .id(1L)
                .branchCode("CN_THAI_NGUYEN")
                .branchName("Chi nhánh Thái Nguyên")
                .build();

        employee = User.builder()
                .id(10L)
                .username("bep_thainguyen")
                .fullName("Nguyễn Văn Bếp")
                .branch(branch)
                .status("ACTIVE")
                .baseSalary(new BigDecimal("8500000.00"))
                .build();
    }

    @Test
    @DisplayName("Khóa bảng lương: Cố tình sửa đơn ứng lương khi kỳ lương đã LOCKED -> Chặn với ApiException (HTTP 400)")
    void testLockedPayrollPeriod_BlocksAdvanceUpdate() {
        SalaryAdvance advance = SalaryAdvance.builder()
                .id(100L)
                .user(employee)
                .branch(branch)
                .deductionMonth("2026-11")
                .requestedAmount(new BigDecimal("2000000.00"))
                .status("DA_CHI")
                .build();

        when(salaryAdvanceRepository.findById(100L)).thenReturn(Optional.of(advance));

        PayrollPeriod lockedPeriod = PayrollPeriod.builder()
                .id(1L)
                .periodMonth("2026-11")
                .branch(branch)
                .status("LOCKED")
                .build();

        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L))
                .thenReturn(Optional.of(lockedPeriod));

        UpdateAdvanceRequest updateRequest = UpdateAdvanceRequest.builder()
                .requestedAmount(new BigDecimal("2500000.00"))
                .reason("Cần thêm tiền mua dụng cụ")
                .build();

        assertThatThrownBy(() -> salaryAdvanceService.updateAdvance(100L, updateRequest, branchAccountant))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã được chốt và khóa. Không được phép chỉnh sửa");

        verify(salaryAdvanceRepository, never()).save(any());
    }

    @Test
    @DisplayName("Khóa bảng lương: Cố tình hủy đơn ứng lương khi kỳ lương đã LOCKED -> Chặn với ApiException (HTTP 400)")
    void testLockedPayrollPeriod_BlocksAdvanceDelete() {
        SalaryAdvance advance = SalaryAdvance.builder()
                .id(100L)
                .user(employee)
                .branch(branch)
                .deductionMonth("2026-11")
                .requestedAmount(new BigDecimal("2000000.00"))
                .build();

        when(salaryAdvanceRepository.findById(100L)).thenReturn(Optional.of(advance));

        PayrollPeriod lockedPeriod = PayrollPeriod.builder()
                .periodMonth("2026-11")
                .branch(branch)
                .status("LOCKED")
                .build();

        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L))
                .thenReturn(Optional.of(lockedPeriod));

        assertThatThrownBy(() -> salaryAdvanceService.deleteAdvance(100L, branchAccountant))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("đã được chốt và khóa. Không được phép hủy");

        verify(salaryAdvanceRepository, never()).delete(any());
    }

    @Test
    @DisplayName("Khóa bảng lương: Kế toán tổng chốt và khóa kỳ bảng lương thành công -> Ghi AuditLog")
    void testLockPayrollPeriod_Success() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).username("ketoan_tong").build()));
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));
        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L)).thenReturn(Optional.empty());
        when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

        Payroll p1 = Payroll.builder().id(1L).payrollMonth("2026-11").branch(branch).status("CHO_DUYET").build();
        when(payrollRepository.findByPayrollMonthAndBranchId("2026-11", 1L)).thenReturn(List.of(p1));

        PayrollPeriodResponse response = payrollService.lockPayrollPeriod("2026-11", 1L, generalAccountant);

        assertThat(response.getStatus()).isEqualTo("LOCKED");
        assertThat(p1.getStatus()).isEqualTo("LOCKED");
        verify(payrollPeriodRepository, times(1)).save(any(PayrollPeriod.class));
        verify(payrollRepository, times(1)).saveAll(any());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Mở khóa bảng lương: Phải nhập lý do mở khóa và ghi audit log")
    void testUnlockPayrollPeriod_RequiresReason() {
        // Rỗng lý do -> Bị từ chối
        assertThatThrownBy(() -> payrollService.unlockPayrollPeriod("2026-11", 1L, new UnlockPeriodRequest(""), generalAccountant))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Lý do mở khóa kỳ bảng lương bắt buộc");

        // Hợp lệ
        PayrollPeriod lockedPeriod = PayrollPeriod.builder().id(1L).periodMonth("2026-11").branch(branch).status("LOCKED").build();
        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L)).thenReturn(Optional.of(lockedPeriod));
        when(payrollPeriodRepository.save(any(PayrollPeriod.class))).thenAnswer(inv -> inv.getArgument(0));

        Payroll p1 = Payroll.builder().id(1L).payrollMonth("2026-11").branch(branch).status("LOCKED").build();
        when(payrollRepository.findByPayrollMonthAndBranchId("2026-11", 1L)).thenReturn(List.of(p1));

        PayrollPeriodResponse response = payrollService.unlockPayrollPeriod("2026-11", 1L, new UnlockPeriodRequest("Điều chỉnh công bếp"), generalAccountant);

        assertThat(response.getStatus()).isEqualTo("OPEN");
        assertThat(p1.getStatus()).isEqualTo("CHO_DUYET");
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    @DisplayName("Nhân viên bỏ việc: Lương = 0 đ, công vẫn hiện (19 ngày), note 'Bỏ việc — không trả theo quy định', excluded_from_cost = true")
    void testAbandonedEmployee_ZeroSalary_ExcludedFromCost() {
        when(userRepository.findByBranchId(1L)).thenReturn(List.of(employee));

        ResignationRequest abandonReq = ResignationRequest.builder()
                .id(50L)
                .user(employee)
                .isAbandoned(true)
                .status("BO_VIEC")
                .build();

        when(resignationRequestRepository.findFirstByUserIdAndStatusNot(employee.getId(), "HOAN_TAT"))
                .thenReturn(Optional.of(abandonReq));

        when(salaryRuleRepository.findFirstByBranchId(1L)).thenReturn(Optional.empty());
        when(proposalRepository.findByUserIdAndStatus(employee.getId(), "DA_DUYET")).thenReturn(Collections.emptyList());
        when(salaryAdvanceRepository.findByUserIdAndDeductionMonth(employee.getId(), "2026-11")).thenReturn(Collections.emptyList());
        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L)).thenReturn(Optional.empty());
        when(payrollRepository.findByUserIdAndPayrollMonth(employee.getId(), "2026-11")).thenReturn(Optional.empty());
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(inv -> inv.getArgument(0));

        List<PayrollResponse> responses = payrollService.generateMonthlyPayroll("2026-11", 1L, generalAccountant);

        assertThat(responses).hasSize(1);
        PayrollResponse res = responses.get(0);

        assertThat(res.getNetSalary()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(res.getStatus()).isEqualTo("BO_VIEC");
        assertThat(res.getNote()).contains("Bỏ việc — không trả theo quy định");
        assertThat(res.getExcludedFromCost()).isTrue();
        assertThat(res.getActualWorkDays()).isGreaterThan(BigDecimal.ZERO); // Công vẫn hiển thị
    }

    @Test
    @DisplayName("Báo cáo bảng lương: Bóc tách 'Lương không trả do bỏ việc' ra khỏi chi phí chi nhánh")
    void testPayrollSummary_ExcludesAbandonedFromBranchCost() {
        // Nhân viên 1: Bình thường, lương thực lĩnh 8.000.000 đ
        Payroll p1 = Payroll.builder()
                .id(1L)
                .user(employee)
                .branch(branch)
                .payrollMonth("2026-11")
                .baseSalary(new BigDecimal("8000000.00"))
                .netSalary(new BigDecimal("8000000.00"))
                .excludedFromCost(false)
                .isAbandoned(false)
                .status("CHO_DUYET")
                .build();

        // Nhân viên 2: Bỏ việc, lương thực lĩnh = 0 đ, excludedFromCost = true
        User abandonedUser = User.builder().id(11L).username("nv_boviec").fullName("Lê Bỏ Việc").branch(branch).build();
        Payroll p2 = Payroll.builder()
                .id(2L)
                .user(abandonedUser)
                .branch(branch)
                .payrollMonth("2026-11")
                .baseSalary(new BigDecimal("7500000.00"))
                .standardWorkDays(new BigDecimal("26.0"))
                .actualWorkDays(new BigDecimal("20.0"))
                .allowance(new BigDecimal("500000.00"))
                .netSalary(BigDecimal.ZERO)
                .excludedFromCost(true)
                .isAbandoned(true)
                .status("BO_VIEC")
                .note("Bỏ việc — không trả theo quy định")
                .build();

        when(payrollRepository.findByBranchIdAndPayrollMonthOrderByUserId(1L, "2026-11")).thenReturn(List.of(p1, p2));
        when(payrollPeriodRepository.findByPeriodMonthAndBranchId("2026-11", 1L)).thenReturn(Optional.empty());
        when(branchRepository.findById(1L)).thenReturn(Optional.of(branch));

        PayrollSummaryResponse summary = payrollService.getPayrollSummary("2026-11", 1L);

        // Chi phí chi nhánh CHỈ chứa nhân viên p1 (8.000.000 đ), không bị đội chi phí nhân viên bỏ việc
        assertThat(summary.getTotalBranchCost()).isEqualByComparingTo(new BigDecimal("8000000.00"));

        // Dòng riêng bóc tách: 'Lương không trả do bỏ việc'
        assertThat(summary.getTotalUnpaidAbandonedSalary()).isGreaterThan(BigDecimal.ZERO);
        assertThat(summary.getAbandonedCount()).isEqualTo(1);
    }

    @Test
    @DisplayName("Kế toán tổng hủy xác nhận bỏ việc nhầm: Khôi phục ACTIVE, tính lại lương và ghi AuditLog")
    void testCancelAccidentalAbandonment_RestoresEmployeeAndSalary() {
        User inactiveUser = User.builder()
                .id(15L)
                .username("nv_nham")
                .fullName("Phạm Văn Nhầm")
                .status("INACTIVE")
                .baseSalary(new BigDecimal("8000000.00"))
                .branch(branch)
                .build();

        ResignationRequest req = ResignationRequest.builder()
                .id(88L)
                .user(inactiveUser)
                .branch(branch)
                .status("BO_VIEC")
                .isAbandoned(true)
                .build();

        Payroll payroll = Payroll.builder()
                .id(5L)
                .user(inactiveUser)
                .branch(branch)
                .payrollMonth(LocalDate.now().toString().substring(0, 7))
                .baseSalary(new BigDecimal("8000000.00"))
                .standardWorkDays(new BigDecimal("26.0"))
                .actualWorkDays(new BigDecimal("24.0"))
                .allowance(new BigDecimal("500000.00"))
                .netSalary(BigDecimal.ZERO)
                .status("BO_VIEC")
                .isAbandoned(true)
                .excludedFromCost(true)
                .build();

        when(resignationRequestRepository.findById(88L)).thenReturn(Optional.of(req));
        when(userRepository.findById(1L)).thenReturn(Optional.of(User.builder().id(1L).username("ketoan_tong").build()));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(resignationRequestRepository.save(any(ResignationRequest.class))).thenAnswer(inv -> inv.getArgument(0));
        when(payrollRepository.findByUserIdAndPayrollMonth(eq(15L), anyString())).thenReturn(Optional.of(payroll));
        when(payrollRepository.save(any(Payroll.class))).thenAnswer(inv -> inv.getArgument(0));

        ResignationRequest cancelled = attendanceService.cancelAbandonment(88L, generalAccountant);

        // 1. Đơn bỏ việc chuyển CANCELLED
        assertThat(cancelled.getStatus()).isEqualTo("CANCELLED");
        assertThat(cancelled.getIsAbandoned()).isFalse();

        // 2. Nhân viên khôi phục ACTIVE
        assertThat(inactiveUser.getStatus()).isEqualTo("ACTIVE");

        // 3. Lương được tính lại > 0, không bị excluded khỏi chi phí
        assertThat(payroll.getNetSalary()).isGreaterThan(BigDecimal.ZERO);
        assertThat(payroll.getExcludedFromCost()).isFalse();
        assertThat(payroll.getIsAbandoned()).isFalse();
        assertThat(payroll.getStatus()).isEqualTo("CHO_DUYET");

        // 4. Audit log đã ghi
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }
}
