package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * DTO phản hồi thông tin chấm công.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private Long id;
    private Long userId;
    private String fullName;
    private String username;
    private Long branchId;
    private String branchName;
    private LocalDate attendanceDate;
    private String shiftName;
    private Instant checkInTime;
    private String checkInSelfieUrl;
    private BigDecimal checkInDistanceMeters;
    private Boolean isValidLocation;
    private Integer lateMinutes;
    private Instant checkOutTime;
    private String checkOutSelfieUrl;
    private BigDecimal checkOutDistanceMeters;
    private Integer earlyMinutes;
    private BigDecimal workShiftHours;
    private BigDecimal actualHours;
    private String status;
}
