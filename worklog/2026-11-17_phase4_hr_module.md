# Nhật Ký Công Việc: Giai Đoạn 4 — Chấm Công GPS Geofencing, Kỳ Thi Định Kỳ & Quản Lý Bàn Giao Đồng Phục
**Ngày thực hiện**: 17/11/2026  
**Phân hệ**: `P4-HR` (Quản trị Nhân sự & Chấm công)  
**Tác giả**: `builder` (Antigravity Swarm)  
**Nhánh Git**: `dev`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc
Xây dựng quy trình quản trị nhân sự và chống thất thoát tiền lương toàn diện cho chuỗi nhà hàng Sen Việt Buffet:
1. **Chấm công Mobile Camera Selfie & Định vị GPS Geofencing**:
   - Sử dụng công thức Haversine tính khoảng cách từ tọa độ thiết bị đến chi nhánh.
   - Bán kính chuẩn Geofencing $\le 100\text{m}$. Nếu vượt quá, đánh dấu cờ `is_valid_location = false` và trạng thái `VI_PHAM_KHOANG_CACH`.
   - Tính toán giờ công thực tế và thời gian đi muộn/về sớm dựa trên giờ chuẩn máy chủ (Server Time).
2. **Kỳ thi sát hạch nghiệp vụ định kỳ (Quý)**:
   - Ngân hàng câu hỏi trắc nghiệm chia theo khối Bếp / Phục vụ, tự động đảo câu hỏi.
   - Chấm điểm lý thuyết tự động thang 100 ngay khi nộp bài.
   - Quản lý nhà hàng chấm điểm phần thực hành.
   - Công thức xếp loại tổng hợp: $\text{Tổng điểm} = 40\% \text{Lý thuyết} + 60\% \text{Thực hành}$. Điểm sàn đạt chuẩn: $\ge 70/100$.
3. **Tự động quét nguy cơ bỏ việc**:
   - Quét nhân viên không chấm công 3 ngày liên tiếp $\rightarrow$ Cảnh báo `Gợi ý: Có thể bỏ việc`.
   - Quản lý xác nhận bỏ việc $\rightarrow$ Khóa tài khoản, tự động thiết lập Lương = 0 đ, ghi chú *"Bỏ việc — không trả theo quy định"*.
4. **Quy trình nghỉ việc & Ràng buộc thu hồi đồng phục giữ lương**:
   - Nhân viên nộp đơn xin nghỉ việc.
   - Quản lý kiểm đếm danh sách đồng phục đã cấp (áo thun, tạp dề, mũ...).
   - Nếu thiếu dù chỉ 01 món $\rightarrow$ Trạng thái `DANG_GIU_LUONG` (ghi rõ tên món thiếu), khóa giải ngân lương.
   - Khi nhận đủ 100% $\rightarrow$ Chuyển `HOAN_TAT`, mở khóa thanh toán lương.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Database Schema & Flyway Migration (V5)
- File: `backend/src/main/resources/db/migration/V5__hr_and_attendance_schema.sql`
- Các bảng mới:
  - `attendances`: Chấm công GPS selfie, cờ `is_valid_location`, khoảng cách Haversine.
  - `exam_questions`: Ngân hàng câu hỏi trắc nghiệm nghiệp vụ.
  - `exam_submissions`: Bài thi của nhân viên, điểm lý thuyết, thực hành, tổng điểm.
  - `uniform_items`: Danh mục đồng phục và giá trị cọc.
  - `uniform_allocations`: Bản ghi cấp phát đồng phục cho nhân sự.
  - `resignation_requests`: Đơn nghỉ việc, trạng thái duyệt và giữ lương.
- Seed dữ liệu: 4 câu hỏi trắc nghiệm mẫu (Bếp & Phục vụ), 4 loại đồng phục mẫu, cấp phát đồng phục mẫu cho nhân viên demo.

### 2.2. Backend Services & Controllers (Spring Boot 3.2.5)
- **Entities & Repositories**:
  - `Attendance`, `ExamQuestion`, `ExamSubmission`, `UniformItem`, `UniformAllocation`, `ResignationRequest`
  - `AttendanceRepository`, `ExamQuestionRepository`, `ExamSubmissionRepository`, `UniformItemRepository`, `UniformAllocationRepository`, `ResignationRequestRepository`
- **DTOs**:
  - `CheckInRequest`, `CheckOutRequest`, `AttendanceResponse`
  - `ExamQuestionDto`, `ExamSubmitRequest`, `ExamSubmissionDto`, `GradePracticalRequest`
  - `UniformAllocationDto`, `UniformReturnRequest`, `AbandonmentScanResult`
