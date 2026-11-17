package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể ghi nhận lượt chấm công selfie camera & định vị GPS Geofencing.
 */
@Entity
@Table(name = "attendances")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(name = "shift_name", length = 50, nullable = false)
    @Builder.Default
    private String shiftName = "CA_SANG";

    @Column(name = "check_in_time", nullable = false)
    private Instant checkInTime;

    @Column(name = "check_in_selfie_url", columnDefinition = "TEXT")
    private String checkInSelfieUrl;

    @Column(name = "check_in_latitude", precision = 10, scale = 7)
    private BigDecimal checkInLatitude;

    @Column(name = "check_in_longitude", precision = 10, scale = 7)
    private BigDecimal checkInLongitude;

    @Column(name = "check_in_distance_meters", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal checkInDistanceMeters = BigDecimal.ZERO;

    // TRUE nếu khoảng cách đến chi nhánh <= 100m
    @Column(name = "is_valid_location", nullable = false)
    @Builder.Default
    private Boolean isValidLocation = true;

    @Column(name = "late_minutes", nullable = false)
    @Builder.Default
    private Integer lateMinutes = 0;

    @Column(name = "check_out_time")
    private Instant checkOutTime;

    @Column(name = "check_out_selfie_url", columnDefinition = "TEXT")
    private String checkOutSelfieUrl;

    @Column(name = "check_out_latitude", precision = 10, scale = 7)
    private BigDecimal checkOutLatitude;

    @Column(name = "check_out_longitude", precision = 10, scale = 7)
    private BigDecimal checkOutLongitude;

    @Column(name = "check_out_distance_meters", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal checkOutDistanceMeters = BigDecimal.ZERO;

    @Column(name = "early_minutes", nullable = false)
    @Builder.Default
    private Integer earlyMinutes = 0;

    @Column(name = "work_shift_hours", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal workShiftHours = new BigDecimal("8.00");

    @Column(name = "actual_hours", precision = 4, scale = 2)
    @Builder.Default
    private BigDecimal actualHours = BigDecimal.ZERO;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "DANG_LAM";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
