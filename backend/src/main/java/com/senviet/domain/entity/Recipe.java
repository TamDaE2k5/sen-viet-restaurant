package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể công thức chế biến & định mức hao hụt chuẩn cho món ăn.
 */
@Entity
@Table(name = "recipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Recipe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(name = "recipe_name", length = 255, nullable = false)
    private String recipeName;

    @Column(name = "standard_loss_rate", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal standardLossRate = BigDecimal.ZERO;

    @Column(name = "description", length = 500)
    private String description;
}
