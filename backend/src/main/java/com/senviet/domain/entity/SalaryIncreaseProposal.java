package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể đề xuất xét tăng lương định kỳ theo kết quả thi quý & kỷ luật chấm công.
 */
@Entity
@Table(name = "salary_increase_proposals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryIncreaseProposal {

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

    @Column(name = "exam_quarter", length = 50, nullable = false)
    private String examQuarter;

    @Column(name = "exam_score", precision = 5, scale = 2, nullable = false)
    private BigDecimal examScore;

    @Column(name = "late_count", nullable = false)
    @Builder.Default
    private Integer lateCount = 0;

    @Column(name = "unexcused_absence_count", nullable = false)
    @Builder.Default
    private Integer unexcusedAbsenceCount = 0;

    @Column(name = "is_eligible", nullable = false)
    @Builder.Default
    private Boolean isEligible = false;

    @Column(name = "raise_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal raiseAmount = new BigDecimal("500000.00");

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "CHO_DUYET"; // 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI'

    @Column(name = "evaluation_details", columnDefinition = "TEXT")
    private String evaluationDetails;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User approvedByUser;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
