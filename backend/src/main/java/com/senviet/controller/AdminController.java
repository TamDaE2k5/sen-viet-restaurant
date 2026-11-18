package com.senviet.controller;

import com.senviet.domain.dto.request.AssignRolesRequest;
import com.senviet.domain.dto.response.ApiResponse;
import com.senviet.domain.dto.response.UserProfileResponse;
import com.senviet.security.UserPrincipal;
import com.senviet.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller Quản Trị Hệ Thống Dành Cho Kế Toán Tổng & Chủ Chuỗi.
 * Chịu trách nhiệm phân quyền đa vai trò (Multi-Role RBAC) và kiểm toán nhân sự.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Administration", description = "Các API quản trị phân quyền đa vai trò và giám sát nhân sự hệ thống")
@PreAuthorize("hasRole('ROLE_GENERAL_ACCOUNTANT')")
public class AdminController {

    private final UserService userService;

    @GetMapping("/users")
    @Operation(summary = "Danh sách người dùng toàn hệ thống", description = "Dành cho Kế toán tổng / Admin theo dõi tài khoản và vai trò của 2 chi nhánh")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getAllUsers() {
        List<UserProfileResponse> users = userService.getAllUsers();
        return ResponseEntity.ok(ApiResponse.ok("Lấy danh sách người dùng thành công", users));
    }

    @GetMapping("/users/{userId}")
    @Operation(summary = "Chi tiết người dùng", description = "Xem chi tiết thông tin hồ sơ và danh sách vai trò hiện tại")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserById(@PathVariable Long userId) {
        UserProfileResponse user = userService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.ok("Lấy thông tin người dùng thành công", user));
    }

    @PostMapping("/users/{userId}/roles")
    @Operation(summary = "Gán/Cập nhật vai trò người dùng (Multi-Role RBAC)", description = "Gán thêm hoặc thu hồi vai trò của nhân viên, tự động ghi audit log")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateUserRoles(
            @PathVariable Long userId,
            @Valid @RequestBody AssignRolesRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        UserProfileResponse updatedUser = userService.updateUserRoles(userId, request, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Cập nhật phân quyền người dùng thành công", updatedUser));
    }
}
