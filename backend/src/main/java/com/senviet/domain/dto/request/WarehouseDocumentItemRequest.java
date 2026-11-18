package com.senviet.domain.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WarehouseDocumentItemRequest {

    @NotNull(message = "ID mặt hàng không được để trống")
    private Long itemId;

    private Long batchId;

    private String batchCode;

    private LocalDate expiryDate;

    @NotNull(message = "Số lượng không được để trống")
    @DecimalMin(value = "0.001", message = "Số lượng phải lớn hơn 0")
    private BigDecimal quantity;

    private BigDecimal unitPrice;

    private String note;
}
