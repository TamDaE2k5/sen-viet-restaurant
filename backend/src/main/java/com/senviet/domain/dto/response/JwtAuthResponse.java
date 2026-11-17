package com.senviet.domain.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Phản hồi sau khi đăng nhập thành công chứa access token và thông tin phiên làm việc.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JwtAuthResponse {

    private String accessToken;

    @Builder.Default
    private String tokenType = "Bearer";

    private Long expiresIn;

    private Long userId;

    private String username;

    private String fullName;

    private Long branchId;

    private String branchName;

    private List<String> roles;
}
