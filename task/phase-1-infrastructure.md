# Giai Đoạn 1: Khởi Tạo Kiến Trúc, Hạ Tầng Docker & Phân Quyền RBAC
> **Mã giai đoạn**: `P1-INFRA`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#giai-đoạn-1](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Thiết lập bộ khung dự án full-stack hoàn chỉnh, cấu hình Docker Compose 3 tầng, triển khai Spring Security JWT với phân quyền 5 vai trò, và tạo giao diện App Shell chuẩn cho cả Mobile và Desktop.

---

## Danh Sách Công Việc (Tasks)

- [ ] **Task 1.1: Khởi tạo Cấu trúc Dự án & Docker Compose**
  - **Mô tả**: Tạo thư mục `backend/`, `frontend/`, file `docker-compose.yml` tích hợp 3 services (`postgres`, `backend`, `frontend`), cùng file `.env.example`.
  - **Tiêu chí nghiệm thu**: Lệnh `docker compose up -d` khởi động PostgreSQL 16 port 5432 và container giữ dữ liệu qua volume `postgres_data`.
  - **Độ ưu tiên**: P0 (Bắt buộc)

- [ ] **Task 1.2: Cấu hình Spring Boot 3.x Backend (Java 17 Maven)**
  - **Mô tả**: Thiết lập `backend/pom.xml` với các thư viện cốt lõi: Spring Boot 3.2+, Spring Web, Spring Security, Spring Data JPA, PostgreSQL JDBC, Flyway, Lombok, Jakarta Validation, Springdoc OpenAPI (Swagger UI), Apache POI.
  - **Tiêu chí nghiệm thu**: Biên dịch dự án thành công, Actuator `/actuator/health` trả về `{"status":"UP"}`.
  - **Độ ưu tiên**: P0

- [ ] **Task 1.3: Thiết kế Schema CSDL Ban Đầu & Migration Flyway**
  - **Mô tả**: Viết script migration `V1__init_auth_and_master.sql` tạo các bảng: `branches` (Thái Nguyên, Quế Võ), `users`, `roles`, `user_roles`.
  - **Tiêu chí nghiệm thu**: Flyway tự động migrate khi backend khởi động, cấu trúc bảng đúng định dạng và có ràng buộc khóa ngoại chặt chẽ.
  - **Độ ưu tiên**: P0

- [ ] **Task 1.4: Phân Quyền Bảo Mật Spring Security 6.x & JWT Token**
  - **Mô tả**: Cài đặt JWT Provider (tạo & xác thực access token), cấu hình CORS, FilterChain, mã hóa mật khẩu bằng BCrypt. Thiết lập cơ chế kiểm tra 5 vai trò:
    - `ROLE_KITCHEN_STAFF` (Bếp)
    - `ROLE_RESTAURANT_MANAGER` (Quản lý nhà hàng)
    - `ROLE_BRANCH_ACCOUNTANT` (Kế toán chi nhánh)
    - `ROLE_GENERAL_ACCOUNTANT` (Kế toán tổng)
    - `ROLE_EMPLOYEE` (Nhân viên chung)
  - **Tiêu chí nghiệm thu**: API `POST /api/v1/auth/login` cấp token thành công; API `GET /api/v1/auth/me` trả về thông tin user kèm danh sách roles và `branchId`.
  - **Độ ưu tiên**: P0

- [ ] **Task 1.5: Khởi tạo Frontend React Vite & App Shell**
  - **Mô tả**: Khởi tạo thư mục `frontend/` bằng Vite + React 18 + TypeScript + Tailwind CSS + Lucide React. Cấu hình Axios Interceptors tự động đính kèm Bearer token và xử lý chuyển hướng khi hết hạn phiên làm việc.
  - **Tiêu chí nghiệm thu**: Giao diện đăng nhập đẹp mắt, hỗ trợ hiển thị linh hoạt trên cả Mobile (dành cho Bếp & Nhân viên) và Desktop (dành cho Quản lý & Kế toán).
  - **Độ ưu tiên**: P0

- [ ] **Task 1.6: Seed Dữ liệu Ban Đầu & Kiểm Tra Toàn Diện P1**
  - **Mô tả**: Tạo seed script nạp 2 chi nhánh mẫu và 5 tài khoản tương ứng 5 vai trò (mật khẩu mặc định bảo mật cho demo).
  - **Tiêu chí nghiệm thu**: Đăng nhập thử nghiệm thành công 5 tài khoản; Swagger UI tại `http://localhost:8080/swagger-ui.html` hiển thị rõ ràng các endpoints.
  - **Độ ưu tiên**: P1
