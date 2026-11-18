package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

/**
 * Thực thể lưu trữ kết quả đối soát cuối ngày theo 6 công thức cốt lõi.
 */
@Entity
@Table(name = "daily_reconciliations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class DailyReconciliation {

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

    @Column(name = "recon_date", nullable = false)
    private LocalDate reconDate;

    @Column(name = "shift_type", length = 20, nullable = false)
    @Builder.Default
    private String shiftType = "CA_NGAY";

    // Công thức 1: Xuất kho = Tồn đầu + Nhập - Tồn cuối
    @Column(name = "exported_qty", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal exportedQty = BigDecimal.ZERO;

    // Công thức 2: Khách dùng theo định mức vé bán CukCuk
    @Column(name = "guest_consumption_qty", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal guestConsumptionQty = BigDecimal.ZERO;

    // Công thức 3: Hụt chế biến thực tế từ các mẻ
    @Column(name = "processing_loss_qty", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal processingLossQty = BigDecimal.ZERO;

    // Công thức 4: Hỏng có báo (đã duyệt hoặc tự động)
    @Column(name = "reported_damage_qty", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal reportedDamageQty = BigDecimal.ZERO;

    // Công thức 5: Lệch không rõ nguyên nhân (Thất thoát) = Xuất - Khách dùng - Hụt - Hỏng
    @Column(name = "unexplained_loss_qty", precision = 12, scale = 3, nullable = false)
    @Builder.Default
    private BigDecimal unexplainedLossQty = BigDecimal.ZERO;

    // Giá trị quy đổi tiền của lượng thất thoát (VNĐ)
    @Column(name = "unexplained_loss_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unexplainedLossAmount = BigDecimal.ZERO;

    // Tỷ lệ % thất thoát trên tổng lượng xuất
    @Column(name = "unexplained_loss_rate", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal unexplainedLossRate = BigDecimal.ZERO;

    // Công thức 6: Tiêu hao thực tế trung bình trên mỗi khách
    @Column(name = "actual_consumption_per_guest", precision = 8, scale = 4, nullable = false)
    @Builder.Default
    private BigDecimal actualConsumptionPerGuest = BigDecimal.ZERO;

    // Cờ đỏ cảnh báo thất thoát vượt ngưỡng (> 5% HOẶC > 300,000 VNĐ)
    @Column(name = "is_over_threshold", nullable = false)
    @Builder.Default
    private Boolean isOverThreshold = false;

    // Tên nhân viên kiểm kho chịu trách nhiệm ca
    @Column(name = "responsible_user_name", length = 100)
    private String responsibleUserName;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "CHUA_CHOT";

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
