package com.senviet.domain.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO yêu cầu Check-out kết thúc ca làm việc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CheckOutRequest {

    @NotNull(message = "Vĩ độ không được để trống")
    private BigDecimal latitude;

    @NotNull(message = "Kinh độ không được để trống")
    private BigDecimal longitude;

    private String selfieUrl;
}
