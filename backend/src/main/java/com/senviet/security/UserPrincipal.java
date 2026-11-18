package com.senviet.security;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.senviet.domain.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Đại diện cho danh tính bảo mật của người dùng đăng nhập trong Spring Security context.
 * Hỗ trợ mô hình phân quyền đa vai trò (Multi-Role RBAC).
 */
@Getter
@Builder
@AllArgsConstructor
public class UserPrincipal implements UserDetails {

    private final Long id;
    private final String username;
    @JsonIgnore
    private final String password;
    private final String fullName;
    private final String email;
    private final Long branchId;
    private final String branchCode;
    private final String branchName;
    private final Collection<? extends GrantedAuthority> authorities;
    private final boolean active;

    public static UserPrincipal create(User user) {
        Set<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName().name()))
                .collect(Collectors.toSet());

        Long branchId = null;
        String branchCode = null;
        String branchName = null;

        if (user.getBranch() != null) {
            branchId = user.getBranch().getId();
            branchCode = user.getBranch().getBranchCode();
            branchName = user.getBranch().getBranchName();
        }

        return UserPrincipal.builder()
                .id(user.getId())
                .username(user.getUsername())
                .password(user.getPassword())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .branchId(branchId)
                .branchCode(branchCode)
                .branchName(branchName)
                .authorities(authorities)
                .active("ACTIVE".equalsIgnoreCase(user.getStatus()))
                .build();
    }

    /**
     * Lấy danh sách tên các vai trò của người dùng dạng chuỗi (vd: ["ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE"]).
     */
    public List<String> getRoles() {
        if (authorities == null) {
            return List.of();
        }
        return authorities.stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());
    }

    /**
     * Kiểm tra người dùng có nắm giữ một vai trò cụ thể hay không.
     */
    public boolean hasRole(String roleName) {
        if (authorities == null || roleName == null) {
            return false;
        }
        String target = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;
        return authorities.stream().anyMatch(a -> a.getAuthority().equalsIgnoreCase(target));
    }

    /**
     * Kiểm tra người dùng có nắm giữ bất kỳ vai trò nào trong danh sách hay không.
     */
    public boolean hasAnyRole(String... roleNames) {
        if (authorities == null || roleNames == null) {
            return false;
        }
        for (String roleName : roleNames) {
            if (hasRole(roleName)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
