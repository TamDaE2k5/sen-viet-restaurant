package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

/**
 * Thực thể Chi Tiết Phiếu Kho (Warehouse Document Item).
 */
@Entity
@Table(name = "warehouse_document_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseDocumentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    @JsonIgnoreProperties("items")
    private WarehouseDocument document;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "batch_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ImportBatch batch;

    @Column(name = "quantity", precision = 12, scale = 3, nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit_price", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unitPrice = BigDecimal.ZERO;

    @Column(name = "note", length = 255)
    private String note;
}
