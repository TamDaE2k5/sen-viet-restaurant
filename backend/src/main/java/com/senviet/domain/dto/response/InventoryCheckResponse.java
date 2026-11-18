package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InventoryCheckResponse {

    private Long id;
    private String checkCode;
    private Long branchId;
    private String branchName;
    private String shift;
    private LocalDate checkDate;
    private Long checkedById;
    private String checkedByName;
    private String status;
    private String note;
    private Instant createdAt;
    private List<InventoryCheckItemResponse> items;
}
