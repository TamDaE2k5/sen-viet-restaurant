package com.senviet;

import com.senviet.domain.dto.response.BatchLossResult;
import com.senviet.exception.ApiException;
import com.senviet.service.KitchenService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Kiểm thử đơn vị (Unit Tests) cho công thức tính toán hao hụt mẻ chế biến.
 * Tuân thủ nguyên tắc TDD và tiêu chí nghiệm thu Task 2.3.
 */
class KitchenServiceTest {

    private KitchenService kitchenService;

    @BeforeEach
    void setUp() {
        // Khởi tạo service không cần database cho pure unit test công thức
        kitchenService = new KitchenService(null, null, null, null, null, null, null, null);
    }

    @Test
    @DisplayName("Cua hấp 10kg -> 8kg thành phẩm: Hao hụt đúng 20%, không vượt định mức chuẩn 20%")
    void testStandardBatchLossRateWithinLimit() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("8.0");
        BigDecimal standardLoss = new BigDecimal("20.00");

        BatchLossResult result = kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss);

        assertThat(result.getLossRate()).isEqualByComparingTo("20.00");
        assertThat(result.isOverStandard()).isFalse();
    }

    @Test
    @DisplayName("Cua hấp 10kg -> 7.5kg thành phẩm: Hao hụt 25%, vượt định mức chuẩn 20% -> Bật cờ isOverStandard")
    void testOverStandardBatchLossRate() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("7.5");
        BigDecimal standardLoss = new BigDecimal("20.00");

        BatchLossResult result = kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss);

        assertThat(result.getLossRate()).isEqualByComparingTo("25.00");
        assertThat(result.isOverStandard()).isTrue();
    }

    @Test
    @DisplayName("Thành phẩm không thể nặng hơn nguyên liệu thô đầu vào -> Ném ApiException")
    void testOutputGreaterThanInputThrowsException() {
        BigDecimal inputWeight = new BigDecimal("10.0");
        BigDecimal outputWeight = new BigDecimal("11.5");
        BigDecimal standardLoss = new BigDecimal("20.00");

        assertThatThrownBy(() -> kitchenService.calculateBatchLoss(inputWeight, outputWeight, standardLoss))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("không thể vượt quá khối lượng đầu vào");
    }
}
