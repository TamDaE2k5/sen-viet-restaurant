package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeIngredientRequest {

    @NotNull(message = "ID nguyên liệu không được để trống")
    private Long ingredientItemId;

    @NotNull(message = "Định lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Định lượng phải lớn hơn 0")
    private BigDecimal quantity;

    private String unit;

    private String note;
}
