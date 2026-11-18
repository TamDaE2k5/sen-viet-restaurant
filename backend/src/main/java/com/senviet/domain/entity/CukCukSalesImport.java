package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể lưu trữ lịch sử nạp dữ liệu bán hàng POS CukCuk.
 */
@Entity
@Table(name = "cukcuk_sales_imports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CukCukSalesImport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "import_date", nullable = false)
    private LocalDate importDate;

    @Column(name = "shift_type", length = 20, nullable = false)
    @Builder.Default
    private String shiftType = "CA_NGAY";

    @Column(name = "file_name", length = 255, nullable = false)
    private String fileName;

    @Column(name = "total_revenue", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalRevenue = BigDecimal.ZERO;

    @Column(name = "adult_guest_count", nullable = false)
    @Builder.Default
    private Integer adultGuestCount = 0;

    @Column(name = "child_guest_count", nullable = false)
    @Builder.Default
    private Integer childGuestCount = 0;

    @Column(name = "total_guest_count", nullable = false)
    @Builder.Default
    private Integer totalGuestCount = 0;

    @Column(name = "standard_buffet_count", nullable = false)
    @Builder.Default
    private Integer standardBuffetCount = 0;

    @Column(name = "vip_buffet_count", nullable = false)
    @Builder.Default
    private Integer vipBuffetCount = 0;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "imported_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash", "roles", "branch"})
    private User importedByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
