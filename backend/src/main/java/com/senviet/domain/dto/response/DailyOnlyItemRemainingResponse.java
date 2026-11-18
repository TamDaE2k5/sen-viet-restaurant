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
public class DailyOnlyItemRemainingResponse {

    private Long itemId;
    private String itemCode;
    private String itemName;
    private String category;
    private String unit;
    private BigDecimal costPrice;
    private BigDecimal currentStock;
    private Boolean isDailyOnly;
}
