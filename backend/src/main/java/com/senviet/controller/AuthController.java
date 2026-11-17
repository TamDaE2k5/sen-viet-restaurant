package com.senviet.controller;

import com.senviet.domain.dto.request.LoginRequest;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.JwtAuthResponse;
import com.senviet.domain.dto.response.UserProfileResponse;
import com.senviet.security.UserPrincipal;
import com.senviet.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Controller xử lý các tác vụ xác thực và phân quyền người dùng.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Các endpoint xác thực tài khoản và kiểm tra phiên làm việc")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập tài khoản", description = "Xác thực username/password và cấp Bearer JWT token")
    public ResponseEntity<ApiResponse<JwtAuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        JwtAuthResponse authResponse = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Đăng nhập thành công", authResponse));
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin người dùng hiện tại", description = "Trả về thông tin user profile và danh sách quyền hạn")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getCurrentUser(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse profile = authService.getCurrentUserProfile(currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin tài khoản thành công", profile));
    }
}
