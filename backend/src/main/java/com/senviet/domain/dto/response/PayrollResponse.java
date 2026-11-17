package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO bảng lương nhân viên chi tiết.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String username;
    private Long branchId;
    private String branchName;
    private String payrollMonth;
    private BigDecimal baseSalary;
    private BigDecimal standardWorkDays;
    private BigDecimal actualWorkDays;
    private BigDecimal salaryRaise;
    private BigDecimal allowance;
    private BigDecimal grossSalary;
    private BigDecimal advanceDeduction;
    private BigDecimal penaltyDeduction;
    private BigDecimal netSalary;
    private String status;
    private Boolean isAbandoned;
    private Boolean isUniformRetained;
    private String bankName;
    private String bankAccountNumber;
    private String bankAccountHolder;
    private String note;
}
