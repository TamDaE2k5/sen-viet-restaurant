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
import java.util.stream.Collectors;

/**
 * Đại diện cho danh tính bảo mật của người dùng đăng nhập trong Spring Security context.
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
        List<GrantedAuthority> authorities = user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority(role.getRoleName().name()))
                .collect(Collectors.toList());

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
