package com.senviet.domain.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LineItemIncRequest {

    @NotNull(message = "ID món ăn không được để trống")
    private Long itemId;

    @Builder.Default
    @Min(value = 1, message = "Số lượng ra line tối thiểu là 1")
    private Integer quantity = 1;

    // Idempotency token để chống double-click từ thiết bị di động
    private String requestId;
}
