package com.senviet.service;

import com.senviet.domain.dto.request.AssignRolesRequest;
import com.senviet.domain.dto.response.UserProfileResponse;
import com.senviet.domain.entity.AuditLog;
import com.senviet.domain.entity.NotificationLog;
import com.senviet.domain.entity.Role;
import com.senviet.domain.entity.RoleName;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.AuditLogRepository;
import com.senviet.domain.repository.NotificationLogRepository;
import com.senviet.domain.repository.RoleRepository;
import com.senviet.domain.repository.UserRepository;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Service quản trị người dùng, phân quyền đa vai trò (Multi-Role RBAC)
 * và ghi nhận nhật ký kiểm toán hệ thống.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final AuditLogRepository auditLogRepository;
    private final NotificationLogRepository notificationLogRepository;

    /**
     * Lấy danh sách toàn bộ người dùng trong hệ thống (Dành cho Quản trị viên / Kế toán tổng).
     *
     * @return Danh sách UserProfileResponse
     */
    @Transactional(readOnly = true)
    public List<UserProfileResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    /**
     * Lấy thông tin chi tiết một người dùng theo ID.
     *
     * @param userId ID người dùng
     * @return UserProfileResponse
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getUserById(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", userId));
        return mapToProfileResponse(user);
    }

    /**
     * Gán hoặc thu hồi vai trò của người dùng (Multi-Role RBAC).
     * Yêu cầu quyền Kế toán tổng (ROLE_GENERAL_ACCOUNTANT).
     * Tự động ghi nhận audit log và notification log để đảm bảo tính minh bạch.
     *
     * @param targetUserId ID người dùng cần phân quyền
     * @param request      Danh sách vai trò mới cần gán
     * @param currentUser  Thông tin người thực hiện thao tác
     * @return UserProfileResponse sau khi cập nhật thành công
     */
    @Transactional
    public UserProfileResponse updateUserRoles(Long targetUserId, AssignRolesRequest request, UserPrincipal currentUser) {
        User user = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", targetUserId));

        if (request.getRoles() == null || request.getRoles().isEmpty()) {
            throw new ApiException("Người dùng bắt buộc phải có ít nhất một vai trò hợp lệ");
        }

        Set<Role> newRoles = new HashSet<>();
        for (String roleStr : request.getRoles()) {
            String normalizedRole = roleStr.trim().toUpperCase();
            if (!normalizedRole.startsWith("ROLE_")) {
                normalizedRole = "ROLE_" + normalizedRole;
            }

            RoleName roleName;
            try {
                roleName = RoleName.valueOf(normalizedRole);
            } catch (IllegalArgumentException e) {
                throw new ApiException("Mã vai trò không hợp lệ trong hệ thống: " + roleStr);
            }

            Role role = roleRepository.findByRoleName(roleName)
                    .orElseThrow(() -> new ResourceNotFoundException("Role", "roleName", roleName));
            newRoles.add(role);
        }

        List<String> oldRoles = user.getRoles().stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toList());

        // Cập nhật quan hệ roles
        user.setRoles(newRoles);

        // Cập nhật vai trò mặc định (primary role) cho tương thích ngược
        String primaryRole = newRoles.iterator().next().getRoleName().name();
        user.setRole(primaryRole);

        User savedUser = userRepository.save(user);

        List<String> newRoleNames = newRoles.stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toList());

        String actor = currentUser != null ? currentUser.getUsername() : "SYSTEM";
        String auditDetails = String.format("Cập nhật vai trò tài khoản '%s' (ID: %d): từ %s -> %s",
                user.getUsername(), user.getId(), oldRoles, newRoleNames);

        log.info("[AUDIT_RBAC] Người thực hiện: {} | {}", actor, auditDetails);

        // 1. Ghi nhật ký vào bảng audit_logs
        AuditLog auditLog = AuditLog.builder()
                .userId(currentUser != null ? currentUser.getId() : null)
                .action("UPDATE_USER_ROLES")
                .targetEntity("User")
                .targetId(user.getId())
                .details(auditDetails)
                .build();
        auditLogRepository.save(auditLog);

        // 2. Ghi nhật ký vào bảng notification_logs để đồng bộ giám sát
        NotificationLog notificationLog = NotificationLog.builder()
                .branch(user.getBranch())
                .channel("AUDIT_LOG")
                .recipient("ROLE_ADMINISTRATION")
                .title("PHÂN QUYỀN ĐA VAI TRÒ NGƯỜI DÙNG")
                .content(String.format("Người dùng %s đã thay đổi vai trò của %s: %s", actor, user.getFullName(), newRoleNames))
                .status("SENT")
                .build();
        notificationLogRepository.save(notificationLog);

        return mapToProfileResponse(savedUser);
    }

    /**
     * Ánh xạ thực thể User sang DTO UserProfileResponse.
     */
    private UserProfileResponse mapToProfileResponse(User user) {
        List<String> roleNames = user.getRoles().stream()
                .map(r -> r.getRoleName().name())
                .collect(Collectors.toList());

        Long branchId = user.getBranch() != null ? user.getBranch().getId() : null;
        String branchName = user.getBranch() != null ? user.getBranch().getBranchName() : null;
        String branchCode = user.getBranch() != null ? user.getBranch().getBranchCode() : null;

        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .branchId(branchId)
                .branchName(branchName)
                .branchCode(branchCode)
                .roles(roleNames)
                .status(user.getStatus())
                .build();
    }
}
