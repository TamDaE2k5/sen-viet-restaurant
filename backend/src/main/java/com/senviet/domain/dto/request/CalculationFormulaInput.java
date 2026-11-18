package com.senviet.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Tham số đầu vào cho Động cơ Tính Toán 6 Công Thức Đối Soát.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CalculationFormulaInput {
    // Tồn đầu ca
    private BigDecimal openingStock;

    // Nhập trong ca
    private BigDecimal inStock;

    // Tồn kiểm thực tế cuối ca
    private BigDecimal closingStock;

    // Đơn giá vốn của món (VNĐ)
    private BigDecimal costPrice;

    // Số khách người lớn
    private Integer adultGuests;

    // Số khách trẻ em
    private Integer childGuests;

    // Định mức tiêu chuẩn món trên 1 khách (ví dụ: 0.16 kg cua/khách)
    private BigDecimal standardPerGuest;

    // Hệ số định mức của trẻ em so với người lớn (mặc định 0.5 = 50%)
    @Builder.Default
    private BigDecimal childDiscountFactor = new BigDecimal("0.5");

    // Khối lượng hao hụt chế biến thực tế từ các mẻ
    private BigDecimal processingLossQty;

    // Khối lượng hỏng có báo (đã duyệt hoặc tự động)
    private BigDecimal reportedDamageQty;
}
