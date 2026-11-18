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
public class InventoryCheckItemResponse {

    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private Long batchId;
    private String batchCode;
    private BigDecimal systemStock;
    private BigDecimal actualStock;
    private BigDecimal difference;
    private String reason;
    private String unit;
}
