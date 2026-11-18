package com.senviet.domain.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO yêu cầu mở khóa kỳ bảng lương đã chốt.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin yêu cầu mở khóa kỳ bảng lương")
public class UnlockPeriodRequest {

    @NotBlank(message = "Lý do mở khóa không được để trống")
    @Schema(description = "Lý do mở khóa kỳ bảng lương", example = "Bổ sung ngày công và điều chỉnh tạm ứng cho nhân viên bếp")
    private String reason;
}
