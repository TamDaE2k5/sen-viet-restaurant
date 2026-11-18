package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO yêu cầu kế toán duyệt chi và giải ngân tiền ứng lương.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DisburseAdvanceRequest {

    @NotNull(message = "Số tiền thực chi không được để trống")
    @DecimalMin(value = "0.00", message = "Số tiền thực chi không được âm")
    private BigDecimal disbursedAmount;

    @NotBlank(message = "Tháng khấu trừ lương không được để trống")
    @Pattern(regexp = "^\\d{4}-\\d{2}$", message = "Tháng khấu trừ phải có định dạng YYYY-MM")
    private String deductionMonth;

    private String managerNote;
}
