package com.senviet.service;

import com.senviet.domain.dto.request.DisburseAdvanceRequest;
import com.senviet.domain.dto.request.SalaryAdvanceRequest;
import com.senviet.domain.dto.request.UpdateAdvanceRequest;
import com.senviet.domain.dto.response.SalaryAdvanceResponse;
import com.senviet.domain.entity.Branch;
import com.senviet.domain.entity.PayrollPeriod;
import com.senviet.domain.entity.SalaryAdvance;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.BranchRepository;
import com.senviet.domain.repository.PayrollPeriodRepository;
import com.senviet.domain.repository.SalaryAdvanceRepository;
import com.senviet.domain.repository.UserRepository;
import com.senviet.exception.ApiException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service Quản Lý Đơn Xin Ứng Lương & Quy Trình Duyệt Chi / Khấu Trừ Bảng Lương.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SalaryAdvanceService {

    private final SalaryAdvanceRepository salaryAdvanceRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final PayrollPeriodRepository payrollPeriodRepository;

    /**
     * Kiểm tra xem kỳ bảng lương tương ứng có đang bị khóa (LOCKED) hay không.
     */
    public boolean isPeriodLocked(String periodMonth, Long branchId) {
        if (periodMonth == null) {
            return false;
        }
        if (branchId != null) {
            Optional<PayrollPeriod> periodOpt = payrollPeriodRepository.findByPeriodMonthAndBranchId(periodMonth, branchId);
            if (periodOpt.isPresent() && "LOCKED".equalsIgnoreCase(periodOpt.get().getStatus())) {
                return true;
            }
        }
        // Kiểm tra phạm vi toàn chuỗi
        return payrollPeriodRepository.findByPeriodMonth(periodMonth).stream()
                .anyMatch(p -> "LOCKED".equalsIgnoreCase(p.getStatus()));
    }

    /**
     * Nhân viên gửi đơn xin tạm ứng lương.
     * Quy tắc: Mỗi nhân viên chỉ được có tối đa 1 đơn đang chờ duyệt ('CHO_DUYET').
     */
    @Transactional
    public SalaryAdvanceResponse requestAdvance(SalaryAdvanceRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng ID: " + currentUser.getId()));

        // Kiểm tra xem có đơn nào đang chờ duyệt hay không
        Optional<SalaryAdvance> pending = salaryAdvanceRepository.findFirstByUserIdAndStatus(user.getId(), "CHO_DUYET");
        if (pending.isPresent()) {
            throw new IllegalStateException("Bạn đang có đơn xin ứng lương #" + pending.get().getId() + " đang chờ duyệt");
        }

        Branch branch = user.getBranch();
        if (branch == null && currentUser.getBranchId() != null) {
            branch = branchRepository.findById(currentUser.getBranchId()).orElse(null);
        }

        SalaryAdvance advance = SalaryAdvance.builder()
                .user(user)
                .branch(branch)
                .requestDate(LocalDate.now())
                .requestedAmount(request.getRequestedAmount())
                .reason(request.getReason())
                .disbursedAmount(request.getRequestedAmount()) // Mặc định bằng số tiền yêu cầu
                .status("CHO_DUYET")
                .createdAt(Instant.now())
                .build();

        salaryAdvanceRepository.save(advance);
        log.info("Nhân viên [{}] gửi đơn xin ứng {} đ. Lý do: {}",
                user.getFullName(), request.getRequestedAmount(), request.getReason());

        return mapToResponse(advance);
    }

    /**
     * Kế toán / Quản lý duyệt chi và giải ngân tiền ứng lương.
     * Nhập số tiền thực chi (có thể ít hơn số xin) và chọn tháng trừ lương 'YYYY-MM'.
     */
    @Transactional
    public SalaryAdvanceResponse disburseAdvance(Long advanceId, DisburseAdvanceRequest request, UserPrincipal accountant) {
        SalaryAdvance advance = salaryAdvanceRepository.findById(advanceId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đơn ứng lương ID: " + advanceId));

        if ("DA_CHI".equals(advance.getStatus())) {
            throw new IllegalStateException("Đơn ứng lương này đã được giải ngân chi trả trước đó");
        }

        if (request.getDisbursedAmount().compareTo(advance.getRequestedAmount()) > 0) {
            throw new IllegalArgumentException("Số tiền thực chi không được vượt quá số tiền xin ứng (" + advance.getRequestedAmount() + " đ)");
        }

        // Kiểm tra xem kỳ bảng lương tháng deductionMonth đã chốt/khóa hay chưa
        Long branchId = advance.getBranch() != null ? advance.getBranch().getId() : null;
        if (isPeriodLocked(request.getDeductionMonth(), branchId)) {
            throw new ApiException("Kỳ lương " + request.getDeductionMonth() + " đã được chốt và khóa. Không thể giải ngân khấu trừ vào kỳ lương này!");
        }

        User accountantUser = userRepository.findById(accountant.getId()).orElse(null);

        advance.setDisbursedAmount(request.getDisbursedAmount());
        advance.setDeductionMonth(request.getDeductionMonth());
        advance.setStatus("DA_CHI");
        advance.setApprovedByUser(accountantUser);
        advance.setApprovedAt(Instant.now());
        advance.setManagerNote(request.getManagerNote());

        salaryAdvanceRepository.save(advance);
        log.info("Kế toán [{}] đã duyệt chi {} đ cho đơn ứng lương #{} của [{}]. Khấu trừ tháng: {}",
                accountant.getUsername(), request.getDisbursedAmount(), advance.getId(), advance.getUser().getFullName(), request.getDeductionMonth());

        return mapToResponse(advance);
    }

    /**
     * Chỉnh sửa thông tin đơn ứng lương (Số tiền, lý do, tháng khấu trừ).
     * Quy tắc chặt chẽ: Đơn chỉ được sửa khi kỳ bảng lương tháng đó CHƯA KHÓA.
     * Khi kỳ bảng lương đã khóa -> Từ chối với HTTP 400 Bad Request.
     */
    @Transactional
    public SalaryAdvanceResponse updateAdvance(Long advanceId, UpdateAdvanceRequest request, UserPrincipal currentUser) {
        SalaryAdvance advance = salaryAdvanceRepository.findById(advanceId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đơn ứng lương ID: " + advanceId));

        Long branchId = advance.getBranch() != null ? advance.getBranch().getId() : null;

        // Xác định tháng khấu trừ cần kiểm tra khóa
        String targetMonth = request.getDeductionMonth() != null ? request.getDeductionMonth() : advance.getDeductionMonth();
        if (targetMonth == null && advance.getRequestDate() != null) {
            targetMonth = advance.getRequestDate().toString().substring(0, 7);
        }

        if (isPeriodLocked(targetMonth, branchId)) {
            throw new ApiException("Kỳ lương " + targetMonth + " đã được chốt và khóa. Không được phép chỉnh sửa đơn ứng lương!");
        }

        if (request.getRequestedAmount() != null) {
            advance.setRequestedAmount(request.getRequestedAmount());
        }
        if (request.getDisbursedAmount() != null) {
            advance.setDisbursedAmount(request.getDisbursedAmount());
        }
        if (request.getReason() != null) {
            advance.setReason(request.getReason());
        }
        if (request.getDeductionMonth() != null) {
            advance.setDeductionMonth(request.getDeductionMonth());
        }
        if (request.getManagerNote() != null) {
            advance.setManagerNote(request.getManagerNote());
        }

        SalaryAdvance saved = salaryAdvanceRepository.save(advance);
        log.info("Người dùng [{}] cập nhật đơn ứng lương #{}. Tháng khấu trừ: {}",
                currentUser.getUsername(), advanceId, targetMonth);
        return mapToResponse(saved);
    }

    /**
     * Hủy đơn ứng lương.
     * Quy tắc chặt chẽ: Đơn chỉ được hủy khi kỳ bảng lương tháng đó CHƯA KHÓA.
     * Khi kỳ bảng lương đã khóa -> Từ chối với HTTP 400 Bad Request.
     */
    @Transactional
    public void deleteAdvance(Long advanceId, UserPrincipal currentUser) {
        SalaryAdvance advance = salaryAdvanceRepository.findById(advanceId)
                .orElseThrow(() -> new ApiException("Không tìm thấy đơn ứng lương ID: " + advanceId));

        Long branchId = advance.getBranch() != null ? advance.getBranch().getId() : null;
        String targetMonth = advance.getDeductionMonth();
        if (targetMonth == null && advance.getRequestDate() != null) {
            targetMonth = advance.getRequestDate().toString().substring(0, 7);
        }

        if (isPeriodLocked(targetMonth, branchId)) {
            throw new ApiException("Kỳ lương " + targetMonth + " đã được chốt và khóa. Không được phép hủy đơn ứng lương!");
        }

        salaryAdvanceRepository.delete(advance);
        log.info("Người dùng [{}] đã hủy đơn ứng lương #{}", currentUser.getUsername(), advanceId);
    }

    @Transactional(readOnly = true)
    public List<SalaryAdvanceResponse> getAdvancesByBranch(Long branchId) {
        List<SalaryAdvance> list = branchId != null
                ? salaryAdvanceRepository.findByBranchIdOrderByRequestDateDesc(branchId)
                : salaryAdvanceRepository.findAll();
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SalaryAdvanceResponse> getMyAdvances(Long userId) {
        return salaryAdvanceRepository.findByUserIdOrderByRequestDateDesc(userId)
                .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    private SalaryAdvanceResponse mapToResponse(SalaryAdvance a) {
        return SalaryAdvanceResponse.builder()
                .id(a.getId())
                .userId(a.getUser().getId())
                .fullName(a.getUser().getFullName())
                .username(a.getUser().getUsername())
                .branchId(a.getBranch() != null ? a.getBranch().getId() : null)
                .branchName(a.getBranch() != null ? a.getBranch().getBranchName() : "")
                .requestDate(a.getRequestDate())
                .requestedAmount(a.getRequestedAmount())
                .reason(a.getReason())
                .disbursedAmount(a.getDisbursedAmount())
                .deductionMonth(a.getDeductionMonth())
                .status(a.getStatus())
                .approvedByName(a.getApprovedByUser() != null ? a.getApprovedByUser().getFullName() : null)
                .approvedAt(a.getApprovedAt())
                .managerNote(a.getManagerNote())
                .build();
    }
}
