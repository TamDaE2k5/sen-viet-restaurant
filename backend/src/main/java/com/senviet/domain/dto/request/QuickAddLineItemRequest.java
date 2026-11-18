package com.senviet.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuickAddLineItemRequest {

    @NotBlank(message = "Tên món ăn không được để trống")
    private String itemName;

    private String itemCode;

    private String barcode;

    private String category;

    private String unit;

    private BigDecimal costPrice;

    @Builder.Default
    private Boolean isBuffetLine = true;

    @Builder.Default
    private Boolean isDailyOnly = false;
}