- **Services**:
  - `AttendanceService`: Tính khoảng cách Haversine, check-in, check-out, quét bỏ việc 3 ngày, xác nhận bỏ việc lương = 0.
  - `ExamService`: Đảo câu hỏi, nộp bài tự động chấm lý thuyết, chấm thực hành $40\% + 60\%$.
  - `UniformAndResignationService`: Cấp phát, kiểm đếm checklist thu hồi, khóa lương `DANG_GIU_LUONG` hoặc mở khóa `HOAN_TAT`.
- **Controller**:
  - `HrAttendanceController` (`/api/v1/hr/*`) với đầy đủ phân quyền RBAC và OpenAPI Swagger annotations.
- **Unit Test**:
  - `AttendanceServiceTest`: Kiểm thử tính toán Geofencing Haversine (tọa độ trùng khớp, trong bán kính $\le 100\text{m}$, ngoài bán kính $\sim 500\text{m}$, xử lý null). Tất cả 11 tests backend chạy thành công 100%.

### 2.3. Frontend (React 18, TypeScript, Tailwind CSS)
- **API Client**: `frontend/src/api/hr.ts` kết nối toàn bộ endpoints backend.
- **UI Module**: `frontend/src/components/hr/HRModule.tsx`
  - **Tab 1: Chấm công GPS Selfie**:
    - Hiển thị badge khoảng cách Geofencing real-time (Xanh lá nếu $\le 100\text{m}$, Đỏ cảnh báo nếu $> 100\text{m}$).
    - Hỗ trợ GPS thực từ thiết bị di động + 2 nút preset Demo (Tại nhà hàng 0m & Cách 500m vi phạm).
    - Camera selfie view (HTML5 video stream / canvas simulated fallback).
    - 2 nút bấm thao tác lớn: `CHECK-IN` (Xanh lá) & `CHECK-OUT` (Xanh dương) chiều cao $> 52\text{px}$.
    - Bảng lịch sử chấm công trong ngày.
  - **Tab 2: Kỳ thi định kỳ quý**:
    - Lựa chọn khối vị trí (Bếp / Phục vụ).
    - Đồng hồ đếm ngược 15:00.
    - Danh sách câu hỏi trắc nghiệm A, B, C, D.
    - Nộp bài & xem điểm lý thuyết ngay lập tức.
    - Giao diện Quản lý: Chấm điểm thực hành (tính tổng $40\% + 60\%$, xét Đạt $\ge 70$).
  - **Tab 3: Đồng phục & Nghỉ việc**:
    - Danh sách đồng phục cá nhân đang giữ.
    - Form nộp đơn xin nghỉ việc.
    - Quản lý: Nút quét nhân viên vắng mặt 3 ngày & nút xác nhận bỏ việc Lương = 0.
    - Quản lý: Modal kiểm đếm checklist thu hồi đồng phục từng món. Tự động chuyển `DANG_GIU_LUONG` khi còn thiếu món nào và `HOAN_TAT` khi đủ 100%.

---

## 3. Kết Quả Kiểm Thử (Verification)
1. **Unit Test Backend**:
   - `mvn test`: 11/11 tests pass (AttendanceServiceTest, KitchenServiceTest, ReconciliationCalculationServiceTest, RestaurantApplicationTests).
2. **Build Docker Containers**:
   - Backend Spring Boot: Image built & healthy on port 8080.
   - Flyway: Version `v5` applied successfully.
   - Frontend Vite: Built in 1.69s, bundle gzip 95.88 kB, Nginx container healthy on port 80.
3. **API Integration Test**:
   - `POST /api/v1/hr/attendance/check-in`: 200 OK (0.00m, isValidLocation = true).
   - `POST /api/v1/hr/attendance/check-out`: 200 OK (actualHours calculated).
   - `POST /api/v1/hr/exams/submit`: 200 OK (theoryScore = 75.00, isPassed = true).
   - `POST /api/v1/hr/resignations/submit`: 200 OK.
   - `GET /api/v1/hr/resignations`: 200 OK (isolated by branch, ketoan_tong sees all).

---

## 4. Kế Hoạch Tiếp Theo
- Bàn giao kết quả Phase 4 cho `@verifier` nghiệm thu.
- Chuẩn bị bước vào **Phase 5: Ứng Lương & Bảng Lương Tự Động** (`phase-5-payroll-advance.md`).
