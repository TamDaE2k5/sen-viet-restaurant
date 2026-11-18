package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
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
public class DamageReportRequest {

    @NotNull(message = "ID nguyên liệu không được để trống")
    private Long itemId;

    private Long batchId;

    private String supplierCode;

    private String batchNumber;

    @NotNull(message = "Số lượng hỏng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng hỏng phải lớn hơn 0")
    private BigDecimal quantity;

    @NotBlank(message = "Lý do hỏng không được để trống")
    private String reason;

    private String imageUrls;

    private String note;
}
