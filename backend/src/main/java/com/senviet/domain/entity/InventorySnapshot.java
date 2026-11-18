package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể ghi nhận số liệu kiểm kê kho định kỳ (Tồn đầu, Nhập trong ca, Tồn cuối).
 */
@Entity
@Table(name = "inventory_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventorySnapshot {

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

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "shift_type", length = 20, nullable = false)
    @Builder.Default
    private String shiftType = "CA_NGAY";

    @Column(name = "opening_stock", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal openingStock = BigDecimal.ZERO;

    @Column(name = "in_stock", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal inStock = BigDecimal.ZERO;

    @Column(name = "closing_stock", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal closingStock = BigDecimal.ZERO;

    @Column(name = "unit", length = 20, nullable = false)
    @Builder.Default
    private String unit = "KG";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checked_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User checkedByUser;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
