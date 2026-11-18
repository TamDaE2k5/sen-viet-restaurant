package com.senviet.domain.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMin;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO yêu cầu cập nhật hoặc chỉnh sửa đơn ứng lương.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin chỉnh sửa đơn ứng lương")
public class UpdateAdvanceRequest {

    @DecimalMin(value = "100000.00", message = "Số tiền ứng tối thiểu là 100.000 đ")
    @Schema(description = "Số tiền xin ứng mới", example = "2500000.00")
    private BigDecimal requestedAmount;

    @Schema(description = "Số tiền thực chi giải ngân", example = "2000000.00")
    private BigDecimal disbursedAmount;

    @Schema(description = "Lý do xin ứng", example = "Sửa xe máy và đóng học phí")
    private String reason;

    @Schema(description = "Tháng khấu trừ YYYY-MM", example = "2026-11")
    private String deductionMonth;

    @Schema(description = "Ghi chú của quản lý hoặc kế toán", example = "Đã duyệt điều chỉnh")
    private String managerNote;
}
