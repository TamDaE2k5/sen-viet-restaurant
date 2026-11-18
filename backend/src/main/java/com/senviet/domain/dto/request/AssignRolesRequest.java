package com.senviet.domain.dto.request;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * DTO yêu cầu gán hoặc cập nhật danh sách vai trò cho người dùng (Multi-Role RBAC).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Schema(description = "Thông tin yêu cầu gán danh sách vai trò cho người dùng")
public class AssignRolesRequest {

    @NotEmpty(message = "Danh sách vai trò không được để trống")
    @Schema(description = "Danh sách mã vai trò (vd: ['ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE'])", example = "[\"ROLE_KITCHEN_STAFF\", \"ROLE_EMPLOYEE\"]")
    private List<String> roles;
}
