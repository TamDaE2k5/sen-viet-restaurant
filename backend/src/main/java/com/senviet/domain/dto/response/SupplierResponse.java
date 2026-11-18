package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SupplierResponse {

    private Long id;
    private String supplierCode;
    private String supplierName;
    private String phone;
    private String address;
    private String contactPerson;
    private String email;
    private String taxCode;
    private String status;
    private Instant createdAt;
}
