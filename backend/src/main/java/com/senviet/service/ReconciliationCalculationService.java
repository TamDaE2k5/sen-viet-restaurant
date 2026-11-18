package com.senviet.service;

import com.senviet.domain.dto.request.CalculationFormulaInput;
import com.senviet.domain.dto.response.CalculationFormulaResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Động cơ Tính Toán 6 Công Thức Đối Soát Cuối Ngày (Reconciliation Engine).
 * 
 * Nghiệp vụ cốt lõi:
 * 1. Xuất kho = Tồn đầu + Nhập - Tồn cuối
 * 2. Khách dùng = (Số người lớn + Số trẻ em * Hệ số trẻ em) * Định mức chuẩn
 * 3. Hụt chế biến thực tế từ các mẻ nấu
 * 4. Hỏng có báo (đã duyệt hoặc tự động)
 * 5. Lệch không rõ nguyên nhân (Thất thoát) = Xuất - Khách dùng - Hụt - Hỏng
 * 6. Tiêu hao thực tế/khách = (Xuất - Hụt - Hỏng) / Tổng số khách
 * 
 * Cảnh báo đỏ: Nếu tiền thất thoát > 300,000 VNĐ HOẶC tỷ lệ lệch > 5.0%.
 */
@Service
@Slf4j
public class ReconciliationCalculationService {

    public static final BigDecimal LOSS_AMOUNT_THRESHOLD = new BigDecimal("300000.00");
    public static final BigDecimal LOSS_RATE_THRESHOLD = new BigDecimal("5.00");

    /**
     * Tính toán đầy đủ 6 chỉ số đối soát và kiểm tra vượt ngưỡng cảnh báo đỏ.
     *
     * @param input Các thông số tồn kho, định mức, số khách và hao hụt
     * @return CalculationFormulaResult chứa 6 chỉ số và cờ cảnh báo isOverThreshold
     */
    public CalculationFormulaResult calculate(CalculationFormulaInput input) {
        BigDecimal opening = input.getOpeningStock() != null ? input.getOpeningStock() : BigDecimal.ZERO;
        BigDecimal inStock = input.getInStock() != null ? input.getInStock() : BigDecimal.ZERO;
        BigDecimal closing = input.getClosingStock() != null ? input.getClosingStock() : BigDecimal.ZERO;
        BigDecimal costPrice = input.getCostPrice() != null ? input.getCostPrice() : BigDecimal.ZERO;

        int adultGuests = input.getAdultGuests() != null ? input.getAdultGuests() : 0;
        int childGuests = input.getChildGuests() != null ? input.getChildGuests() : 0;
        int totalGuests = adultGuests + childGuests;

        BigDecimal stdPerGuest = input.getStandardPerGuest() != null ? input.getStandardPerGuest() : BigDecimal.ZERO;
        BigDecimal childFactor = input.getChildDiscountFactor() != null ? input.getChildDiscountFactor() : new BigDecimal("0.5");

        BigDecimal processingLoss = input.getProcessingLossQty() != null ? input.getProcessingLossQty() : BigDecimal.ZERO;
        BigDecimal reportedDamage = input.getReportedDamageQty() != null ? input.getReportedDamageQty() : BigDecimal.ZERO;

        // Công thức 1: Xuất = Tồn đầu + Nhập - Tồn cuối
        BigDecimal exportedQty = opening.add(inStock).subtract(closing);
        if (exportedQty.compareTo(BigDecimal.ZERO) < 0) {
            exportedQty = BigDecimal.ZERO;
        }

        // Công thức 2: Khách dùng = (Người lớn + Trẻ em * Hệ số) * Định mức chuẩn
        BigDecimal effectiveGuests = BigDecimal.valueOf(adultGuests).add(BigDecimal.valueOf(childGuests).multiply(childFactor));
        BigDecimal guestConsumptionQty = effectiveGuests.multiply(stdPerGuest).setScale(3, RoundingMode.HALF_UP);

        // Công thức 5: Lệch không rõ = Xuất - Khách dùng - Hụt chế biến - Hỏng có báo
        BigDecimal unexplainedLossQty = exportedQty.subtract(guestConsumptionQty)
                .subtract(processingLoss)
                .subtract(reportedDamage)
                .setScale(3, RoundingMode.HALF_UP);

        // Quy đổi thành tiền thất thoát
        BigDecimal unexplainedLossAmount = unexplainedLossQty.compareTo(BigDecimal.ZERO) > 0
                ? unexplainedLossQty.multiply(costPrice).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        // Tỷ lệ % thất thoát trên tổng lượng xuất
        BigDecimal unexplainedLossRate = BigDecimal.ZERO;
        if (exportedQty.compareTo(BigDecimal.ZERO) > 0 && unexplainedLossQty.compareTo(BigDecimal.ZERO) > 0) {
            unexplainedLossRate = unexplainedLossQty.divide(exportedQty, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // Công thức 6: Tiêu hao thực tế trung bình trên mỗi khách
        BigDecimal actualConsumptionPerGuest = BigDecimal.ZERO;
        if (totalGuests > 0) {
            BigDecimal actualUsed = exportedQty.subtract(processingLoss).subtract(reportedDamage);
            if (actualUsed.compareTo(BigDecimal.ZERO) > 0) {
                actualConsumptionPerGuest = actualUsed.divide(BigDecimal.valueOf(totalGuests), 4, RoundingMode.HALF_UP);
            }
        }

        // Đánh giá cờ cảnh báo đỏ: Tiền thất thoát > 300,000 VNĐ HOẶC Tỷ lệ % > 5.0%
        boolean isOverThreshold = unexplainedLossAmount.compareTo(LOSS_AMOUNT_THRESHOLD) > 0
                || unexplainedLossRate.compareTo(LOSS_RATE_THRESHOLD) > 0;

        return CalculationFormulaResult.builder()
                .exportedQty(exportedQty)
                .guestConsumptionQty(guestConsumptionQty)
                .processingLossQty(processingLoss)
                .reportedDamageQty(reportedDamage)
                .unexplainedLossQty(unexplainedLossQty)
                .unexplainedLossAmount(unexplainedLossAmount)
                .unexplainedLossRate(unexplainedLossRate)
                .actualConsumptionPerGuest(actualConsumptionPerGuest)
                .isOverThreshold(isOverThreshold)
                .build();
    }
}
