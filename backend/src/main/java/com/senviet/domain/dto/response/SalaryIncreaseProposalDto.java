package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO đề xuất tăng lương định kỳ theo quý.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SalaryIncreaseProposalDto {
    private Long id;
    private Long userId;
    private String fullName;
    private String username;
    private Long branchId;
    private String branchName;
    private String examQuarter;
    private BigDecimal examScore;
    private Integer lateCount;
    private Integer unexcusedAbsenceCount;
    private Boolean isEligible;
    private BigDecimal raiseAmount;
    private String status;
    private String evaluationDetails;
    private String approvedByName;
    private Instant approvedAt;
    private Instant createdAt;
}
