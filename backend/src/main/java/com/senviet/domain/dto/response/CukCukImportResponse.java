package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO Kết Quả Bóc Tách File Excel CukCuk POS.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CukCukImportResponse {
    private Long id;
    private String fileName;
    private LocalDate importDate;
    private String shiftType;
    private BigDecimal totalRevenue;
    private Integer adultGuestCount;
    private Integer childGuestCount;
    private Integer totalGuestCount;
    private Integer standardBuffetCount;
    private Integer vipBuffetCount;
    private String message;
}
