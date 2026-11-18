# BẢNG ĐIỀU PHỐI CÔNG VIỆC DỰ ÁN (MASTER TASK TRACKER)
## Dự án: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)

> **Căn cứ kế hoạch**:
> - [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md) (Bản Demo 6 Phase - Đã hoàn thành)
> - [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md) (14 Điểm phản biện & hoàn thiện bản Production)
>
> **Kiến trúc cốt lõi**: Java 17 LTS / Spring Boot 3.x + React 18 / TypeScript / Tailwind CSS / Shadcn UI + PostgreSQL 16 + Docker Compose  
> **Chi nhánh mục tiêu**: 02 chi nhánh (Thái Nguyên & Quế Võ)

---

## 1. Tiến Độ Tổng Quan Các Giai Đoạn (Master Phase Overview)

### A. Giai Đoạn Demo Nhanh (Tonight Demo - Đã hoàn thành 100%)

| Giai đoạn | Tên phân hệ / Giai đoạn | File chi tiết | Số task | Trạng thái | Tiến độ |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **P1** | [Khởi tạo Kiến trúc & Hạ tầng Docker](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-1-infrastructure.md) | `phase-1-infrastructure.md` | 6 | ✅ Hoàn thành | 100% |
| **P2** | [Phân hệ Bếp 4 Nút & Chế Biến Mẻ](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-2-kitchen-module.md) | `phase-2-kitchen-module.md` | 6 | ✅ Hoàn thành | 100% |
| **P3** | [Động cơ Chống Thất Thoát & Bảng Cuối Ngày](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-3-anti-loss-reconcile.md) | `phase-3-anti-loss-reconcile.md` | 6 | ✅ Hoàn thành | 100% |
| **P4** | [Chấm Công GPS & Quy Trình Nhân Sự](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-4-hr-attendance.md) | `phase-4-hr-attendance.md` | 6 | ✅ Hoàn thành | 100% |
| **P5** | [Ứng Lương & Bảng Lương Tự Động](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-5-payroll-advance.md) | `phase-5-payroll-advance.md` | 6 | ✅ Hoàn thành | 100% |
| **P6** | [Kiểm Thử E2E, Seed Data & Đóng Gói Demo](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-6-testing-deployment.md) | `phase-6-testing-deployment.md` | 6 | ✅ Hoàn thành | 100% |

---

### B. Giai Đoạn Hoàn Thiện Bản Production (Theo 14 Điểm Phản Biện & Góp Ý)

| Giai đoạn | Tên phân hệ / Giai đoạn | Điểm phản biện xử lý | File chi tiết | Số task | Trạng thái |
| :---: | :--- | :--- | :--- | :---: | :---: |
| **P7** | [Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-7-warehouse-lots-suppliers.md) | #1, #2, #12 (Phiếu nhập/xuất, lô, NCC, tồn kho, kiểm kê) | `phase-7-warehouse-lots-suppliers.md` | 6 | ✅ Hoàn thành |
| **P8** | [Quy Tắc Chặt Chẽ Bếp & Ra Line](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-8-kitchen-hard-rules.md) | #3, #4, #8, #9, #12 (Chặn mẻ hỏng, món dùng trong ngày, quick add ra line) | `phase-8-kitchen-hard-rules.md` | 6 | ✅ Hoàn thành |
| **P9** | [Phân Quyền Đa Vai Trò (Multi-Role RBAC)](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-9-multi-role-rbac.md) | #6 (1 nhân sự nhiều vai trò, switcher ngữ cảnh) | `phase-9-multi-role-rbac.md` | 5 | ✅ Hoàn thành |
| **P10** | [Nghiệp Vụ Nhân Sự & Khóa Bảng Lương](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-10-hr-payroll-locks.md) | #5, #7, #10, #11 (Khóa bảng lương, lương bỏ việc = 0, hủy bỏ việc nhầm) | `phase-10-hr-payroll-locks.md` | 6 | ✅ Hoàn thành |
| **P11** | [Chịu Lỗi Mất Mạng & Quyền Thiết Bị](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-11-offline-resilience-ux.md) | #13, #14 (Lưu form offline, banner mạng, modal cấp quyền Camera/GPS) | `phase-11-offline-resilience-ux.md` | 4 | ✅ Hoàn thành |

---

## 2. Ma Trận Đối Chiếu 14 Điểm Phản Biện Đến Từng Phase

