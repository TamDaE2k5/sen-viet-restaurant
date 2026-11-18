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
public class ImportBatchResponse {

    private Long id;
    private String batchCode;
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Long branchId;
    private String branchName;
    private LocalDate importDate;
    private LocalDate expiryDate;
    private BigDecimal initialQuantity;
    private BigDecimal currentStock;
    private BigDecimal unitPrice;
    private String unit;
    private String status;
    private Instant createdAt;
}
