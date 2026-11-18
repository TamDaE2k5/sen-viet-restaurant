package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể Dòng Chi Tiết Biên Bản Kiểm Kê Kho.
 */
@Entity
@Table(name = "inventory_check_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryCheckItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "check_id", nullable = false)
    @JsonIgnoreProperties("items")
    private InventoryCheck inventoryCheck;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ImportBatch batch;

    @Column(name = "system_stock", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal systemStock = BigDecimal.ZERO;

    @Column(name = "actual_stock", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal actualStock = BigDecimal.ZERO;

    @Column(name = "difference", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal difference = BigDecimal.ZERO;

    @Column(name = "reason", length = 255)
    private String reason;
}
