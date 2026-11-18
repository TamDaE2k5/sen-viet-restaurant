package com.senviet.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateWarehouseDocumentRequest {

    private Long branchId;

    @NotBlank(message = "Loại phiếu không được để trống (NHAP, XUAT_CHUYEN, HUY, KIEM_KE)")
    private String docType;

    private Long supplierId;

    private String note;

    private String imageUrls;

    @NotEmpty(message = "Danh sách mặt hàng không được để trống")
    @Valid
    private List<WarehouseDocumentItemRequest> items;
}
