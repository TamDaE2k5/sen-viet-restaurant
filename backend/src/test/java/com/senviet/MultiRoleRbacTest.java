package com.senviet;

import com.senviet.domain.dto.request.AssignRolesRequest;
import com.senviet.domain.dto.response.UserProfileResponse;
import com.senviet.domain.entity.*;
import com.senviet.domain.repository.AuditLogRepository;
import com.senviet.domain.repository.NotificationLogRepository;
import com.senviet.domain.repository.RoleRepository;
import com.senviet.domain.repository.UserRepository;
import com.senviet.exception.ApiException;
import com.senviet.security.JwtTokenProvider;
import com.senviet.security.UserPrincipal;
import com.senviet.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Instant;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Kiểm thử toàn diện kiến trúc phân quyền đa vai trò (Multi-Role RBAC).
 * Xác thực:
 * 1. UserPrincipal chứa nhiều vai trò (Set<GrantedAuthority>)
 * 2. JwtTokenProvider đóng gói và trích xuất danh sách vai trò
 * 3. UserService cập nhật vai trò, ghi AuditLog & NotificationLog
 */
@ExtendWith(MockitoExtension.class)
class MultiRoleRbacTest {

    private JwtTokenProvider jwtTokenProvider;
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private NotificationLogRepository notificationLogRepository;

    private final String testJwtSecret = "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b";
    private final long testExpirationMs = 86400000L;

