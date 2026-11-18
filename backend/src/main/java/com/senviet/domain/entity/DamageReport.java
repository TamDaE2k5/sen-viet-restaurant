package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể báo hỏng nguyên liệu (tại kho hoặc quầy chế biến).
 */
@Entity
@Table(name = "damage_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DamageReport extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(name = "supplier_code", length = 100)
    private String supplierCode;

    @Column(name = "batch_number", length = 100)
    private String batchNumber;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ImportBatch batch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Supplier supplier;

    @Column(name = "quantity", precision = 12, scale = 3, nullable = false)
    private BigDecimal quantity;

    @Column(name = "estimated_value", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal estimatedValue = BigDecimal.ZERO;

    @Column(name = "reason", length = 100, nullable = false)
    private String reason;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "TU_DONG_DUYET";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "reported_by_user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User reportedByUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "approved_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User approvedByUser;

    @Column(name = "approved_at")
    private Instant approvedAt;

    @Column(name = "note", length = 500)
    private String note;
}
