package com.senviet.domain.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

/**
 * Thực thể Nhà Cung Cấp (Suppliers).
 */
@Entity
@Table(name = "suppliers")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Supplier extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "supplier_code", length = 50, nullable = false, unique = true)
    private String supplierCode;

    @Column(name = "supplier_name", length = 255, nullable = false)
    private String supplierName;

    @Column(name = "phone", length = 50)
    private String phone;

    @Column(name = "address", length = 255)
    private String address;

    @Column(name = "contact_person", length = 100)
    private String contactPerson;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "tax_code", length = 50)
    private String taxCode;

    @Column(name = "status", length = 50, nullable = false)
    @Builder.Default
    private String status = "HOAT_DONG";
}
