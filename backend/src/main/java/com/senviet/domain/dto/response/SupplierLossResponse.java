package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO Báo Cáo Tỷ Lệ Hỏng Theo Từng Nhà Cung Cấp.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierLossResponse {
    private String supplierCode;
    private String supplierName;
    private Long reportCount;
    private BigDecimal totalDamagedQty;
    private BigDecimal totalEstimatedLossAmount;
    private BigDecimal totalPurchasedQty;
    private BigDecimal damageRatePercentage;
}
