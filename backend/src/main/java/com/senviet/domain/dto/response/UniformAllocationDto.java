package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO hiển thị danh mục đồng phục đã cấp cho nhân viên.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UniformAllocationDto {
    private Long id;
    private Long uniformItemId;
    private String uniformItemName;
    private BigDecimal depositValue;
    private LocalDate allocatedDate;
    private Boolean isReturned;
    private LocalDate returnedDate;
    private String note;
}
