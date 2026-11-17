package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO phản hồi thông tin công thức chế biến và định mức hao hụt chuẩn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeResponse {
    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String unit;
    private String recipeName;
    private BigDecimal standardLossRate;
    private String description;
}
