package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO hiển thị Bảng Đối Soát Cuối Ngày (6 Công Thức Cốt Lõi & Cờ Cảnh Báo Đỏ).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReconciliationSummaryResponse {
    private Long id;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private String unit;
    private BigDecimal costPrice;

    private LocalDate reconDate;
    private String shiftType;

    // Công thức 1: Xuất = Tồn đầu + Nhập - Tồn cuối
    private BigDecimal exportedQty;

    // Công thức 2: Khách dùng theo định mức vé POS CukCuk
    private BigDecimal guestConsumptionQty;

    // Công thức 3: Hụt chế biến thực tế từ các mẻ
    private BigDecimal processingLossQty;

    // Công thức 4: Hỏng có báo (đã duyệt hoặc tự động duyệt)
    private BigDecimal reportedDamageQty;

    // Công thức 5: Lệch không rõ (Thất thoát) = Xuất - Khách dùng - Hụt chế biến - Hỏng có báo
    private BigDecimal unexplainedLossQty;

    // Tiền thất thoát quy đổi (VNĐ) = Lệch * Giá vốn
    private BigDecimal unexplainedLossAmount;

    // Tỷ lệ % thất thoát = Lệch / Xuất * 100%
    private BigDecimal unexplainedLossRate;

    // Công thức 6: Tiêu hao thực tế/khách
    private BigDecimal actualConsumptionPerGuest;

    // Cờ đỏ cảnh báo: Tiền thất thoát > 300,000 VNĐ HOẶC Tỷ lệ lệch > 5%
    private Boolean isOverThreshold;

    // Tên nhân viên kiểm kho chịu trách nhiệm ca
    private String responsibleUserName;

    // Trạng thái đối soát
    private String status;
}
