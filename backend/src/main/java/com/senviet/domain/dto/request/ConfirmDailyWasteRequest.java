package com.senviet.domain.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
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
public class ConfirmDailyWasteRequest {

    private Long branchId;
    private String shift;
    private LocalDate wasteDate;
    private String note;

    @NotEmpty(message = "Danh sách món hủy bỏ không được để trống")
    @Valid
    private List<DailyWasteItemRequest> items;
}
