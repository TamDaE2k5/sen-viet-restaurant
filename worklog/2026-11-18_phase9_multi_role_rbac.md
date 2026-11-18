# Nhật Ký Công Việc: Giai Đoạn 9 — Hệ Thống Phân Quyền Đa Vai Trò (Multi-Role RBAC Architecture)

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P9-MULTI-ROLE-RBAC` (Kiến trúc phân quyền đa vai trò, JWT Multi-Role claims, Switcher ngữ cảnh giao diện & API Quản trị phân quyền)  
**Tác giả thực hiện**: `@backend-dev`, `@frontend-dev`  
**Kiểm thử & Nghiệm thu**: `@verifier-2`  
**Nhánh Git**: `feature/p9-multi-role-rbac`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

Căn cứ theo mục 2.2 của tài liệu phản biện `phan_bien_va_gop_y_plan.md` và `task/phase-9-multi-role-rbac.md`:
1. **Kiến trúc dữ liệu phân quyền nhiều vai trò (Multi-Role Schema)**:
   - Một người dùng có thể đồng thời nắm giữ nhiều vai trò nghiệp vụ (ví dụ: Nhân viên bếp vừa có vai trò `ROLE_KITCHEN_STAFF` để chế biến và ra line, vừa có `ROLE_EMPLOYEE` để chấm công cá nhân, làm bài thi định kỳ quý, gửi đơn ứng lương và xem phiếu lương).
   - Duy trì cột `users.role` làm vai trò đại diện mặc định (primary role) để tương thích ngược.
2. **Nâng cấp Spring Security & JWT Claims**:
   - `UserPrincipal` nạp toàn bộ danh sách vai trò từ `user_roles` thành `Set<GrantedAuthority>`.
   - `JwtTokenProvider` mã hóa mảng vai trò `roles: [...]` vào JWT claims và giải mã chính xác khi xác thực request.
3. **Chuẩn hóa `@PreAuthorize` trên toàn bộ REST APIs**:
   - Cho phép các vai trò `ROLE_KITCHEN_STAFF`, `ROLE_RESTAURANT_MANAGER`, `ROLE_BRANCH_ACCOUNTANT` truy cập các endpoint tự phục vụ của nhân viên (`/api/v1/hr/attendance/*`, `/api/v1/hr/exams/*`, `/api/v1/hr/advances`, `/api/v1/hr/payroll/my-payslips`) mà không bị 403 Forbidden.
4. **API Quản trị gán/thu hồi vai trò & Nhật ký kiểm toán**:
   - `POST /api/v1/admin/users/{userId}/roles` dành riêng cho Kế toán tổng (`ROLE_GENERAL_ACCOUNTANT`).
   - Ghi nhật ký kiểm toán tự động vào bảng `audit_logs` phục vụ giám sát bảo mật.
5. **Giao diện chuyển đổi ngữ cảnh làm việc (Multi-Context Switcher)**:
   - Header hiển thị toggle chuyển đổi nhanh giữa 🍳 **Khu Vực Bếp** và 👤 **Cổng Nhân Viên Cá Nhân**.
   - Lưu trữ trạng thái ngữ cảnh vào `localStorage` (`senviet_active_context`).

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Cơ Sở Dữ Liệu & Flyway Migration (V9)
- **Tệp migration**: `backend/src/main/resources/db/migration/V9__multi_role_user_schema.sql`
- **Bảng và ràng buộc**:
  - Cột `users.role` lưu primary role.
  - Cột `user_roles.role_name` và `user_roles.assigned_at`.
  - Trigger PostgreSQL `trg_fill_user_role_name` tự động điền `role_name` từ bảng `roles` khi Hibernate thực hiện mapping `@ManyToMany`.
  - Bảng `audit_logs` (`id`, `user_id`, `action`, `target_entity`, `target_id`, `details`, `ip_address`, `created_at`).
  - Gán vai trò `ROLE_EMPLOYEE` cho `bep_thainguyen`, `quanly_thainguyen`, `ketoan_thainguyen`.

### 2.2. Backend (Java 17, Spring Boot 3, Spring Security 6)
- **Xác thực & Token**:
  - `UserPrincipal`: Quản lý `Set<GrantedAuthority>`, cung cấp `getRoles()`, `hasRole(role)`, `hasAnyRole(roles)`.
  - `JwtTokenProvider`: Đóng gói `roles: [...]` trong JWT claims; phân tích `getAuthoritiesFromToken(...)` chính xác.
- **Quản trị phân quyền**:
  - `AdminController` (`POST /api/v1/admin/users/{userId}/roles`) bảo vệ bằng `@PreAuthorize("hasRole('ROLE_GENERAL_ACCOUNTANT')")`.
  - `UserService.updateUserRoles(...)`: Cập nhật vai trò, ghi audit trail vào `audit_logs` và `notification_logs`.
- **Rà soát RBAC**:
  - Cập nhật `@PreAuthorize("hasAnyRole('ROLE_EMPLOYEE', 'ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT')")` cho toàn bộ các endpoint nhân viên cá nhân.

### 2.3. Frontend (React 18, TypeScript, Tailwind CSS)
- **AuthContext**: Quản lý mảng `roles: string[]`, `hasRole(role)`, `activeContext: AppContextType`, `availableContexts` và lưu trữ `localStorage`.
- **Navbar & Navigation**:
  - Hiển thị toggle Switcher ngữ cảnh trực quan trên Header khi người dùng sở hữu $\ge 2$ vai trò.
  - Hỗ trợ chuyển đổi nhanh mượt mà giữa không gian Bếp và Cổng nhân viên.
- **HRModule**:
  - Bổ sung tab Quản lý Phân Quyền Đa Vai Trò cho Kế toán tổng với modal gán/thu hồi vai trò trực tiếp.

---

## 3. Hoàn Thiện & Sửa Lỗi Trong Quá Trình Kiểm Thử (Verification Hardening)

- **Khắc phục lỗi Not-Null Constraint trên bảng `user_roles`**:
  - *Hiện tượng*: Khi Kế toán tổng gán vai trò mới, Hibernate JPA ánh xạ `@ManyToMany` chỉ chèn `(user_id, role_id)`. Cột `role_name` bị NULL dẫn đến lỗi PostgreSQL `ERROR: null value in column "role_name" violates not-null constraint`.
  - *Khắc phục*: Bổ sung trigger PostgreSQL `trg_fill_user_role_name` tự động tra cứu và điền `role_name` từ bảng `roles` khi có thao tác chèn/cập nhật, đồng thời điều chỉnh ràng buộc CSDL để tương thích hoàn toàn với JPA.

---

## 4. Kết Quả Nghiệm Thu Thực Tế (Acceptance Criteria Verification)

| Tiêu chí | Mô tả nghiệm thu | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| **Tiêu chí 1** | Tài khoản `bep_thainguyen` được gán đồng thời 2 vai trò: `ROLE_KITCHEN_STAFF` và `ROLE_EMPLOYEE`. | Truy vấn CSDL và phản hồi API login xác nhận tài khoản có cả 2 vai trò `["ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE"]`. | ✅ ĐẠT |
| **Tiêu chí 2** | Khi đăng nhập, token JWT chứa mảng vai trò đầy đủ. | Giải mã payload JWT xác nhận claim `"roles": ["ROLE_KITCHEN_STAFF", "ROLE_EMPLOYEE"]`. | ✅ ĐẠT |
| **Tiêu chí 3** | Người dùng thao tác được 4 nút Bếp bình thường, đồng thời có thể Chấm công GPS và Làm bài thi mà không bị lỗi 403 Forbidden. | Kiểm thử thực tế bằng token của `bep_thainguyen`: Bấm `+1` ra line (HTTP 200), Chấm công GPS (HTTP 200), Lấy đề thi quý (HTTP 200). Không có lỗi 403. | ✅ ĐẠT |
| **Tiêu chí 4** | Kế toán tổng có thể gán thêm vai trò cho nhân viên thông qua API/Giao diện quản trị. | Đăng nhập `ketoan_tong`, gọi `POST /api/v1/admin/users/5/roles` gán `ROLE_RESTAURANT_MANAGER` cho nhân viên Quế Võ (HTTP 200); kiểm tra `audit_logs` có bản ghi kiểm toán; thử gọi bằng tài khoản bếp bị chặn 403. | ✅ ĐẠT |

---

## 5. Kết Quả Build & Kiểm Thử Tự Động

- **Backend Unit Tests**: **35/35 tests passed (100%)** trên `mvn test` (bao gồm 5 unit tests mới trong `MultiRoleRbacTest`).
- **Frontend Production Build**: `tsc && vite build` hoàn thành trong **1.82 giây**, 0 lỗi TypeScript, 0 lỗi lint.
- **Docker Compose Containers**: Toàn bộ containers (`senviet-postgres`, `senviet-backend`, `senviet-frontend`) vận hành ổn định.
- **Git Security Audit**: Tuân thủ quy chuẩn bí mật kinh doanh, không có thông tin nội bộ rò rỉ.
