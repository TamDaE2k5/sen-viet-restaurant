package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDocumentItemResponse {

    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Long batchId;
    private String batchCode;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal lineTotal;
    private String unit;
    private String note;
}
