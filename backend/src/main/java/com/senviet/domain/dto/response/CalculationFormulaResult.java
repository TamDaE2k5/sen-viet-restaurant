package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Kết quả tính toán từ Động cơ 6 Công Thức Đối Soát Cuối Ngày.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculationFormulaResult {
    // Công thức 1: Xuất = Tồn đầu + Nhập - Tồn cuối
    private BigDecimal exportedQty;

    // Công thức 2: Khách dùng theo định mức vé bán CukCuk
    private BigDecimal guestConsumptionQty;

    // Công thức 3: Hụt chế biến thực tế
    private BigDecimal processingLossQty;

    // Công thức 4: Hỏng có báo
    private BigDecimal reportedDamageQty;

    // Công thức 5: Lệch không rõ (Thất thoát) = Xuất - Khách dùng - Hụt - Hỏng
    private BigDecimal unexplainedLossQty;

    // Tiền thất thoát quy đổi (VNĐ) = Lệch * Giá vốn
    private BigDecimal unexplainedLossAmount;

    // Tỷ lệ % thất thoát = Lệch / Xuất * 100%
    private BigDecimal unexplainedLossRate;

    // Công thức 6: Tiêu hao thực tế/khách
    private BigDecimal actualConsumptionPerGuest;

    // Cờ cảnh báo đỏ: Thất thoát > 300,000 VNĐ HOẶC > 5%
    private Boolean isOverThreshold;
}
