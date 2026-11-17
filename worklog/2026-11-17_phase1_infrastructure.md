# Nhật Ký Phát Triển: Giai Đoạn 1 - Kiến Trúc, Hạ Tầng & Phân Quyền (Phase 1)
- **Thời gian bắt đầu**: 2026-11-17 22:10 (UTC+7)
- **Thời gian hoàn thành**: 2026-11-17 22:36 (UTC+7)
- **Người thực hiện**: Lead Builder (AI Agent) & Lead Verifier (AI Agent)
- **Mã Task liên quan**: P1-INFRA (Tasks 1.1 - 1.6)
- **Nhánh Git**: `dev`
- **Trạng thái**: ✅ Hoàn thành toàn diện (Ready for Verifier Audit)

---

### 1. Mục Tiêu Giai Đoạn 1
Thiết lập bộ khung dự án full-stack hoàn chỉnh theo kiến trúc độc lập, hiện đại:
- **Hạ tầng**: Docker Compose 3 tầng (PostgreSQL 16, Spring Boot 3.2+ Backend, React 18 Vite Frontend Nginx).
- **Backend**: Spring Boot 3.2+, Java 17 LTS, Flyway Migration, Spring Security 6.x + JWT, BCrypt, RBAC 5 vai trò (`ROLE_KITCHEN_STAFF`, `ROLE_RESTAURANT_MANAGER`, `ROLE_BRANCH_ACCOUNTANT`, `ROLE_GENERAL_ACCOUNTANT`, `ROLE_EMPLOYEE`).
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide React, giao diện Responsive thích ứng Mobile (Bếp 4 nút) và Desktop (Dashboard Quản lý/Kế toán).
- **Dữ liệu**: Seed 2 chi nhánh (Thái Nguyên, Quế Võ) và 5 tài khoản demo tương ứng 5 vai trò.

---

### 2. Tiến Độ Thực Hiện Từng Task

#### Task 1.1: Khởi tạo Cấu trúc Dự án & Docker Compose
- **Tập tin**:
  - `docker-compose.yml`: Cấu hình 3 dịch vụ `postgres` (port 5432, volume `postgres_data`, healthcheck `pg_isready`), `backend` (port 8080, healthcheck actuator), `frontend` (port 80, nginx reverse proxy).
  - `.env.example`: Mẫu biến môi trường bảo mật với đầy đủ chú thích tiếng Việt cho cấu hình DB, JWT, Port và Zalo Webhook.
  - `backend/`, `frontend/`: Cấu trúc thư mục mã nguồn.
- **Kiểm tra**:
  - `docker compose config` hợp lệ.
  - Container `senviet-postgres` khởi động thành công và đạt trạng thái `healthy` trên cổng 5432.
  - Gắn volume `postgres_data` bền vững.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 1.2: Cấu hình Spring Boot 3.x Backend (Java 17 Maven)
- **Tập tin**:
  - `backend/pom.xml`: Spring Boot 3.2.5, Web, Security, Data JPA, Postgres, Flyway 10.10, Actuator, JJWT 0.12.5, Springdoc OpenAPI 2.3, POI 5.2.5, Lombok.
  - `backend/Dockerfile`: Multi-stage Dockerfile với Alpine JRE 17, non-root `appuser`.
  - `backend/mvnw`: Maven wrapper.
  - `backend/src/main/resources/application.yml`: Cấu hình datasource PostgreSQL, Flyway, JWT, Actuator.
- **Kiểm tra**:
  - `mvn clean compile` thành công 100%.
  - Actuator `/actuator/health` trả về `{"status":"UP","components":{"db":{"status":"UP"}}}`.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 1.3: Thiết kế Schema CSDL Ban Đầu & Migration Flyway
- **Tập tin**:
  - `backend/src/main/resources/db/migration/V1__init_auth_and_master.sql`: Tạo các bảng `branches`, `roles`, `users`, `user_roles` kèm chỉ mục tối ưu truy vấn.
