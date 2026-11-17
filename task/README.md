# BẢNG ĐIỀU PHỐI CÔNG VIỆC DỰ ÁN (MASTER TASK TRACKER)
## Dự án: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)

> **Căn cứ kế hoạch**: [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Phiên bản thực hiện**: Bản Demo Nhanh (Tonight Demo Release)  
> **Kiến trúc cốt lõi**: Java 17 LTS / Spring Boot 3.x + React 18 / TypeScript / Tailwind CSS / Shadcn UI + PostgreSQL 16 + Docker Compose  
> **Chi nhánh mục tiêu**: 02 chi nhánh (Thái Nguyên & Quế Võ)

---

## 1. Tiến Độ Tổng Quan Các Giai Đoạn (Phase Status Overview)

| Giai đoạn | Tên phân hệ / Giai đoạn | File chi tiết | Số task | Trạng thái | Tiến độ |
| :---: | :--- | :--- | :---: | :---: | :---: |
| **P1** | [Khởi tạo Kiến trúc & Hạ tầng Docker](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-1-infrastructure.md) | `phase-1-infrastructure.md` | 6 | ✅ Hoàn thành | 100% |
| **P2** | [Phân hệ Bếp 4 Nút & Chế Biến Mẻ](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-2-kitchen-module.md) | `phase-2-kitchen-module.md` | 6 | ✅ Hoàn thành | 100% |
| **P3** | [Động cơ Chống Thất Thoát & Bảng Cuối Ngày](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-3-anti-loss-reconcile.md) | `phase-3-anti-loss-reconcile.md` | 6 | ✅ Hoàn thành | 100% |
| **P4** | [Chấm Công GPS & Quy Trình Nhân Sự](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-4-hr-attendance.md) | `phase-4-hr-attendance.md` | 6 | ⏳ Sẵn sàng | 0% |
| **P5** | [Ứng Lương & Bảng Lương Tự Động](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-5-payroll-advance.md) | `phase-5-payroll-advance.md` | 6 | ⏳ Chờ P4 | 0% |
| **P6** | [Kiểm Thử E2E, Seed Data & Đóng Gói Demo](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-6-testing-deployment.md) | `phase-6-testing-deployment.md` | 6 | ⏳ Chờ P1-P5 | 0% |

---

## 2. Quy Trình Cập Nhật Task (Workflow Convention)

1. **Trạng thái task**:
   - `[ ]` **TODO (Chưa thực hiện)**: Task đã được phân tích, sẵn sàng khi đến lượt.
   - `[-]` **IN PROGRESS (Đang thực hiện)**: Đang viết code hoặc kiểm thử.
   - `[x]` **DONE (Đã hoàn thành)**: Đã test pass, đúng tiêu chí nghiệm thu và ghi nhận vào `worklog/`.
   - `[!]` **BLOCKED (Bị chặn)**: Gặp vướng mắc nghiệp vụ hoặc lỗi hạ tầng cần xử lý.

2. **Nguyên tắc triển khai Demo tối nay**:
   - Tập trung đi theo đúng luồng lõi của từng tính năng theo [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md).
   - Đảm bảo mỗi giai đoạn đều có thể demo trực quan (UI chạy được, API phản hồi dữ liệu thật hoặc mẫu có cấu trúc chuẩn).
   - Sau khi hoàn thành mỗi task, cập nhật tick `[x]` tại file chi tiết tương ứng và ghi tóm tắt vào thư mục `worklog/`.

---

## 3. Liên Kết Tài Liệu Hướng Dẫn & Kỹ Thuật

- **Quy chuẩn kỹ thuật & Bảo mật Git**: [AGENTS.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/AGENTS.md)
- **Kế hoạch triển khai gốc**: [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)
- **Nhật ký phát triển**: [worklog/README.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/worklog/README.md)
