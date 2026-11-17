package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchResponse {

    private Long id;
    private String batchCode;
    private Long itemId;
    private String itemName;
    private String itemCode;
    private BigDecimal inputWeight;
    private BigDecimal outputWeight;
    private BigDecimal lossRate;
    private BigDecimal standardLossRate;
    private boolean overStandard;
    private boolean secondBatch;
    private String status;
    private String startedBy;
    private String finishedBy;
    private Instant startedAt;
    private Instant finishedAt;
    private String warningMessage;
}
