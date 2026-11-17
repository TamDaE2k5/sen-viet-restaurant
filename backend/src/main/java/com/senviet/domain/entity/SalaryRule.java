package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể cấu hình quy tắc và công thức tính lương của chi nhánh.
 */
@Entity
@Table(name = "salary_rules")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "standard_work_days", precision = 4, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal standardWorkDays = new BigDecimal("26.0");

    @Column(name = "exam_raise_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal examRaiseAmount = new BigDecimal("500000.00");

    @Column(name = "max_advance_ratio", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal maxAdvanceRatio = new BigDecimal("0.50");

    @Column(name = "late_penalty_per_minute", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal latePenaltyPerMinute = new BigDecimal("5000.00");

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