    @BeforeEach
    void setUp() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testJwtSecret);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationMs", testExpirationMs);

        userService = new UserService(userRepository, roleRepository, auditLogRepository, notificationLogRepository);
    }

    @Test
    @DisplayName("UserPrincipal: Người dùng sở hữu đồng thời 2 vai trò ROLE_KITCHEN_STAFF và ROLE_EMPLOYEE")
    void testUserPrincipal_MultiRole_ShouldContainBothAuthorities() {
        Branch branch = Branch.builder().id(1L).branchCode("CN_THAI_NGUYEN").branchName("Thái Nguyên").build();

        Role kitchenRole = Role.builder().id(1L).roleName(RoleName.ROLE_KITCHEN_STAFF).description("Bếp").build();
        Role employeeRole = Role.builder().id(2L).roleName(RoleName.ROLE_EMPLOYEE).description("Nhân viên").build();

        User user = User.builder()
                .id(10L)
                .username("bep_thainguyen")
                .password("hash")
                .fullName("Nguyễn Văn Bếp")
                .branch(branch)
                .status("ACTIVE")
                .roles(new HashSet<>(Arrays.asList(kitchenRole, employeeRole)))
                .build();

        UserPrincipal principal = UserPrincipal.create(user);

        assertThat(principal.getUsername()).isEqualTo("bep_thainguyen");
        assertThat(principal.getAuthorities()).hasSize(2);
        assertThat(principal.hasRole("ROLE_KITCHEN_STAFF")).isTrue();
        assertThat(principal.hasRole("ROLE_EMPLOYEE")).isTrue();
        assertThat(principal.hasRole("ROLE_RESTAURANT_MANAGER")).isFalse();
        assertThat(principal.hasAnyRole("ROLE_RESTAURANT_MANAGER", "ROLE_KITCHEN_STAFF")).isTrue();
        assertThat(principal.getRoles()).containsExactlyInAnyOrder("ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE");
    }

    @Test
    @DisplayName("JwtTokenProvider: Token đóng gói mảng roles và trích xuất chính xác danh sách quyền")
    void testJwtTokenProvider_MultiRole_GenerateAndExtractTokens() {
        Role kitchenRole = Role.builder().id(1L).roleName(RoleName.ROLE_KITCHEN_STAFF).build();
        Role employeeRole = Role.builder().id(2L).roleName(RoleName.ROLE_EMPLOYEE).build();

        User user = User.builder()
                .id(10L)
                .username("bep_thainguyen")
                .password("hash")
                .fullName("Nguyễn Văn Bếp")
                .status("ACTIVE")
                .roles(new HashSet<>(Arrays.asList(kitchenRole, employeeRole)))
                .build();

        UserPrincipal principal = UserPrincipal.create(user);
        Authentication authentication = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());

        // 1. Tạo JWT Token
        String token = jwtTokenProvider.generateToken(authentication);
        assertThat(token).isNotBlank();
        assertThat(jwtTokenProvider.validateToken(token)).isTrue();

        // 2. Trích xuất username
        String username = jwtTokenProvider.getUsernameFromToken(token);
        assertThat(username).isEqualTo("bep_thainguyen");

        // 3. Trích xuất danh sách tên vai trò (roles claim)
        List<String> roles = jwtTokenProvider.getRolesFromToken(token);
        assertThat(roles).containsExactlyInAnyOrder("ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE");

        // 4. Trích xuất Authorities
        Set<GrantedAuthority> authorities = jwtTokenProvider.getAuthoritiesFromToken(token);
        assertThat(authorities).hasSize(2);
        List<String> authNames = authorities.stream().map(GrantedAuthority::getAuthority).toList();
        assertThat(authNames).containsExactlyInAnyOrder("ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE");
    }

    @Test
    @DisplayName("UserService: Kế toán tổng gán thêm vai trò Quản lý cho nhân viên -> Cập nhật thành công & ghi AuditLog")
    void testUserService_UpdateUserRoles_SuccessWithAuditLogging() {
        Branch branch = Branch.builder().id(1L).branchCode("CN_THAI_NGUYEN").branchName("Thái Nguyên").build();

        Role employeeRole = Role.builder().id(2L).roleName(RoleName.ROLE_EMPLOYEE).description("Nhân viên").build();
        Role managerRole = Role.builder().id(3L).roleName(RoleName.ROLE_RESTAURANT_MANAGER).description("Quản lý").build();

        User user = User.builder()
                .id(20L)
                .username("nhanvien_tn")
                .fullName("Trần Thị Nhân Viên")
                .branch(branch)
                .status("ACTIVE")
                .roles(new HashSet<>(Collections.singletonList(employeeRole)))
                .build();

        when(userRepository.findById(20L)).thenReturn(Optional.of(user));
        when(roleRepository.findByRoleName(RoleName.ROLE_EMPLOYEE)).thenReturn(Optional.of(employeeRole));
        when(roleRepository.findByRoleName(RoleName.ROLE_RESTAURANT_MANAGER)).thenReturn(Optional.of(managerRole));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPrincipal generalAccountant = UserPrincipal.builder()
                .id(1L)
                .username("ketoan_tong")
                .fullName("Kế Toán Tổng")
                .build();

        AssignRolesRequest request = AssignRolesRequest.builder()
                .roles(Arrays.asList("ROLE_EMPLOYEE", "ROLE_RESTAURANT_MANAGER"))
                .build();

        UserProfileResponse response = userService.updateUserRoles(20L, request, generalAccountant);

        // Kiểm tra kết quả trả về
        assertThat(response.getRoles()).containsExactlyInAnyOrder("ROLE_EMPLOYEE", "ROLE_RESTAURANT_MANAGER");
        assertThat(user.getRole()).isNotNull();

        // Kiểm tra đã lưu vào DB
        verify(userRepository, times(1)).save(user);

        // Kiểm tra đã ghi nhận AuditLog
        verify(auditLogRepository, times(1)).save(argThat(audit ->
                audit.getAction().equals("UPDATE_USER_ROLES") &&
                audit.getTargetId().equals(20L) &&
                audit.getDetails().contains("nhanvien_tn")
        ));

        // Kiểm tra đã ghi nhận NotificationLog
        verify(notificationLogRepository, times(1)).save(argThat(notif ->
                notif.getChannel().equals("AUDIT_LOG") &&
                notif.getTitle().contains("PHÂN QUYỀN ĐA VAI TRÒ")
        ));
    }

    @Test
    @DisplayName("UserService: Gán mã vai trò không tồn tại trong enum -> Ném ngoại lệ ApiException")
    void testUserService_UpdateUserRoles_InvalidRole_ThrowsApiException() {
        User user = User.builder().id(20L).username("test_user").build();
        when(userRepository.findById(20L)).thenReturn(Optional.of(user));

        AssignRolesRequest request = AssignRolesRequest.builder()
                .roles(Collections.singletonList("ROLE_SUPER_ADMIN_UNKNOWN"))
                .build();

        assertThatThrownBy(() -> userService.updateUserRoles(20L, request, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("Mã vai trò không hợp lệ trong hệ thống");

        verify(userRepository, never()).save(any());
        verify(auditLogRepository, never()).save(any());
    }

    @Test
    @DisplayName("UserService: Gán danh sách vai trò rỗng -> Ném ngoại lệ ApiException")
    void testUserService_UpdateUserRoles_EmptyRoles_ThrowsApiException() {
        User user = User.builder().id(20L).username("test_user").build();
        when(userRepository.findById(20L)).thenReturn(Optional.of(user));

        AssignRolesRequest request = AssignRolesRequest.builder()
                .roles(Collections.emptyList())
                .build();

        assertThatThrownBy(() -> userService.updateUserRoles(20L, request, null))
                .isInstanceOf(ApiException.class)
                .hasMessageContaining("ít nhất một vai trò hợp lệ");

        verify(userRepository, never()).save(any());
    }
}
