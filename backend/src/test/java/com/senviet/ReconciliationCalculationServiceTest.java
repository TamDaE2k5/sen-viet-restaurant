package com.senviet;

import com.senviet.domain.dto.request.CalculationFormulaInput;
import com.senviet.domain.dto.response.CalculationFormulaResult;
import com.senviet.service.ReconciliationCalculationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử Unit Test cho Động cơ Tính Toán 6 Công Thức Đối Soát Cuối Ngày (ReconciliationCalculationService).
 */
class ReconciliationCalculationServiceTest {

    private ReconciliationCalculationService service;

    @BeforeEach
    void setUp() {
        service = new ReconciliationCalculationService();
    }

    @Test
    @DisplayName("Test món Cua Cà Mau: Thất thoát lớn > 300k và > 5% -> Phải đánh cờ ĐỎ (isOverThreshold = true)")
    void testHighLossExceedingThreshold_ShouldFlagRed() {
        // GIVEN: 20kg tồn đầu + 30kg nhập - 12kg tồn cuối = 38kg xuất
        // 120 người lớn, 30 trẻ em (hệ số 0.5) -> 135 khách quy đổi
        // Định mức 0.16 kg/khách -> Khách dùng 21.6 kg
        // Hụt chế biến 7.6 kg, Hỏng có báo 2.0 kg
        // Lệch = 38 - 21.6 - 7.6 - 2.0 = 6.8 kg
        // Giá vốn 350,000 đ -> Tiền lệch = 2,380,000 đ (> 300,000 đ)
        // Tỷ lệ lệch = 6.8 / 38 = 17.89% (> 5%)
        CalculationFormulaInput input = CalculationFormulaInput.builder()
                .openingStock(new BigDecimal("20.000"))
                .inStock(new BigDecimal("30.000"))
                .closingStock(new BigDecimal("12.000"))
                .costPrice(new BigDecimal("350000.00"))
                .adultGuests(120)
                .childGuests(30)
                .standardPerGuest(new BigDecimal("0.160"))
                .childDiscountFactor(new BigDecimal("0.5"))
                .processingLossQty(new BigDecimal("7.600"))
                .reportedDamageQty(new BigDecimal("2.000"))
                .build();

        // WHEN
        CalculationFormulaResult result = service.calculate(input);

        // THEN
        assertThat(result).isNotNull();
        assertThat(result.getExportedQty()).isEqualByComparingTo("38.000");
        assertThat(result.getGuestConsumptionQty()).isEqualByComparingTo("21.600");
        assertThat(result.getProcessingLossQty()).isEqualByComparingTo("7.600");
        assertThat(result.getReportedDamageQty()).isEqualByComparingTo("2.000");
        assertThat(result.getUnexplainedLossQty()).isEqualByComparingTo("6.800");
        assertThat(result.getUnexplainedLossAmount()).isEqualByComparingTo("2380000.00");
        assertThat(result.getUnexplainedLossRate()).isEqualByComparingTo("17.89");
        assertThat(result.getIsOverThreshold()).isTrue(); // Cờ đỏ
    }

    @Test
    @DisplayName("Test món đạt chuẩn: Thất thoát nhỏ trong ngưỡng cho phép -> Cờ xanh (isOverThreshold = false)")
    void testNormalItemWithinThreshold_ShouldFlagGreen() {
        // GIVEN: Xuất 100 khay bò, khách dùng 96 khay, hỏng 2 khay -> lệch 2 khay
        // Tiền lệch = 2 * 85,000 = 170,000 đ (< 300k)
        // Tỷ lệ lệch = 2 / 100 = 2.0% (< 5%)
        CalculationFormulaInput input = CalculationFormulaInput.builder()
                .openingStock(new BigDecimal("50.000"))
                .inStock(new BigDecimal("70.000"))
                .closingStock(new BigDecimal("20.000"))
                .costPrice(new BigDecimal("85000.00"))
                .adultGuests(120)
                .childGuests(30)
                .standardPerGuest(new BigDecimal("0.711")) // 135 * 0.711 ~ 96 khay
                .childDiscountFactor(new BigDecimal("0.5"))
                .processingLossQty(BigDecimal.ZERO)
                .reportedDamageQty(new BigDecimal("2.000"))
                .build();

        // WHEN
        CalculationFormulaResult result = service.calculate(input);

        // THEN
        assertThat(result.getExportedQty()).isEqualByComparingTo("100.000");
        assertThat(result.getUnexplainedLossAmount()).isLessThan(new BigDecimal("300000.00"));
        assertThat(result.getUnexplainedLossRate()).isLessThan(new BigDecimal("5.00"));
        assertThat(result.getIsOverThreshold()).isFalse(); // Cờ xanh
    }

    @Test
    @DisplayName("Test xử lý biên: Không có khách (0 khách) và tồn kho hợp lý không gây ngoại lệ chia cho 0")
    void testZeroGuests_ShouldHandleGracefullyWithoutDivisionByZero() {
        CalculationFormulaInput input = CalculationFormulaInput.builder()
                .openingStock(new BigDecimal("10.000"))
                .inStock(BigDecimal.ZERO)
                .closingStock(new BigDecimal("10.000"))
                .costPrice(new BigDecimal("100000.00"))
                .adultGuests(0)
                .childGuests(0)
                .standardPerGuest(new BigDecimal("0.200"))
                .build();

        CalculationFormulaResult result = service.calculate(input);

        assertThat(result.getExportedQty()).isEqualByComparingTo("0.000");
        assertThat(result.getGuestConsumptionQty()).isEqualByComparingTo("0.000");
        assertThat(result.getUnexplainedLossQty()).isEqualByComparingTo("0.000");
        assertThat(result.getActualConsumptionPerGuest()).isEqualByComparingTo("0.0000");
        assertThat(result.getIsOverThreshold()).isFalse();
    }
}
