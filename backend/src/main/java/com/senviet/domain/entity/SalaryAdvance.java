package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể đơn xin ứng lương của nhân viên và quy trình duyệt chi.
 */
@Entity
@Table(name = "salary_advances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class SalaryAdvance {

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

    @Column(name = "request_date", nullable = false)
    @Builder.Default
    private LocalDate requestDate = LocalDate.now();

    @Column(name = "requested_amount", precision = 15, scale = 2, nullable = false)
    private BigDecimal requestedAmount;

    @Column(name = "reason", columnDefinition = "TEXT", nullable = false)
    private String reason;

    @Column(name = "disbursed_amount", precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal disbursedAmount = BigDecimal.ZERO;

    @Column(name = "deduction_month", length = 7)
    private String deductionMonth; // Định dạng 'YYYY-MM'

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "CHO_DUYET"; // 'CHO_DUYET', 'DA_DUYET', 'DA_CHI', 'TU_CHOI'

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User approvedByUser;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "manager_note", columnDefinition = "TEXT")
    private String managerNote;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
