# Nhật Ký Công Việc: Giai Đoạn 5 — Ứng Lương, Xét Tăng Lương & Bảng Lương Tự Động
**Ngày thực hiện**: 17/11/2026  
**Phân hệ**: `P5-PAYROLL` (Quản trị Tiền lương & Lệnh chi Ngân hàng)  
**Tác giả**: `builder` (Antigravity Swarm)  
**Nhánh Git**: `dev`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc
Tự động hóa toàn bộ quy trình tính toán tiền lương cuối tháng, xử lý ứng lương, xét duyệt tăng lương quý và lệnh chi ngân hàng cho chuỗi nhà hàng Sen Việt Buffet:
1. **Ứng lương & Duyệt chi thực tế (Salary Advances)**:
   - Nhân viên gửi đơn ứng lương (giới hạn tối đa 1 đơn chờ duyệt tại một thời điểm).
   - Kế toán / Quản lý duyệt chi số tiền thực chi ($\le$ số tiền xin ứng) và ấn định tháng khấu trừ (`YYYY-MM`).
   - Tự động trừ số tiền thực chi vào cột tạm ứng của bảng lương tháng tương ứng.
2. **Thuật toán tự động quét xét tăng lương quý (Quarterly Raise Eligibility)**:
   - Quét tự động 3 điều kiện:
     1. Điểm thi định kỳ quý $\ge 80/100$.
     2. Số lần đi muộn / về sớm $\le 3$ lần trong quý.
     3. Nghỉ không phép = 0 ngày.
   - Khi được duyệt: Tự động cộng mức tăng (+500,000 đ) trực tiếp vào `base_salary` của nhân sự.
3. **Động cơ tổng hợp bảng lương tự động (Automated Payroll Engine)**:
   - Công thức: $\text{Thực lĩnh} = (\text{Lương cơ bản} + \text{Tăng lương}) \times \frac{\text{Ngày công}}{26} + \text{Phụ cấp} - \text{Tạm ứng thực chi} - \text{Khấu trừ phạt}$.
   - Ràng buộc tự ý bỏ việc: Lương = 0 đ, ghi chú *"Bỏ việc — không trả theo quy định"*.
   - Ràng buộc đồng phục: Chuyển trạng thái `DANG_GIU_LUONG` nếu chưa hoàn tất 100% bàn giao đồng phục khi nghỉ việc.
4. **Xuất danh sách lệnh chi chuyển khoản ngân hàng (Bank Transfer Export)**:
   - Sinh file Excel định dạng chuẩn ngân hàng: STK, Tên chủ TK, Ngân hàng, Số tiền thực chuyển, Nội dung chuyển khoản.
   - **Bảo mật tài chính tuyệt đối**: Tự động loại trừ toàn bộ nhân sự có trạng thái `BO_VIEC` hoặc `DANG_GIU_LUONG`.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Database Schema & Flyway Migration (V6)
- File: `backend/src/main/resources/db/migration/V6__payroll_and_advances_schema.sql`
- Cập nhật bảng `users`: Thêm `bank_name`, `bank_account_number`, `bank_account_holder`, `base_salary`. Cập nhật STK và lương cơ bản mẫu cho 5 tài khoản demo.
- Bảng mới:
  - `salary_rules`: Cấu hình ngày công chuẩn (26), mức tăng lương thi quý (500k), tỷ lệ ứng tối đa (50%), phạt đi muộn (5k/phút).
  - `salary_advances`: Quản lý đơn ứng lương, số tiền thực chi, tháng khấu trừ, trạng thái duyệt.
  - `salary_increase_proposals`: Đề xuất tăng lương quý theo 3 tiêu chuẩn.
  - `payrolls`: Bảng lương chi tiết theo tháng với unique constraint `(user_id, payroll_month)`.
- Nạp dữ liệu tạm ứng mẫu và đề xuất tăng lương mẫu cho chi nhánh Thái Nguyên & Quế Võ.

### 2.2. Backend Services & Controllers
- **Entities & Repositories**:
  - `SalaryAdvance`, `SalaryRule`, `SalaryIncreaseProposal`, `Payroll`
  - `SalaryAdvanceRepository`, `SalaryRuleRepository`, `SalaryIncreaseProposalRepository`, `PayrollRepository`