| # | Mức độ | Điểm phản biện từ `phan_bien_va_gop_y_plan.md` | Phase xử lý | Hành động kỹ thuật chính |
| :---: | :---: | :--- | :---: | :--- |
| **1** | 🔴 Nghiêm trọng | Thiếu hệ thống Phiếu nhập/xuất/huỷ, Lô & Hạn dùng (GĐ 1) | **Phase 7** | Tạo bảng `warehouse_documents`, `import_batches`, quản lý tồn theo lô |
| **2** | 🔴 Nghiêm trọng | ERD thiếu `SUPPLIER`, `IMPORT_BATCH`, `INVENTORY_STOCK`, `RECIPE` | **Phase 7** | Migration `V7__warehouse_lots_and_suppliers.sql` bổ sung đầy đủ thực thể |
| **3** | 🔴 Nghiêm trọng | Thiếu rule chặn cứng: Mẻ hỏng chưa duyệt $\rightarrow$ không cho làm mẻ mới | **Phase 8** | Chặn HTTP 422 nếu mẻ trước của cùng món chưa được Quản lý duyệt báo hỏng |
| **4** | 🔴 Nghiêm trọng | Thiếu tính năng "Món chỉ dùng trong ngày" xử lý cuối ca | **Phase 8** | Giao diện chốt ca quét món tươi tồn, nhân viên xác nhận ghi bỏ tách khỏi hàng hỏng |
| **5** | 🟠 Cần chỉnh | Bảng `PAYROLL` thiếu `branch_id`, `excluded_from_cost`, chi tiết lý do giữ lương | **Phase 10** | Migration `V10`, tách dòng lương bỏ việc khỏi chi phí lãi lỗ, lưu lý do giữ chi tiết |
| **6** | 🟠 Cần chỉnh | Người dùng giữ nhiều vai trò đồng thời | **Phase 9** | Migration `V9__multi_role_user_schema.sql`, bảng `user_roles`, JWT multi-role |
| **7** | 🟠 Cần chỉnh | Thiếu cơ chế chốt/khóa bảng lương (`Payroll Lock`) | **Phase 10** | API Khóa bảng lương; khi đã khóa thì chặn sửa/hủy đơn ứng lương |
| **8** | 🟠 Cần chỉnh | Khẳng định rõ nguyên tắc: Nút Ra line không trừ tồn kho | **Phase 8** | Kiểm toán code `LineItemLogService` đảm bảo chỉ lưu nhật ký, không trừ kho |
| **9** | 🟡 Bổ sung | Thêm món mới trực tiếp trên màn hình Ra line | **Phase 8** | Nút `[+ Thêm món]` mở modal Quick Add trực tiếp trên sổ Ra line |
| **10** | 🟡 Bổ sung | Quyền Kế toán tổng hủy xác nhận bỏ việc nhầm | **Phase 10** | API `/api/v1/hr/abandoned/{id}/cancel` dành riêng cho General Accountant |
| **11** | 🟡 Bổ sung | Nhân viên bỏ việc: Lương = 0 cho cả tháng có ngày xác nhận | **Phase 10** | Cập nhật logic tính lương: Công vẫn hiện, lương = 0, ghi chú quy định |
| **12** | 🟡 Bổ sung | Hao hụt chế biến ghi riêng, không cộng vào tỷ lệ con hàng | **Phase 7 & 8** | Tách riêng cột Hụt chế biến và Báo cáo % hỏng theo nhà cung cấp |
| **13** | 🟡 Bổ sung | Giữ dữ liệu trên màn hình khi mất mạng (Offline Resilience) | **Phase 11** | Custom hook lưu tạm form vào storage, banner offline, không reset form khi lỗi |
| **14** | 🟡 Bổ sung | Hướng dẫn mở lại quyền khi nhân viên lỡ từ chối Camera/GPS | **Phase 11** | Modal hướng dẫn 3 bước trực quan cho iOS Safari và Android Chrome |

---

## 3. Quy Trình Cập Nhật & Thực Thi (Execution Protocol)

1. **Phân nhánh Git**:
   - Nhánh chính: `dev`
   - Nhánh tính năng:
     - `feature/p7-warehouse-lots-suppliers`
     - `feature/p8-kitchen-hard-rules`
     - `feature/p9-multi-role-rbac`
     - `feature/p10-hr-payroll-locks`
     - `feature/p11-offline-resilience-ux`
2. **Quy chuẩn mã nguồn**: Tuân thủ tuyệt đối [AGENTS.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/AGENTS.md).
3. **Bảo mật dữ liệu**: Không commit file nội bộ, tài liệu doanh nghiệp hoặc credentials lên Git.
