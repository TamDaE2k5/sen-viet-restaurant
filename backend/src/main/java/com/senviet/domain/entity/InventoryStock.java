package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể Tồn Kho Chi Tiết Theo Chi Nhánh, Mặt Hàng & Lô Nhập.
 */
@Entity
@Table(name = "inventory_stocks", uniqueConstraints = {
        @UniqueConstraint(name = "uq_branch_item_batch", columnNames = {"branch_id", "item_id", "batch_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryStock {

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

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ImportBatch batch;

    @Column(name = "quantity", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal quantity = BigDecimal.ZERO;

    @Column(name = "last_updated_at", nullable = false)
    @Builder.Default
    private Instant lastUpdatedAt = Instant.now();
}
