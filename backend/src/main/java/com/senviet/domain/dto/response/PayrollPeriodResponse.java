package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * DTO phản hồi trạng thái kỳ bảng lương (Payroll Lock).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PayrollPeriodResponse {
    private Long id;
    private String periodMonth;
    private Long branchId;
    private String branchName;
    private String status; // 'OPEN', 'LOCKED'
    private Instant lockedAt;
    private String lockedByUsername;
    private String unlockReason;
}
