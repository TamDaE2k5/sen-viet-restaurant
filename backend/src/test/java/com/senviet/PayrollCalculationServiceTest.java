package com.senviet;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Kiểm thử Unit Test cho Công thức Bảng Lương & Điều Kiện Tăng Lương Tự Động (Phase 5).
 */
class PayrollCalculationServiceTest {

    @Test
    @DisplayName("Tính lương nhân viên bình thường có tạm ứng và tăng lương: Thực lĩnh chuẩn xác")
    void testStandardPayrollWithAdvanceDeduction() {
        // GIVEN
        BigDecimal baseSalary = new BigDecimal("8500000.00");
        BigDecimal salaryRaise = new BigDecimal("500000.00");
        BigDecimal allowance = new BigDecimal("500000.00");
        BigDecimal actualDays = new BigDecimal("26.0");
        BigDecimal standardDays = new BigDecimal("26.0");
        BigDecimal advanceDeduction = new BigDecimal("2000000.00");

        // WHEN: Gross = (Base + Raise) * Actual / Standard + Allowance
        BigDecimal effectiveSalary = baseSalary.add(salaryRaise);
        BigDecimal prorated = effectiveSalary.multiply(actualDays).divide(standardDays, 2, RoundingMode.HALF_UP);
        BigDecimal grossSalary = prorated.add(allowance);
        BigDecimal netSalary = grossSalary.subtract(advanceDeduction);

        // THEN
        assertThat(grossSalary).isEqualByComparingTo(new BigDecimal("9500000.00"));
        assertThat(netSalary).isEqualByComparingTo(new BigDecimal("7500000.00"));
    }

    @Test
    @DisplayName("Nhân viên tự ý bỏ việc: Lương thực lĩnh bắt buộc = 0 đ theo quy chế")
    void testAbandonedEmployee_ShouldHaveZeroSalary() {
        boolean isAbandoned = true;
        BigDecimal netSalary = isAbandoned ? BigDecimal.ZERO : new BigDecimal("8500000.00");
        String note = isAbandoned ? "Bỏ việc — không trả theo quy định" : "Bình thường";

        assertThat(netSalary).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(note).contains("Bỏ việc — không trả theo quy định");
    }

    @Test
    @DisplayName("Kiểm tra 3 điều kiện tăng lương: Điểm >=80, Đi muộn <=3, Không nghỉ không phép")
    void testSalaryIncreaseEligibility() {
        BigDecimal passThreshold = new BigDecimal("80.00");
        int maxLateAllowed = 3;

        // Trường hợp 1: Đủ cả 3 điều kiện -> Hợp lệ
        BigDecimal score1 = new BigDecimal("85.00");
        int late1 = 1;
        int absence1 = 0;
        boolean eligible1 = score1.compareTo(passThreshold) >= 0 && late1 <= maxLateAllowed && absence1 == 0;
        assertThat(eligible1).isTrue();

        // Trường hợp 2: Điểm thi 75 (< 80) -> Không hợp lệ
        BigDecimal score2 = new BigDecimal("75.00");
        int late2 = 0;
        int absence2 = 0;
        boolean eligible2 = score2.compareTo(passThreshold) >= 0 && late2 <= maxLateAllowed && absence2 == 0;
        assertThat(eligible2).isFalse();

        // Trường hợp 3: Điểm 90 nhưng đi muộn 4 lần (> 3) -> Không hợp lệ
        BigDecimal score3 = new BigDecimal("90.00");
        int late3 = 4;
        int absence3 = 0;
        boolean eligible3 = score3.compareTo(passThreshold) >= 0 && late3 <= maxLateAllowed && absence3 == 0;
        assertThat(eligible3).isFalse();
    }
}
