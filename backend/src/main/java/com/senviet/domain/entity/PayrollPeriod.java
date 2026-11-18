package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/**
 * Thực thể quản lý kỳ bảng lương và trạng thái chốt/khóa kỳ lương (Payroll Lock).
 */
@Entity
@Table(name = "payroll_periods", uniqueConstraints = {
        @UniqueConstraint(name = "uk_payroll_period_branch", columnNames = {"period_month", "branch_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class PayrollPeriod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "period_month", length = 7, nullable = false)
    private String periodMonth; // 'YYYY-MM'

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "status", length = 20, nullable = false)
    @Builder.Default
    private String status = "OPEN"; // 'OPEN', 'LOCKED'

    @Column(name = "locked_at")
    private Instant lockedAt;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "locked_by")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User lockedBy;

    @Column(name = "unlock_reason", columnDefinition = "TEXT")
    private String unlockReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
