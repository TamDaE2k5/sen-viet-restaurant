# Nhật Ký Phát Triển: Khởi Tạo Dự Án & Thiết Lập Hệ Thống Quản Lý Task
- **Thời gian**: 2026-11-17 22:05 (UTC+7)
- **Người thực hiện**: Antigravity Assistant & Technical Lead
- **Mã Task liên quan**: Chuẩn bị nền tảng (Pre-Phase 1)
- **Trạng thái**: ✅ Hoàn thành

---

### 1. Mục Tiêu Công Việc
1. Tiếp nhận và bóc tách toàn bộ tài liệu đặc tả nghiệp vụ dự án quản trị kho bếp, chống thất thoát và nhân sự cho chuỗi Sen Việt Buffet (02 chi nhánh Thái Nguyên & Quế Võ).
2. Xây dựng tài liệu câu hỏi làm rõ nghiệp vụ cho Chủ đầu tư (`QUESTIONS_FOR_CLIENT.md`).
3. Lập kế hoạch triển khai chi tiết cho bản Demo (`implement_demo_plan.md`) theo kiến trúc độc lập: **Spring Boot 3.x (Java 17) + React 18 (Vite, Tailwind, Shadcn) + PostgreSQL 16 + Docker Compose**.
4. Lưu trữ tài liệu phản biện và nâng cấp kiến trúc (`phan_bien_va_gop_y_plan.md`) để người dùng xem xét sau bản demo.
5. Thiết lập quy chuẩn bảo mật doanh nghiệp nghiêm ngặt (`.gitignore`, `AGENTS.md`).
6. Khởi tạo 2 thư mục trung tâm: `task/` và `worklog/` bám sát theo kế hoạch phát triển bản Demo để sẵn sàng tiến hành coding tối nay.

---

### 2. Các Công Việc Đã Thực Hiện

#### 2.1. Phân tích nghiệp vụ & Soạn thảo tài liệu
- Đọc và trích xuất 391 dòng nội dung từ file docx đặc tả: `Bản sao của Đặc tả dự án – Kho bếp, Nhân sự, Task Tracker Pro (gửi chị Thêm, đầy đủ).docx`.
- Nghiên cứu 2 file báo giá gốc: `BaoGia_ChiVuThem_KiemSoatKho_ChongThatThoat.pdf` và `BaoGia_ChiVuThem_NhanSu_DanhGia_NghiViec.pdf`.
- Soạn thảo [QUESTIONS_FOR_CLIENT.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/QUESTIONS_FOR_CLIENT.md): 6 câu hỏi nghiệp vụ quan trọng + 8 danh mục master data cần chuẩn bị.
- Soạn thảo [implement_demo_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md): Kế hoạch 6 giai đoạn phát triển bản demo với sơ đồ kiến trúc, ERD, API catalog và kế hoạch kiểm thử.
- Soạn thảo [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md): Bản phân tích 14 điểm nâng cấp chuyên sâu để tham khảo cho các giai đoạn tiếp theo.

#### 2.2. Thiết lập Bảo mật Bí mật Doanh nghiệp (Enterprise Git Security)
- Cập nhật [.gitignore](file:///run/media/tamdae/Data/Source%20code/restaurant_project/.gitignore): Chặn commit toàn bộ file văn phòng (`*.pdf`, `*.docx`, `*.xlsx`), các file tài liệu khảo sát, báo giá, thông tin nhân sự và file cấu hình môi trường `.env`.
- Cập nhật [AGENTS.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/AGENTS.md): Thiết lập 5 nguyên tắc cốt lõi, ma trận phân quyền 5 vai trò, các quy tắc nghiệp vụ "bất khả xâm phạm" và sổ tay kỹ năng agent.

#### 2.3. Khởi tạo Thư mục `task/` (Master & 6 Phase Tracking)
- [task/README.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/README.md): Bảng điều phối tổng thể 6 giai đoạn, quy ước cập nhật trạng thái `[ ]` $\rightarrow$ `[-]` $\rightarrow$ `[x]`.
- [task/phase-1-infrastructure.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-1-infrastructure.md): 6 tasks khởi tạo Docker, Spring Boot 3, PostgreSQL, Flyway, JWT Auth RBAC 5 roles, React App Shell.
- [task/phase-2-kitchen-module.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-2-kitchen-module.md): 6 tasks phân hệ Bếp di động 4 nút, cảnh báo mẻ 2, cân hao hụt, ra line chống double-click, nén ảnh báo hỏng.
- [task/phase-3-anti-loss-reconcile.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-3-anti-loss-reconcile.md): 6 tasks đọc file Excel CukCuk POS, động cơ tính 6 công thức đối soát, bảng cuối ngày tô đỏ thất thoát, báo cáo NCC.
- [task/phase-4-hr-attendance.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-4-hr-attendance.md): 6 tasks chấm công selfie + GPS Geofencing, thi quý online giờ máy chủ, cảnh báo bỏ việc cron job, thu hồi đồng phục.
- [task/phase-5-payroll-advance.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-5-payroll-advance.md): 6 tasks ứng lương và duyệt thực chi, tự động tăng lương thi đỗ, tổng hợp bảng lương tự động, xuất file chuyển khoản.
- [task/phase-6-testing-deployment.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-6-testing-deployment.md): 6 tasks seed dữ liệu mẫu 2 chi nhánh, unit tests công thức nhạy cảm, Dockerfile multi-stage, kiểm thử E2E 10 tiêu chí hợp đồng.

#### 2.4. Khởi tạo Thư mục `worklog/`
- [worklog/README.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/worklog/README.md): Quy chuẩn viết log, định dạng chuẩn và bảng mục lục nhật ký.
- [worklog/2026-11-17_init_setup.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/worklog/2026-11-17_init_setup.md): Bản ghi đầu tiên lưu lại toàn bộ các bước thiết lập dự án.

---

### 3. Vấn đề Phát sinh & Cách Giải Quyết
- **Vấn đề môi trường**: Máy host Linux chưa cài sẵn `mvn` hoặc `node` trong PATH toàn cục.
- **Giải pháp**: Đã thống nhất áp dụng triệt để giải pháp **Docker Multi-Stage Builds** (`maven:3.9-eclipse-temurin-17-alpine` và `node:20-alpine`) cùng Docker Compose. Mọi hoạt động build, run và test sẽ thực hiện đóng gói trong container, loại bỏ hoàn toàn sự phụ thuộc vào các công cụ cài đặt trên máy host.

---

### 4. Kết Quả Kiểm Thử & Nghiệm Thu
- Cấu trúc thư mục `task/` và `worklog/` được tạo đầy đủ, rõ ràng, phân cấp mạch lạc.
- Các liên kết file markdown hoạt động chuẩn xác với scheme `file://`.
- Kiểm tra `git status` đảm bảo không có file tài liệu nội bộ nhạy cảm nào bị đưa vào trạng thái untracked/staged trái phép.

---

### 5. Bước Tiếp Theo (Next Steps)
- Bắt đầu triển khai **Giai đoạn 1 (Phase 1: Infrastructure & Docker)** theo [task/phase-1-infrastructure.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/task/phase-1-infrastructure.md):
  1. Tạo file `docker-compose.yml` và `.env.example`.
  2. Tạo khung dự án Backend Spring Boot 3.x (`backend/pom.xml`, `mvnw`, cấu trúc package `com.senviet`).
  3. Tạo khung dự án Frontend React Vite (`frontend/package.json`, Tailwind config, layout).
