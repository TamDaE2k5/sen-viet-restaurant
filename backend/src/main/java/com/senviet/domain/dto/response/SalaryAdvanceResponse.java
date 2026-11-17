package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO phản hồi thông tin đơn xin ứng lương.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryAdvanceResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String username;
    private Long branchId;
    private String branchName;
    private LocalDate requestDate;
    private BigDecimal requestedAmount;
    private String reason;
    private BigDecimal disbursedAmount;
    private String deductionMonth;
    private String status;
    private String approvedByName;
    private Instant approvedAt;
    private String managerNote;
}
