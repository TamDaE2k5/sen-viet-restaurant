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
public class InventoryCheckItemRequest {

    @NotNull(message = "ID mặt hàng không được để trống")
    private Long itemId;

    private Long batchId;

    private BigDecimal systemStock;

    @NotNull(message = "Tồn kiểm thực tế không được để trống")
    @DecimalMin(value = "0.0", message = "Tồn kiểm thực tế không thể âm")
    private BigDecimal actualStock;

    private String reason;
}
