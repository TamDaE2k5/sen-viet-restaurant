# Giai Đoạn 4: Chấm Công GPS, Bài Thi Định Kỳ & Quản Lý Nhân Sự
> **Mã giai đoạn**: `P4-HR`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#43-phần-ii--nhân-sự--tiền-lương](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Xây dựng quy trình nhân sự khép kín: Chấm công selfie + định vị GPS Geofencing, kỳ thi định kỳ quý chống gian lận thời gian, tự động cảnh báo nhân viên bỏ việc, và quản lý cấp phát - thu hồi đồng phục khi nghỉ việc.

---

## Danh Sách Công Việc (Tasks)

- [ ] **Task 4.1: Database Schema Migration cho Nhân Sự & Chấm Công (V4)**
  - **Mô tả**: Viết script migration `V4__hr_and_attendance_schema.sql` tạo các bảng:
    - `attendances` (Check-in/out: ảnh selfie, kinh/vĩ độ, cờ `is_valid_location`, phút muộn/về sớm, công tính được)
    - `exam_questions` (Ngân hàng câu hỏi trắc nghiệm theo vị trí: Bếp, Phục vụ, Thu ngân...)
    - `exam_submissions` (Bài làm: thời gian nộp theo máy chủ, điểm trắc nghiệm, điểm thực hành)
    - `uniform_items` & `uniform_allocations` (Danh mục đồng phục cấp phát cho nhân viên)
    - `resignation_requests` (Đơn xin nghỉ việc, trạng thái duyệt và xác nhận thu hồi đồng phục)
  - **Tiêu chí nghiệm thu**: Tạo bảng thành công trên PostgreSQL, có index `user_id`, `check_in_time`.
  - **Độ ưu tiên**: P0

- [ ] **Task 4.2: Backend API Chấm Công Selfie Camera & Định Vị GPS (Geofencing)**
  - **Mô tả**: Xây dựng endpoints `POST /api/v1/hr/attendance/check-in` và `POST /api/v1/hr/attendance/check-out`:
    - Tiếp nhận ảnh selfie chụp trực tiếp từ camera và tọa độ `(lat, lng)`.
    - Tính khoảng cách Haversine giữa tọa độ nhân viên và chi nhánh: Nếu khoảng cách $> 100\text{m}$ $\rightarrow$ Ghi nhận bản ghi kèm cờ cảnh báo `is_valid_location = false`.
    - Lấy thời gian chính xác theo đồng hồ máy chủ (Server Time), tự động tính số phút đi muộn / về sớm.
  - **Tiêu chí nghiệm thu**: Xử lý tính toán công chuẩn xác, kiểm soát vị trí chặt chẽ.
  - **Độ ưu tiên**: P0

- [ ] **Task 4.3: Phân Hệ Thi Đánh Giá Định Kỳ Trực Tuyến (Quý)**
  - **Mô tả**: Xây dựng các endpoints:
    - `GET /api/v1/hr/exams/active`: Trả về đề thi theo vị trí làm việc, đảo ngẫu nhiên thứ tự câu hỏi.
    - `POST /api/v1/hr/exams/{id}/submit`: Tiếp nhận bài làm trắc nghiệm, kiểm tra thời gian làm bài theo giờ server (chống can thiệp đồng hồ điện thoại), tự động chấm điểm thang 100.
    - `PUT /api/v1/hr/exams/submissions/{id}/grade-practical`: Quản lý nhà hàng chấm điểm phần thực hành.
  - **Tiêu chí nghiệm thu**: Điểm thi được lưu trữ chuẩn xác vào hồ sơ nhân sự để phục vụ xét tăng lương.
  - **Độ ưu tiên**: P1

- [ ] **Task 4.4: Tự Động Quét Cảnh Báo Bỏ Việc (Cron Job)**
  - **Mô tả**: Thiết lập Spring Scheduled Task chạy hàng ngày lúc 23:00:
    - Quét nhân viên không chấm công và không có đơn xin nghỉ phép liên tiếp 3 ngày $\rightarrow$ Sinh cảnh báo `Gợi ý: Có thể bỏ việc`.
    - Endpoint cho Quản lý nhà hàng xác nhận hoặc hủy bỏ trạng thái bỏ việc.
    - Khi xác nhận bỏ việc: Tháng đó ghi nhận Lương = 0, ghi chú rõ *"Bỏ việc — không trả theo quy định"*, loại khỏi chi phí vận hành.
  - **Tiêu chí nghiệm thu**: Cron job quét chính xác, trạng thái bỏ việc được xử lý triệt để.
  - **Độ ưu tiên**: P1

- [ ] **Task 4.5: Quy Trình Nghỉ Việc & Ràng Buộc Bàn Giao Đồng Phục**
  - **Mô tả**: Xây dựng quy trình bàn giao đồng phục:
    - Quản lý mở danh sách đồng phục đã cấp cho nhân viên xin nghỉ, tick chọn từng món thực tế nhận lại.
    - Nếu thiếu dù chỉ 1 món $\rightarrow$ Chuyển trạng thái sang `ĐANG_GIỮ_LƯƠNG (Thiếu: Áo, nón...)` và tự động loại khỏi danh sách thanh toán ngân hàng.
    - Khi nhận đủ $\rightarrow$ Gỡ trạng thái giữ lương, thông báo cho Kế toán.
  - **Tiêu chí nghiệm thu**: Bảng lương tự động phản ánh trạng thái giữ lương khi chưa hoàn tất bàn giao.
  - **Độ ưu tiên**: P0

- [ ] **Task 4.6: Frontend Mobile Nhân Viên & Quản Lý Nhân Sự**
  - **Mô tả**: Phát triển giao diện người dùng:
    - Màn hình Chấm công Mobile: Bật camera trước chụp selfie, lấy tọa độ GPS của thiết bị, hiển thị trạng thái hợp lệ/cảnh báo khoảng cách.
    - Màn hình Làm bài thi trực tuyến: Giao diện trắc nghiệm trực quan kèm đồng hồ đếm ngược.
    - Màn hình Quản lý duyệt nghỉ việc & Checklist nhận lại đồng phục.
  - **Tiêu chí nghiệm thu**: Thao tác chấm công hoàn tất trong $< 5$ giây trên trình duyệt di động.
  - **Độ ưu tiên**: P0
