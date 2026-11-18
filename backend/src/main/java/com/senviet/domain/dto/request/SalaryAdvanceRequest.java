package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO yêu cầu gửi đơn xin ứng lương.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAdvanceRequest {

    @NotNull(message = "Số tiền xin ứng không được để trống")
    @DecimalMin(value = "100000.00", message = "Số tiền ứng tối thiểu là 100.000 đ")
    private BigDecimal requestedAmount;

    @NotBlank(message = "Lý do xin ứng lương không được để trống")
    private String reason;
}
