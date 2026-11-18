package com.senviet.service;

import com.senviet.domain.dto.request.LoginRequest;
import com.senviet.domain.dto.response.JwtAuthResponse;
import com.senviet.domain.dto.response.UserProfileResponse;
import com.senviet.domain.entity.User;
import com.senviet.domain.repository.UserRepository;
import com.senviet.exception.ApiException;
import com.senviet.exception.ResourceNotFoundException;
import com.senviet.security.JwtTokenProvider;
import com.senviet.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Service xử lý logic xác thực và thông tin hồ sơ người dùng.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final UserRepository userRepository;

    /**
     * Xác thực thông tin đăng nhập và cấp JWT Access Token.
     *
     * @param request Thông tin username & password
     * @return JwtAuthResponse chứa access token và thông tin người dùng
     */
    public JwtAuthResponse login(LoginRequest request) {
        log.info("Xử lý đăng nhập cho người dùng: {}", request.getUsername());

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);

        String jwt = tokenProvider.generateToken(authentication);
        UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

        List<String> roles = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return JwtAuthResponse.builder()
                .accessToken(jwt)
                .tokenType("Bearer")
                .expiresIn(tokenProvider.getExpirationMs())
                .userId(principal.getId())
                .username(principal.getUsername())
                .fullName(principal.getFullName())
                .branchId(principal.getBranchId())
                .branchName(principal.getBranchName())
                .roles(roles)
                .build();
    }

    /**
     * Lấy thông tin hồ sơ người dùng đang đăng nhập hiện tại.
     *
     * @param principal Thông tin UserPrincipal từ SecurityContext
     * @return UserProfileResponse
     */
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(UserPrincipal principal) {
        if (principal == null) {
            throw new ApiException("Người dùng chưa được xác thực");
        }

        User user = userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", principal.getId()));

        List<String> roles = user.getRoles().stream()
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
                .roles(roles)
                .status(user.getStatus())
                .build();
    }
}
