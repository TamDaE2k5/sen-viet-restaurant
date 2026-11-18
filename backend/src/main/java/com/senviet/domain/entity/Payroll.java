package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể bảng lương tháng tổng hợp cho nhân sự.
 */
@Entity
@Table(name = "payrolls", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payroll_user_month", columnNames = {"user_id", "payroll_month"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Payroll {

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

    @Column(name = "payroll_month", length = 7, nullable = false)
    private String payrollMonth; // 'YYYY-MM'

    @Column(name = "base_salary", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal baseSalary = BigDecimal.ZERO;

    @Column(name = "standard_work_days", precision = 4, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal standardWorkDays = new BigDecimal("26.0");

    @Column(name = "actual_work_days", precision = 4, scale = 1, nullable = false)
    @Builder.Default
    private BigDecimal actualWorkDays = BigDecimal.ZERO;

    @Column(name = "salary_raise", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal salaryRaise = BigDecimal.ZERO;

    @Column(name = "allowance", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal allowance = BigDecimal.ZERO;

    @Column(name = "gross_salary", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal grossSalary = BigDecimal.ZERO;

    @Column(name = "advance_deduction", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal advanceDeduction = BigDecimal.ZERO;

    @Column(name = "penalty_deduction", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal penaltyDeduction = BigDecimal.ZERO;

    @Column(name = "net_salary", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal netSalary = BigDecimal.ZERO;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "CHO_DUYET"; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'BO_VIEC', 'DA_THANH_TOAN'

    @Column(name = "is_abandoned", nullable = false)
    @Builder.Default
    private Boolean isAbandoned = false;

    @Column(name = "is_uniform_retained", nullable = false)
    @Builder.Default
    private Boolean isUniformRetained = false;

    @Column(name = "excluded_from_cost", nullable = false)
    @Builder.Default
    private Boolean excludedFromCost = false;

    @Column(name = "hold_reason", length = 500)
    private String holdReason;

    @Column(name = "locked_at")
    private Instant lockedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "locked_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User lockedBy;

    @Column(name = "bank_name", length = 100)
    private String bankName;

    @Column(name = "bank_account_number", length = 50)
    private String bankAccountNumber;

    @Column(name = "bank_account_holder", length = 150)
    private String bankAccountHolder;

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
