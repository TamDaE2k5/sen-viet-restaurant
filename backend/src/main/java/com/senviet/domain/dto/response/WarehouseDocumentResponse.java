package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDocumentResponse {

    private Long id;
    private String docType;
    private String docCode;
    private Long branchId;
    private String branchName;
    private Long supplierId;
    private String supplierCode;
    private String supplierName;
    private Long createdById;
    private String createdByName;
    private String status;
    private String note;
    private BigDecimal totalAmount;
    private String imageUrls;
    private Instant createdAt;
    private List<WarehouseDocumentItemResponse> items;
}
