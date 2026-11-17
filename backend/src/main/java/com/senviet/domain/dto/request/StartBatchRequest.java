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
public class StartBatchRequest {

    @NotNull(message = "ID món ăn không được để trống")
    private Long itemId;

    private Long recipeId;

    @NotNull(message = "Khối lượng đầu vào không được để trống")
    @DecimalMin(value = "0.001", message = "Khối lượng đầu vào phải lớn hơn 0")
    private BigDecimal inputWeight;

    // Cho phép người dùng xác nhận bỏ qua cảnh báo mẻ 2
    @Builder.Default
    private boolean forceSecondBatch = false;
}
