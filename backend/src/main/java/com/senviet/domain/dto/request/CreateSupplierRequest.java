package com.senviet.domain.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSupplierRequest {

    @NotBlank(message = "Mã nhà cung cấp không được để trống")
    private String supplierCode;

    @NotBlank(message = "Tên nhà cung cấp không được để trống")
    private String supplierName;

    private String phone;
    private String address;
    private String contactPerson;
    private String email;
    private String taxCode;
    private String status;
}
