# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 9 (PHASE 9)
## Hệ Thống Phân Quyền Đa Vai Trò (Multi-Role RBAC Architecture)

> **Căn cứ**: Mục 2.2 trong [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md)  
> **Mục tiêu**: Cải tiến kiến trúc xác thực và phân quyền, cho phép một nhân sự sở hữu đồng thời nhiều vai trò (ví dụ: Nhân viên Bếp vừa thao tác kho bếp vừa là Nhân viên cá nhân để chấm công khuôn mặt và thi đánh giá).

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [ ] **Task 9.1: Flyway Migration `V9__multi_role_user_schema.sql`**
  - Tạo bảng trung gian `user_roles`: `user_id BIGINT REFERENCES users(id) ON DELETE CASCADE`, `role_name VARCHAR(50) NOT NULL`, `assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP`, `PRIMARY KEY (user_id, role_name)`.
  - Viết script SQL di chuyển dữ liệu hiện có từ cột `users.role` sang bảng `user_roles`.
  - Giữ lại cột `users.role` như vai trò mặc định (primary role) để tương thích ngược.

- [ ] **Task 9.2: Nâng Cấp Spring Security & JWT Token Multi-Role**
  - Cập nhật `CustomUserDetails`:
    - Thay thế single `GrantedAuthority` bằng `Set<SimpleGrantedAuthority>` nạp toàn bộ danh sách vai trò từ `user_roles`.
  - Cập nhật `JwtTokenProvider`:
    - Đóng gói mảng vai trò `roles: ["ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE"]` vào JWT Claims.
    - Cập nhật phương thức trích xuất quyền từ token: `getAuthoritiesFromToken(String token)`.

- [ ] **Task 9.3: Rà Soát & Cập Nhật `@PreAuthorize` Trên Toàn Bộ REST APIs**
  - Đối với các API chung dành cho nhân viên (Chấm công GPS, Nộp bài thi, Gửi đơn nghỉ việc, Gửi đơn ứng lương):
    - Đảm bảo kiểm tra: `@PreAuthorize("hasAnyRole('EMPLOYEE', 'KITCHEN_STAFF', 'RESTAURANT_MANAGER', 'BRANCH_ACCOUNTANT')")`.
  - Đảm bảo nhân viên bếp khi đăng nhập có thể thực hiện đồng thời:
    - Thao tác 4 nút bếp (`ROLE_KITCHEN_STAFF`).
    - Chấm công cá nhân, nộp bài thi, xem phiếu lương của mình (`ROLE_EMPLOYEE`).

- [ ] **Task 9.4: API Quản Trị Phân Quyền & Gán Vai Trò Dành Cho Kế Toán Tổng**
  - `POST /api/v1/admin/users/{userId}/roles`: Gán thêm hoặc thu hồi vai trò của người dùng.
  - Ghi audit log chi tiết ai gán quyền gì cho ai, lúc nào vào bảng `notification_logs` / `audit_logs`.

- [ ] **Task 9.5: Cải Tiến Giao Diện Người Dùng Hỗ Trợ Đa Ngữ Cảnh (Multi-Context Switcher)**
  - Cập nhật `AuthContext.tsx`: Lưu mảng `roles: string[]` và `hasRole(roleName: string): boolean`.
  - Tại Header giao diện: Nếu người dùng có $\ge 2$ vai trò, hiển thị Menu chuyển đổi nhanh không gian làm việc:
    - 🍳 **Khu Vực Bếp** (Dành cho 4 nút và cân mẻ).
    - 👤 **Cổng Nhân Viên Cá Nhân** (Chấm công ảnh, làm bài thi quý, gửi đơn ứng lương).
  - Tự động ghi nhớ không gian làm việc gần nhất trên thiết bị di động.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. Tài khoản `bep_thainguyen` được gán đồng thời 2 vai trò: `ROLE_KITCHEN_STAFF` và `ROLE_EMPLOYEE`.
2. Khi đăng nhập, token JWT chứa cả 2 vai trò.
3. Người dùng thao tác được 4 nút Bếp bình thường, đồng thời có thể vào mục Chấm công GPS hoặc Làm bài thi mà không bị lỗi 403 Forbidden.
4. Kế toán tổng có thể gán thêm vai trò Quản lý cho một nhân viên thông qua giao diện quản trị.
