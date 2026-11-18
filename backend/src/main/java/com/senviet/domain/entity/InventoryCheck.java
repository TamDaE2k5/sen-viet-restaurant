package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Biên Bản Kiểm Kê Kho (Đầu Ca / Cuối Ca).
 */
@Entity
@Table(name = "inventory_checks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class InventoryCheck extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "check_code", length = 100, nullable = false, unique = true)
    private String checkCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @Column(name = "shift", length = 20, nullable = false)
    @Builder.Default
    private String shift = "CA_NGAY";

    @Column(name = "check_date", nullable = false)
    private LocalDate checkDate;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checked_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "branch"})
    private User checkedByUser;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "HOAN_THANH";

    @Column(name = "note", length = 500)
    private String note;

    @OneToMany(mappedBy = "inventoryCheck", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties("inventoryCheck")
    private List<InventoryCheckItem> items = new ArrayList<>();
}
