package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể kết quả bài thi trắc nghiệm lý thuyết & thực hành của nhân viên.
 */
@Entity
@Table(name = "exam_submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class ExamSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "exam_quarter", length = 20, nullable = false)
    @Builder.Default
    private String examQuarter = "Q4_2026";

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "submitted_at", nullable = false)
    private Instant submittedAt;

    @Column(name = "duration_seconds", nullable = false)
    @Builder.Default
    private Integer durationSeconds = 0;

    @Column(name = "theory_score", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal theoryScore = BigDecimal.ZERO;

    @Column(name = "practical_score", precision = 5, scale = 2)
    private BigDecimal practicalScore;

    @Column(name = "total_score", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalScore = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "graded_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User gradedByUser;

    @Column(name = "practical_comment", columnDefinition = "TEXT")
    private String practicalComment;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "DA_NOP_LY_THUYET";

    @Column(name = "is_passed", nullable = false)
    @Builder.Default
    private Boolean isPassed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
