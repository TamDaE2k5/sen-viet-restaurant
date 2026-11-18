package com.senviet.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Tiện ích tạo và kiểm tra tính hợp lệ của JWT token.
 * Sử dụng thư viện JJWT 0.12.x chuẩn an toàn SHA-256.
 */
@Component
@Slf4j
public class JwtTokenProvider {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms:86400000}")
    private long jwtExpirationMs;

    private SecretKey getSigningKey() {
        byte[] keyBytes;
        try {
            // Thử giải mã nếu là chuỗi Hex hoặc Base64
            keyBytes = Decoders.BASE64.decode(jwtSecret);
        } catch (Exception e) {
            // Dự phòng: Chuỗi UTF-8 thông thường
            keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        }
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /**
     * Tạo JWT Access Token từ đối tượng xác thực Authentication.
     */
    public String generateToken(Authentication authentication) {
        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

        List<String> roles = userPrincipal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toList());

        return Jwts.builder()
                .subject(userPrincipal.getUsername())
                .claim("userId", userPrincipal.getId())
                .claim("branchId", userPrincipal.getBranchId())
                .claim("branchCode", userPrincipal.getBranchCode())
                .claim("fullName", userPrincipal.getFullName())
                .claim("roles", roles)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey(), Jwts.SIG.HS256)
                .compact();
    }

    /**
     * Trích xuất toàn bộ payload Claims từ JWT token đã được ký.
     *
     * @param token Chuỗi Bearer JWT Token
     * @return Claims payload
     */
    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /**
     * Trích xuất username (subject) từ JWT token.
     */
    public String getUsernameFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    /**
     * Trích xuất danh sách quyền (Authorities) từ JWT token phục vụ cấu hình SecurityContext.
     *
     * @param token Chuỗi Bearer JWT Token
     * @return Set<GrantedAuthority> chứa các SimpleGrantedAuthority
     */
    public Set<GrantedAuthority> getAuthoritiesFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        List<?> rolesObj = claims.get("roles", List.class);
        if (rolesObj == null || rolesObj.isEmpty()) {
            return Collections.emptySet();
        }

        return rolesObj.stream()
                .map(Object::toString)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toSet());
    }

    /**
     * Trích xuất mảng tên vai trò dạng chuỗi (vd: ["ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE"]) từ claim 'roles'.
     *
     * @param token Chuỗi Bearer JWT Token
     * @return List<String> danh sách mã vai trò
     */
    public List<String> getRolesFromToken(String token) {
        Claims claims = getClaimsFromToken(token);
        List<?> rolesObj = claims.get("roles", List.class);
        if (rolesObj == null) {
            return Collections.emptyList();
        }

        return rolesObj.stream()
                .map(Object::toString)
                .collect(Collectors.toList());
    }

    /**
     * Xác thực tính hợp lệ của JWT token.
     */
    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (SecurityException | MalformedJwtException e) {
            log.error("JWT token không hợp lệ hoặc sai chữ ký: {}", e.getMessage());
        } catch (ExpiredJwtException e) {
            log.error("JWT token đã hết hạn: {}", e.getMessage());
        } catch (UnsupportedJwtException e) {
            log.error("JWT token không được hỗ trợ: {}", e.getMessage());
        } catch (IllegalArgumentException e) {
            log.error("JWT claims rỗng: {}", e.getMessage());
        }
        return false;
    }

    public long getExpirationMs() {
        return jwtExpirationMs;
    }
}
