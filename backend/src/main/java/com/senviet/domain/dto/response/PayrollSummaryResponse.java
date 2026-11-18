package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO tổng hợp chi phí bảng lương chi nhánh, bóc tách dòng lương không trả do bỏ việc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollSummaryResponse {
    private String periodMonth;
    private Long branchId;
    private String branchName;
    private String periodStatus; // 'OPEN', 'LOCKED'
    private BigDecimal totalBranchCost; // Tổng chi phí lương thực chi nhánh (loại trừ các trường hợp excluded_from_cost)
    private BigDecimal totalUnpaidAbandonedSalary; // Mục riêng: 'Lương không trả do bỏ việc'
    private int totalEmployees;
    private int abandonedCount;
    private int uniformRetainedCount;
    private List<PayrollResponse> payrolls;
}
