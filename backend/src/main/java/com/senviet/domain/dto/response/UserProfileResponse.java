package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Thông tin chi tiết hồ sơ người dùng hiện tại (/api/v1/auth/me).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;

    private String username;

    private String fullName;

    private String email;

    private String phone;

    private Long branchId;

    private String branchName;

    private String branchCode;

    private List<String> roles;

    private String status;
}
