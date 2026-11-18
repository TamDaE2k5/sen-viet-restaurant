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
public class DailyWasteItemRequest {

    @NotNull(message = "ID món ăn không được để trống")
    private Long itemId;

    @NotNull(message = "Số lượng hủy bỏ không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    private String unit;
    private String note;
}
