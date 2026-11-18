package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * Thực thể Phiếu Kho (Nhập, Xuất chuyển, Huỷ, Kiểm kê).
 */
@Entity
@Table(name = "warehouse_documents")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class WarehouseDocument extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "doc_type", length = 50, nullable = false)
    private String docType; // NHAP, XUAT_CHUYEN, HUY, KIEM_KE

    @Column(name = "doc_code", length = 100, nullable = false, unique = true)
    private String docCode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "branch_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "users"})
    private Branch branch;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "supplier_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Supplier supplier;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "created_by_user_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "roles", "branch"})
    private User createdByUser;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "HOAN_THANH";

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "total_amount", precision = 15, scale = 2, nullable = false)
    @Builder.Default
    private BigDecimal totalAmount = BigDecimal.ZERO;

    @Column(name = "image_urls", columnDefinition = "TEXT")
    private String imageUrls;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    @JsonIgnoreProperties("document")
    private List<WarehouseDocumentItem> items = new ArrayList<>();
}
