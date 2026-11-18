package com.senviet.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Thực thể mẻ chế biến thực phẩm (cân đầu vào, cân thành phẩm, tính hao hụt).
 */
@Entity
@Table(name = "processing_batches")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingBatch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id", nullable = false)
    private Branch branch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipe_id")
    private Recipe recipe;

    @Column(name = "batch_code", length = 100, nullable = false)
    private String batchCode;

    @Column(name = "input_weight", precision = 12, scale = 3, nullable = false)
    private BigDecimal inputWeight;

    @Column(name = "output_weight", precision = 12, scale = 3)
    private BigDecimal outputWeight;

    @Column(name = "loss_rate", precision = 5, scale = 2)
    private BigDecimal lossRate;

    @Column(name = "standard_loss_rate", precision = 5, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal standardLossRate = BigDecimal.ZERO;

    @Column(name = "is_over_standard", nullable = false)
    @Builder.Default
    private Boolean isOverStandard = false;

    @Column(name = "is_second_batch", nullable = false)
    @Builder.Default
    private Boolean isSecondBatch = false;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "DANG_LAM";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "started_by_user_id", nullable = false)
    private User startedByUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "finished_by_user_id")
    private User finishedByUser;

    @Column(name = "started_at", nullable = false)
    @Builder.Default
    private Instant startedAt = Instant.now();

    @Column(name = "finished_at")
    private Instant finishedAt;
}
