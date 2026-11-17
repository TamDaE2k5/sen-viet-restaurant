package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO chấm điểm thực hành dành cho Quản lý nhà hàng.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GradePracticalRequest {

    @NotNull(message = "Điểm thực hành không được để trống")
    @DecimalMin(value = "0.0", message = "Điểm tối thiểu là 0")
    @DecimalMax(value = "100.0", message = "Điểm tối đa là 100")
    private BigDecimal practicalScore;

    private String comment;
}
