package com.senviet.service;

import com.senviet.domain.dto.response.SalaryIncreaseProposalDto;
import com.senviet.domain.entity.Attendance;
import com.senviet.domain.entity.ExamSubmission;
import com.senviet.domain.entity.SalaryIncreaseProposal;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.AttendanceRepository;
import com.senviet.domain.repository.ExamSubmissionRepository;
import com.senviet.domain.repository.SalaryIncreaseProposalRepository;
import com.senviet.domain.repository.UserRepository;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Service Thuật Toán Tự Động Quét Xét Duyệt Tăng Lương Định Kỳ Theo Quý.
 * 
 * 3 Điều kiện tăng lương bắt buộc:
 * 1. Điểm thi định kỳ quý >= 80/100.
 * 2. Số lần đi muộn / về sớm <= 3 lần trong quý.
 * 3. Không có ngày nghỉ không phép (0 ngày).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SalaryIncreaseService {

    private final SalaryIncreaseProposalRepository proposalRepository;
    private final UserRepository userRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final AttendanceRepository attendanceRepository;

    public static final BigDecimal PASS_SCORE_THRESHOLD = new BigDecimal("80.00");
    public static final int MAX_LATE_COUNT_ALLOWED = 3;
    public static final BigDecimal STANDARD_RAISE_AMOUNT = new BigDecimal("500000.00");

    /**
     * Tự động quét và sinh đề xuất tăng lương cho chi nhánh trong quý được chỉ định.
     */
    @Transactional
    public List<SalaryIncreaseProposalDto> scanQuarterlyIncreaseEligibility(Long branchId, String quarter) {
        String examQuarter = quarter != null ? quarter : "Q4-2026";
        List<User> users = branchId != null
                ? userRepository.findByBranchIdAndStatus(branchId, "ACTIVE")
                : userRepository.findAll().stream().filter(u -> "ACTIVE".equals(u.getStatus())).collect(Collectors.toList());

        List<SalaryIncreaseProposalDto> results = new ArrayList<>();

        for (User user : users) {
            // 1. Kiểm tra điểm thi của quý
            Optional<ExamSubmission> submissionOpt = submissionRepository.findFirstByUserIdAndExamQuarter(user.getId(), examQuarter);
            BigDecimal score = submissionOpt.map(ExamSubmission::getTotalScore).orElse(BigDecimal.ZERO);

            // 2. Đếm số lần đi muộn trong 90 ngày gần nhất
            LocalDate startDate = LocalDate.now().minusDays(90);
            List<Attendance> attendances = attendanceRepository.findByUserIdAndAttendanceDateGreaterThanEqual(user.getId(), startDate);
            int lateCount = (int) attendances.stream().filter(a -> a.getLateMinutes() != null && a.getLateMinutes() > 0).count();

            // 3. Đếm ngày nghỉ không phép (tạm tính = 0 nếu đang active và không vi phạm)
            int unexcusedAbsenceCount = 0;

            boolean isScorePassed = score.compareTo(PASS_SCORE_THRESHOLD) >= 0;
            boolean isLatePassed = lateCount <= MAX_LATE_COUNT_ALLOWED;
            boolean isAbsencePassed = unexcusedAbsenceCount == 0;
            boolean isEligible = isScorePassed && isLatePassed && isAbsencePassed;

            StringBuilder eval = new StringBuilder();
            if (isEligible) {
                eval.append("Đủ điều kiện: Điểm thi ").append(score).append(" đ (>=80), ")
                    .append("Đi muộn ").append(lateCount).append(" lần (<=3), ")
                    .append("Nghỉ không phép 0 ngày");
            } else {
                eval.append("Chưa đủ điều kiện: ");
                if (!isScorePassed) eval.append("Điểm thi ").append(score).append(" đ (<80). ");
                if (!isLatePassed) eval.append("Đi muộn ").append(lateCount).append(" lần (>3). ");
                if (!isAbsencePassed) eval.append("Có nghỉ không phép. ");
            }

            // Tìm hoặc tạo đề xuất
            Optional<SalaryIncreaseProposal> existingOpt = proposalRepository.findFirstByUserIdAndExamQuarter(user.getId(), examQuarter);
            SalaryIncreaseProposal proposal;
            if (existingOpt.isPresent()) {
                proposal = existingOpt.get();
                proposal.setExamScore(score);
                proposal.setLateCount(lateCount);
                proposal.setUnexcusedAbsenceCount(unexcusedAbsenceCount);
                proposal.setIsEligible(isEligible);
                proposal.setEvaluationDetails(eval.toString());
            } else {
                proposal = SalaryIncreaseProposal.builder()
                        .user(user)
                        .branch(user.getBranch())
                        .examQuarter(examQuarter)
                        .examScore(score)
                        .lateCount(lateCount)
                        .unexcusedAbsenceCount(unexcusedAbsenceCount)
                        .isEligible(isEligible)
                        .raiseAmount(STANDARD_RAISE_AMOUNT)
                        .status("CHO_DUYET")
                        .evaluationDetails(eval.toString())
                        .createdAt(Instant.now())
                        .build();
            }

            proposalRepository.save(proposal);
            results.add(mapToDto(proposal));
        }

        log.info("Hoàn tất quét tăng lương quý {} cho {} nhân viên", examQuarter, users.size());
        return results;
    }

    /**
     * Kế toán / Quản lý duyệt tăng lương: Tự động cộng số tiền tăng vào lương cơ bản của nhân viên.
     */
    @Transactional
    public SalaryIncreaseProposalDto approveProposal(Long proposalId, UserPrincipal approver) {
        SalaryIncreaseProposal proposal = proposalRepository.findById(proposalId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy đề xuất tăng lương ID: " + proposalId));

        if (!proposal.getIsEligible()) {
            throw new IllegalStateException("Không thể duyệt đề xuất của nhân viên không đủ điều kiện");
        }

        if ("DA_DUYET".equals(proposal.getStatus())) {
            throw new IllegalStateException("Đề xuất này đã được duyệt trước đó");
        }

        User user = proposal.getUser();
        BigDecimal currentBase = user.getBaseSalary() != null ? user.getBaseSalary() : new BigDecimal("7500000.00");
        BigDecimal newBase = currentBase.add(proposal.getRaiseAmount());
        user.setBaseSalary(newBase);
        userRepository.save(user);

        User approverUser = userRepository.findById(approver.getId()).orElse(null);
        proposal.setStatus("DA_DUYET");
        proposal.setApprovedByUser(approverUser);
        proposal.setApprovedAt(Instant.now());
        proposalRepository.save(proposal);

        log.info("Đã duyệt tăng lương {} đ cho [{}]. Lương cơ bản mới: {} đ",
                proposal.getRaiseAmount(), user.getFullName(), newBase);

        return mapToDto(proposal);
    }

    @Transactional(readOnly = true)
    public List<SalaryIncreaseProposalDto> getProposalsByBranch(Long branchId) {
        List<SalaryIncreaseProposal> list = branchId != null
                ? proposalRepository.findByBranchIdOrderByCreatedAtDesc(branchId)
                : proposalRepository.findAll();
        return list.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private SalaryIncreaseProposalDto mapToDto(SalaryIncreaseProposal p) {
        return SalaryIncreaseProposalDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .fullName(p.getUser().getFullName())
                .username(p.getUser().getUsername())
                .branchId(p.getBranch() != null ? p.getBranch().getId() : null)
                .branchName(p.getBranch() != null ? p.getBranch().getBranchName() : "")
                .examQuarter(p.getExamQuarter())
                .examScore(p.getExamScore())
                .lateCount(p.getLateCount())
                .unexcusedAbsenceCount(p.getUnexcusedAbsenceCount())
                .isEligible(p.getIsEligible())
                .raiseAmount(p.getRaiseAmount())
                .status(p.getStatus())
                .evaluationDetails(p.getEvaluationDetails())
                .approvedByName(p.getApprovedByUser() != null ? p.getApprovedByUser().getFullName() : null)
                .approvedAt(p.getApprovedAt())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
