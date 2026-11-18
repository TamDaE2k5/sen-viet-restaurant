package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryStockResponse {

    private Long id;
    private Long branchId;
    private String branchName;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String category;
    private Long batchId;
    private String batchCode;
    private Long supplierId;
    private String supplierName;
    private LocalDate importDate;
    private LocalDate expiryDate;
    private BigDecimal quantity;
    private String unit;
    private Instant lastUpdatedAt;
}
