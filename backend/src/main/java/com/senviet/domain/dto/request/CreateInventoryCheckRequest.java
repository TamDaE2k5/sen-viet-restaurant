package com.senviet.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateInventoryCheckRequest {

    private Long branchId;

    @NotBlank(message = "Ca kiểm kê không được để trống (CA_SANG, CA_TOI, CA_NGAY)")
    private String shift;

    @NotNull(message = "Ngày kiểm kê không được để trống")
    private LocalDate checkDate;

    private String note;

    @NotEmpty(message = "Danh sách mặt hàng kiểm kê không được để trống")
    @Valid
    private List<InventoryCheckItemRequest> items;
}
