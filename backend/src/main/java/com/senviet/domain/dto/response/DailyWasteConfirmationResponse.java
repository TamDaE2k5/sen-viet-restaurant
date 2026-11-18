package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DailyWasteConfirmationResponse {

    private Long id;
    private Long branchId;
    private String branchName;
    private Long itemId;
    private String itemCode;
    private String itemName;
    private LocalDate wasteDate;
    private String shift;
    private BigDecimal quantity;
    private String unit;
    private Long confirmedById;
    private String confirmedByName;
    private String status;
    private String note;
    private Instant createdAt;
}
