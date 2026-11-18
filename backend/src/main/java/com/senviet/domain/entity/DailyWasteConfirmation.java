package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể Xác nhận Hủy Bỏ Món Dùng Trong Ngày Cuối Ca (Salad, bánh bao, nộm...).
 * Số lượng này được hạch toán vào "Hỏng/bỏ có báo" của Bảng cuối ngày nhưng không tính phạt nhân viên.
 */
@Entity
@Table(name = "daily_waste_confirmations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DailyWasteConfirmation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "item_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Item item;

    @Column(name = "waste_date", nullable = false)
    private LocalDate wasteDate;

    @Column(name = "shift", length = 20, nullable = false)
    @Builder.Default
    private String shift = "CA_NGAY";

    @Column(name = "quantity", precision = 12, scale = 3, nullable = false)
    private BigDecimal quantity;

    @Column(name = "unit", length = 20, nullable = false)
    @Builder.Default
    private String unit = "KG";

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "confirmed_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "branch"})
    private User confirmedByUser;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "DA_XAC_NHAN";

    @Column(name = "note", length = 500)
    private String note;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