- **DTOs**:
  - `SalaryAdvanceRequest`, `DisburseAdvanceRequest`, `SalaryAdvanceResponse`
  - `SalaryIncreaseProposalDto`, `PayrollResponse`
- **Services**:
  - `SalaryAdvanceService`: Gửi đơn xin ứng (chống spam nhiều đơn chờ), duyệt chi giải ngân thực tế.
  - `SalaryIncreaseService`: Thuật toán quét 3 điều kiện, duyệt tăng lương cộng trực tiếp vào lương cơ bản.
  - `PayrollService`: Động cơ tổng hợp lương tự động, khấu trừ tạm ứng, khóa lương bỏ việc = 0, giữ lương thiếu đồng phục, xuất file Excel lệnh chi ngân hàng Apache POI.
- **Controller**:
  - `PayrollController` (`/api/v1/hr/advances/*`, `/api/v1/hr/increases/*`, `/api/v1/hr/payroll/*`) với đầy đủ phân quyền RBAC (`@PreAuthorize`).
- **Unit Tests**:
  - `PayrollCalculationServiceTest`: Kiểm thử tính toán lương thực lĩnh, trừ tạm ứng, cờ bỏ việc lương = 0, và thuật toán 3 điều kiện tăng lương. Tổng cộng 14/14 unit tests pass 100%.

### 2.3. Frontend (React 18, TypeScript, Tailwind CSS)
- **API Client**: `frontend/src/api/payroll.ts` kết nối tất cả endpoints ứng lương, xét tăng lương, bảng lương và download file Excel binary blob.
- **UI Module**: `frontend/src/components/payroll/PayrollModule.tsx`
  - 4 KPI cards: Tổng quỹ lương thực chi, Tổng số nhân sự, Tạm ứng đã khấu trừ, Khóa/Giữ lương.
  - **Tab 1: Bảng Lương Tổng Hợp**: Bảng chi tiết lương cơ bản, ngày công, tăng lương, phụ cấp, tạm ứng trừ, thực lĩnh, trạng thái (`CHO_DUYET`, `DANG_GIU_LUONG`, `BO_VIEC`).
  - **Tab 2: Ứng Lương & Duyệt Chi**: Form nộp đơn ứng lương cho nhân viên + Bảng duyệt chi thực tế cho Kế toán kèm modal nhập số tiền thực chi và tháng khấu trừ.
  - **Tab 3: Xét Tăng Lương Quý**: Nút quét tự động điều kiện Q4-2026, hiển thị rõ lý do Đủ/Chưa đủ điều kiện và nút duyệt tăng lương.
  - **Tab 4: Phiếu Lương Cá Nhân**: Giao diện thẻ trực quan trên thiết bị di động, minh bạch các khoản trừ và hiển thị thông tin tài khoản ngân hàng nhận tiền.
  - Nút **Xuất File Ngân Hàng**: Tải ngay file Excel `Lenh_Chi_Ngan_Hang_YYYY-MM.xlsx`.

---

## 3. Kết Quả Kiểm Thử (Verification)
1. **Unit Test Backend**:
   - `mvn test`: 14/14 tests pass (AttendanceServiceTest: 4, KitchenServiceTest: 3, ReconciliationCalculationServiceTest: 3, PayrollCalculationServiceTest: 3, RestaurantApplicationTests: 1).
2. **Build Docker Containers**:
   - Backend Spring Boot: Image built & healthy on port 8080.
   - Flyway: Version `v6` applied successfully.
   - Frontend Vite: Built in 1.68s, bundle gzip 100.90 kB, Nginx container healthy on port 80.
3. **API Integration Test**:
   - `GET /api/v1/hr/advances`: 200 OK.
   - `POST /api/v1/hr/payroll/generate?month=2026-11`: 200 OK.
   - `GET /api/v1/hr/payroll/2026-11/export-bank`: 200 OK (`Content-Disposition: attachment; filename=Lenh_Chi_Ngan_Hang_2026-11.xlsx`).

---

## 4. Kế Hoạch Tiếp Theo
- Bàn giao kết quả Phase 5 cho `@verifier` nghiệm thu.
- Chuẩn bị bước vào **Phase 6: Kiểm Thử E2E, Seed Data & Đóng Gói Demo** (`phase-6-testing-deployment.md`).
