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
public class FinishBatchRequest {

    @NotNull(message = "ID mẻ chế biến không được để trống")
    private Long batchId;

    @NotNull(message = "Khối lượng thành phẩm không được để trống")
    @DecimalMin(value = "0.001", message = "Khối lượng thành phẩm phải lớn hơn 0")
    private BigDecimal outputWeight;
}
