package com.senviet.service;

import com.senviet.domain.dto.request.ExamSubmitRequest;
import com.senviet.domain.dto.request.GradePracticalRequest;
import com.senviet.domain.dto.response.ExamQuestionDto;
import com.senviet.domain.dto.response.ExamSubmissionDto;
import com.senviet.domain.entity.Branch;
import com.senviet.domain.entity.ExamQuestion;
import com.senviet.domain.entity.ExamSubmission;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.BranchRepository;
import com.senviet.domain.repository.ExamQuestionRepository;
import com.senviet.domain.repository.ExamSubmissionRepository;
import com.senviet.domain.repository.UserRepository;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service Quản Lý Kỳ Thi Định Kỳ Trực Tuyến & Chấm Điểm Lý Thuyết / Thực Hành.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ExamService {

    private final ExamQuestionRepository questionRepository;
    private final ExamSubmissionRepository submissionRepository;
    private final UserRepository userRepository;
    private final BranchRepository branchRepository;

    /**
     * Lấy danh sách câu hỏi trắc nghiệm theo vị trí (đảo ngẫu nhiên câu hỏi).
     */
    @Transactional(readOnly = true)
    public List<ExamQuestionDto> getActiveQuestions(String position) {
        String pos = position != null ? position.toUpperCase() : "BEP";
        List<ExamQuestion> list = questionRepository.findByPositionAndIsActiveTrue(pos);
        if (list.isEmpty()) {
            list = questionRepository.findByIsActiveTrue();
        }

        Collections.shuffle(list);

        return list.stream().map(q -> ExamQuestionDto.builder()
                .id(q.getId())
                .position(q.getPosition())
                .questionText(q.getQuestionText())
                .optionA(q.getOptionA())
                .optionB(q.getOptionB())
                .optionC(q.getOptionC())
                .optionD(q.getOptionD())
                .points(q.getPoints())
                .build()
        ).collect(Collectors.toList());
    }

    /**
     * Nộp bài thi trắc nghiệm trực tuyến: Tự động chấm điểm theo giờ máy chủ.
     */
    @Transactional
    public ExamSubmissionDto submitExam(ExamSubmitRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        Branch branch = branchRepository.findById(currentUser.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy chi nhánh"));

        Instant submittedAt = Instant.now();
        Instant startedAt = request.getStartedAt() != null ? request.getStartedAt() : submittedAt.minusSeconds(900); // 15 phút
        int durationSeconds = (int) Duration.between(startedAt, submittedAt).toSeconds();

        Map<Long, String> answers = request.getAnswers();
        List<ExamQuestion> questions = questionRepository.findAllById(answers.keySet());

        int totalQuestions = questions.size();
        int correctCount = 0;

        for (ExamQuestion q : questions) {
            String selected = answers.get(q.getId());
            if (selected != null && selected.trim().equalsIgnoreCase(q.getCorrectOption().trim())) {
                correctCount++;
            }
        }

        BigDecimal theoryScore = totalQuestions > 0
                ? BigDecimal.valueOf((double) correctCount / totalQuestions * 100).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        ExamSubmission submission = ExamSubmission.builder()
                .user(user)
                .branch(branch)
                .examQuarter(request.getExamQuarter())
                .startedAt(startedAt)
                .submittedAt(submittedAt)
                .durationSeconds(durationSeconds)
                .theoryScore(theoryScore)
                .totalScore(theoryScore)
                .status("DA_NOP_LY_THUYET")
                .isPassed(theoryScore.compareTo(new BigDecimal("70.00")) >= 0)
                .build();

        submissionRepository.save(submission);
        log.info("Nhân viên [{}] nộp bài thi [{}]: {}/{} câu đúng, Điểm lý thuyết: {}",
                user.getFullName(), request.getExamQuarter(), correctCount, totalQuestions, theoryScore);

        return mapToDto(submission);
    }

    /**
     * Quản lý nhà hàng chấm điểm thực hành cho bài thi của nhân viên.
     */
    @Transactional
    public ExamSubmissionDto gradePractical(Long submissionId, GradePracticalRequest request, UserPrincipal manager) {
        ExamSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bài thi ID: " + submissionId));

        User managerUser = userRepository.findById(manager.getId()).orElse(null);

        BigDecimal practicalScore = request.getPracticalScore();
        BigDecimal theoryScore = submission.getTheoryScore();

        // Tổng điểm: 40% Lý thuyết + 60% Thực hành
        BigDecimal totalScore = theoryScore.multiply(new BigDecimal("0.4"))
                .add(practicalScore.multiply(new BigDecimal("0.6")))
                .setScale(2, RoundingMode.HALF_UP);

        boolean isPassed = totalScore.compareTo(new BigDecimal("70.00")) >= 0;

        submission.setPracticalScore(practicalScore);
        submission.setTotalScore(totalScore);
        submission.setGradedByUser(managerUser);
        submission.setPracticalComment(request.getComment());
        submission.setIsPassed(isPassed);
        submission.setStatus(isPassed ? "HOAN_THANH" : "ROT");

        submissionRepository.save(submission);
        return mapToDto(submission);
    }

    @Transactional(readOnly = true)
    public List<ExamSubmissionDto> getSubmissionsByBranch(Long branchId) {
        if (branchId == null) {
            return submissionRepository.findAll().stream()
                    .sorted((a, b) -> b.getSubmittedAt().compareTo(a.getSubmittedAt()))
                    .map(this::mapToDto).collect(Collectors.toList());
        }
        return submissionRepository.findByBranchIdOrderBySubmittedAtDesc(branchId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExamSubmissionDto> getMySubmissions(Long userId) {
        return submissionRepository.findByUserIdOrderBySubmittedAtDesc(userId)
                .stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private ExamSubmissionDto mapToDto(ExamSubmission s) {
        return ExamSubmissionDto.builder()
                .id(s.getId())
                .userId(s.getUser().getId())
                .fullName(s.getUser().getFullName())
                .examQuarter(s.getExamQuarter())
                .startedAt(s.getStartedAt())
                .submittedAt(s.getSubmittedAt())
                .durationSeconds(s.getDurationSeconds())
                .theoryScore(s.getTheoryScore())
                .practicalScore(s.getPracticalScore())
                .totalScore(s.getTotalScore())
                .practicalComment(s.getPracticalComment())
                .status(s.getStatus())
                .isPassed(s.getIsPassed())
                .build();
    }
}
