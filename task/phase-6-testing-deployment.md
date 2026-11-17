# Giai Đoạn 6: Bộ Dữ Liệu Mẫu, Kiểm Thử E2E & Đóng Gói Docker
> **Mã giai đoạn**: `P6-DEPLOY`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#7-kế-hoạch-kiểm-thử--nghiệm-thu-verification-plan](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Chuẩn bị đầy đủ bộ dữ liệu mẫu (Seeder) cho 2 chi nhánh, viết Unit Test bao phủ 100% công thức tài chính/kho nhạy cảm, tối ưu Dockerfile đa tầng và thực hiện kiểm thử E2E theo danh mục nghiệm thu hợp đồng.

---

## Danh Sách Công Việc (Tasks)

- [ ] **Task 6.1: Bộ Dữ Liệu Mẫu Toàn Diện (Database Seeders)**
  - **Mô tả**: Viết script nạp dữ liệu khởi tạo `DataSeeder`:
    - 2 chi nhánh: Thái Nguyên & Quế Võ (có tọa độ GPS chuẩn để test geofencing).
    - 5 tài khoản mẫu cho 5 vai trò.
    - Danh mục món ăn thực tế: Cua Cà Mau (chuẩn hụt 20%), Kim chi (chuẩn hụt 5%), Bò cuộn nấm (chuẩn hụt 10%)...
    - Ngân hàng câu hỏi thi trắc nghiệm (Bếp, Phục vụ, Thu ngân).
    - Dữ liệu lịch sử mẫu: 1 đợt bán hàng CukCuk, một số mẻ chế biến, một số bản ghi chấm công.
  - **Tiêu chí nghiệm thu**: Hệ thống khởi động lần đầu là có ngay dữ liệu sống động để người dùng trải nghiệm demo.
  - **Độ ưu tiên**: P0

- [ ] **Task 6.2: Bộ Unit Test & Integration Test Cho Công Thức Nhạy Cảm**
  - **Mô tả**: Viết kiểm thử tự động (JUnit 5 + AssertJ + Mockito):
    - `ProcessingServiceTest`: Công thức hao hụt cua hấp, kích hoạt cảnh báo mẻ thứ hai và cờ vượt chuẩn `isOverStandard`.
    - `ReconciliationServiceTest`: Công thức 6 chỉ số đối soát, kích hoạt cảnh báo thất thoát đỏ ($> 5\%$ hoặc $> 300.000\text{ VNĐ}$).
    - `PayrollServiceTest`: Khấu trừ tạm ứng, tính lương bỏ việc = 0, khóa trạng thái giữ lương khi thiếu đồng phục.
  - **Tiêu chí nghiệm thu**: `mvn test` đạt 100% pass, không có flaky test.
  - **Độ ưu tiên**: P0

- [ ] **Task 6.3: Tối Ưu Hóa Multi-Stage Dockerfile (Backend & Frontend)**
  - **Mô tả**:
    - Backend: Dùng `maven:3.9-eclipse-temurin-17-alpine` để build, `eclipse-temurin:17-jre-alpine` để chạy, phân quyền user không phải root (`appuser`).
    - Frontend: Dùng `node:20-alpine` để build `dist/`, `nginx:alpine` để phân phối static files và làm Reverse Proxy chuyển tiếp request `/api/*`.
  - **Tiêu chí nghiệm thu**: Kích thước Docker image tối ưu nhỏ gọn, bảo mật cao.
  - **Độ ưu tiên**: P0

- [ ] **Task 6.4: Cấu Hình Docker Compose 1-Click & Healthcheck**
  - **Mô tả**: Hoàn thiện `docker-compose.yml`:
    - Tích hợp healthcheck cho PostgreSQL và Backend Actuator `/actuator/health`.
    - Cấu hình mạng nội bộ `app-network` và volume `postgres_data`.
  - **Tiêu chí nghiệm thu**: Chạy lệnh `docker compose up -d --build` là toàn bộ hệ thống sẵn sàng hoạt động trong 1 bước.
  - **Độ ưu tiên**: P0

- [ ] **Task 6.5: Kiểm Thử Toàn Trình (E2E Walkthrough Verification)**
  - **Mô tả**: Kiểm tra thực tế lần lượt theo 10 tiêu chí nghiệm thu hợp đồng:
    1. Bếp thao tác 4 nút trên điện thoại mượt mà.
    2. Cân mẻ hụt vượt chuẩn báo đỏ trực quan.
    3. Mở mẻ thứ hai hiển thị cảnh báo đỏ ngăn chặn mở mẻ lén lút.
    4. Nạp file Excel CukCuk đối soát tự động tô đỏ dòng thất thoát.
    5. Chấm công selfie + GPS kiểm soát cự ly chi nhánh.
    6. Làm bài thi trắc nghiệm đếm ngược giờ server, tự tính điểm.
    7. Ứng lương và duyệt thực chi trừ đúng vào bảng lương tháng.
    8. Nghỉ việc thiếu đồng phục tự động chuyển sang trạng thái giữ lương.
    9. Bỏ việc 3 ngày tự động đưa lương về 0.
    10. Báo cáo tỷ lệ hỏng theo NCC xếp hạng chính xác.
  - **Tiêu chí nghiệm thu**: Hoàn thành 10/10 tiêu chí nghiệm thu không phát sinh lỗi.
  - **Độ ưu tiên**: P0

- [ ] **Task 6.6: Hướng Dẫn Vận Hành & Bàn Giao Bản Demo**
  - **Mô tả**: Soạn file `README.md` hướng dẫn chạy demo, danh sách tài khoản/mật khẩu 5 vai trò để khách hàng và ban lãnh đạo trải nghiệm thử.
  - **Tiêu chí nghiệm thu**: Người dùng đọc hướng dẫn là có thể tự đăng nhập và thao tác được ngay.
  - **Độ ưu tiên**: P1