- **Kiểm tra**:
  - Flyway tự động migrate thành công khi container backend khởi chạy.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 1.4: Phân Quyền Bảo Mật Spring Security 6.x & JWT Token
- **Tập tin**:
  - `SecurityConfig.java`: Cấu hình stateless session, BCrypt password encoder, CORS cho phép Web client, bảo vệ endpoints.
  - `JwtTokenProvider.java`: Ký và xác thực HMAC-SHA256 JWT tokens.
  - `JwtAuthenticationFilter.java` & `JwtAuthenticationEntryPoint.java`: Intercept bearer tokens và xử lý 401 JSON format.
  - `CustomUserDetailsService.java` & `UserPrincipal.java`: Tải thông tin người dùng và phân quyền 5 vai trò.
  - `AuthController.java` & `AuthService.java`: Endpoint `/api/v1/auth/login` và `/api/v1/auth/me`.
  - `GlobalExceptionHandler.java`: Bắt ngoại lệ và chuẩn hóa cấu trúc lỗi `ApiResponse<T>`.
- **Kiểm tra**:
  - Cả 5 vai trò đăng nhập thành công và truy xuất `/api/v1/auth/me` với Bearer token chính xác.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 1.5: Khởi tạo Frontend React Vite & App Shell
- **Tập tin**:
  - `frontend/package.json`, `vite.config.ts`, `tailwind.config.js`, `tsconfig.json`.
  - `frontend/src/api/client.ts`: Axios client với interceptor đính kèm Bearer token và tự động xử lý redirect khi 401 hết hạn phiên.
  - `frontend/src/context/AuthContext.tsx`: Context quản trị phiên đăng nhập và vai trò.
  - `frontend/src/components/layout/Navbar.tsx`: Thanh điều hướng hiển thị chi nhánh, vai trò và đăng xuất.
  - `frontend/src/components/layout/MobileShell.tsx`: Giao diện tối ưu di động với nút bấm cảm ứng lớn (tối thiểu 48px).
  - `frontend/src/components/layout/DesktopShell.tsx`: Giao diện sidebar desktop cho Quản lý & Kế toán.
  - `frontend/src/components/auth/LoginPage.tsx`: Giao diện đăng nhập đẹp mắt kèm nút chọn nhanh 5 tài khoản demo.
  - `frontend/src/components/dashboard/Dashboard.tsx`: Màn hình tổng quan thích ứng theo từng vai trò.
  - `frontend/Dockerfile` & `nginx.conf`: Nginx reverse proxy `/api/*` và SPA fallback.
- **Kiểm tra**:
  - TypeScript build thành công 0 lỗi.
  - Container frontend phục vụ HTTP 200 trên cổng 80 và reverse proxy API `/api/v1/auth/login` hoạt động hoàn hảo.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 1.6: Seed Dữ liệu Ban Đầu & Kiểm Tra Toàn Diện P1
- **Tập tin**:
  - `backend/src/main/resources/db/migration/V2__seed_branches_and_demo_users.sql`: Nạp 2 chi nhánh (Thái Nguyên, Quế Võ) và 5 tài khoản tương ứng 5 vai trò với mật khẩu `Demo@123456`.
- **Kiểm tra**:
  - Đăng nhập kiểm thử tự động 5/5 tài khoản:
    1. `bep_thainguyen` (`ROLE_KITCHEN_STAFF` - CN Thái Nguyên)
    2. `quanly_thainguyen` (`ROLE_RESTAURANT_MANAGER` - CN Thái Nguyên)
    3. `ketoan_thainguyen` (`ROLE_BRANCH_ACCOUNTANT` - CN Thái Nguyên)
    4. `ketoan_tong` (`ROLE_GENERAL_ACCOUNTANT` - Admin chuỗi)
    5. `nhanvien_quevo` (`ROLE_EMPLOYEE` - CN Quế Võ)
  - Swagger UI tại `http://localhost:8080/swagger-ui/index.html` hiển thị đẩy đủ OpenAPI specs.
- **Trạng thái**: ✅ Hoàn thành.
