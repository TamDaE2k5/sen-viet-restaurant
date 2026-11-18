package com.senviet.service;

import com.senviet.domain.dto.request.DisburseAdvanceRequest;
import com.senviet.domain.dto.request.SalaryAdvanceRequest;
import com.senviet.domain.dto.response.SalaryAdvanceResponse;
import com.senviet.domain.entity.Branch;
import com.senviet.domain.entity.SalaryAdvance;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.BranchRepository;
import com.senviet.domain.repository.SalaryAdvanceRepository;
import com.senviet.domain.repository.UserRepository;
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
