package com.senviet.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể món ăn / nguyên liệu trong hệ thống Sen Việt Buffet.
 */
@Entity
@Table(name = "items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Item extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_code", length = 50, nullable = false, unique = true)
    private String itemCode;

    @Column(name = "barcode", length = 100, unique = true)
    private String barcode;

    @Column(name = "item_name", length = 255, nullable = false)
    private String itemName;

    @Column(name = "category", length = 50, nullable = false)
    private String category;

    @Column(name = "unit", length = 20, nullable = false)
    @Builder.Default
    private String unit = "KG";

    @Column(name = "cost_price", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal costPrice = BigDecimal.ZERO;

    @Column(name = "is_buffet_line", nullable = false)
    @Builder.Default
    private Boolean isBuffetLine = true;

    @Column(name = "is_daily_only", nullable = false)
    @Builder.Default
    private Boolean isDailyOnly = false;
}
