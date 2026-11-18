package com.senviet.domain.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSupplierRequest {

    private String supplierName;
    private String phone;
    private String address;
    private String contactPerson;
    private String email;
    private String taxCode;
    private String status;
}
