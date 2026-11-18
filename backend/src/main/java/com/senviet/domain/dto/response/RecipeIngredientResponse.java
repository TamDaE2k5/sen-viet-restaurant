package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredientResponse {

    private Long id;
    private Long recipeId;
    private String recipeName;
    private Long ingredientItemId;
    private String ingredientItemCode;
    private String ingredientItemName;
    private BigDecimal quantity;
    private String unit;
    private String note;
    private Instant createdAt;
}
