# Nhật Ký Công Việc: Giai Đoạn 10 — Hoàn Thiện Nghiệp Vụ Nhân Sự, Kỷ Luật Bỏ Việc & Khóa Bảng Lương

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P10-HR-PAYROLL-LOCKS` (Cơ chế Khóa Bảng Lương `Payroll Lock`, Xử lý Kỷ luật Bỏ việc = 0 đ & Tách khỏi P&L, Hủy Xác Nhận Bỏ Việc Nhầm & Chi Tiết Lý Do Giữ Lương Đồng Phục)  
**Tác giả thực hiện**: `@backend-dev`, `@frontend-dev`  
**Kiểm thử & Nghiệm thu**: `@verifier-2`  
**Nhánh Git**: `feature/p10-hr-payroll-locks`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

Căn cứ theo mục 2.1, 2.3, 3.2, 3.3 của tài liệu phản biện `phan_bien_va_gop_y_plan.md` và `task/phase-10-hr-payroll-locks.md`:
1. **Bổ sung các trường dữ liệu bắt buộc cho bảng lương**:
   - Thêm `branch_id`, `excluded_from_cost`, `hold_reason`, `locked_at`, `locked_by` vào bảng `payrolls`.
   - Tạo bảng `payroll_periods` để quản lý trạng thái đóng/mở (`OPEN`, `LOCKED`) của từng kỳ bảng lương theo chi nhánh/toàn chuỗi.
2. **Cơ chế Khóa bảng lương & Bảo vệ đơn ứng lương (Payroll Lock)**:
   - Khi kỳ lương ở trạng thái `LOCKED`, ngăn chặn triệt để mọi hành động tạo mới, chỉnh sửa hoặc hủy đơn ứng lương (`PUT/DELETE /api/v1/payroll/advances/{id}`) và giải ngân tạm ứng của tháng đó (trả về lỗi HTTP 400 Bad Request).
   - Chỉ Kế toán tổng (`ROLE_GENERAL_ACCOUNTANT`) có quyền Khóa (`POST /api/v1/payroll/lock/{periodMonth}`) hoặc Mở khóa (`POST /api/v1/payroll/unlock/{periodMonth}`) kèm bắt buộc nhập lý do mở khóa và ghi audit log.
3. **Xử lý kỷ luật nhân viên bỏ việc**:
   - Nhân viên bị xác nhận tự ý bỏ việc: Số ngày công thực tế vẫn được hiển thị đầy đủ trên bảng công để đối soát, nhưng lương thực lĩnh `net_salary = 0.00`, cột ghi chú ghi rõ: *"Bỏ việc — không trả theo quy định"*, và đánh dấu cờ `excluded_from_cost = true`.
   - Bảng tổng hợp chi phí lãi lỗ chi nhánh: Loại bỏ hoàn toàn các dòng `excluded_from_cost = true` khỏi tổng chi phí lương (`totalBranchCost`).
   - Báo cáo bảng lương tháng: Hiển thị dòng/KPI riêng *"Lương không trả do bỏ việc"* (`totalUnpaidAbandonedSalary`).
4. **Quyền Kế toán tổng hủy xác nhận bỏ việc nhầm**:
   - Cung cấp API `POST /api/v1/hr/abandoned/{id}/cancel` dành riêng cho `ROLE_GENERAL_ACCOUNTANT`.
   - Đổi trạng thái đơn bỏ việc sang `CANCELLED`, khôi phục trạng thái nhân viên về `ACTIVE`, tính toán lại lương tháng thực lĩnh đầy đủ và ghi nhận audit log minh bạch.
5. **Chi tiết lý do giữ lương đồng phục**:
   - Khi quản lý bàn giao thu hồi đồng phục mà thiếu đồ, hệ thống tự động sinh chuỗi định dạng: *"Đang giữ — thiếu [Danh sách món]"* và lưu vào `payrolls.hold_reason`, hiển thị trực quan cho nhân viên và kế toán.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Cơ Sở Dữ Liệu & Flyway Migration (V10)
- **Tệp migration**: `backend/src/main/resources/db/migration/V10__payroll_enhancement_and_locks.sql`
- **Thay đổi lược đồ**:
  - Bảng `payrolls`:
    - `branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE`
    - `excluded_from_cost BOOLEAN NOT NULL DEFAULT FALSE`
    - `hold_reason VARCHAR(500)`
    - `locked_at TIMESTAMP WITH TIME ZONE`
    - `locked_by BIGINT REFERENCES users(id) ON DELETE SET NULL`
  - Bảng `payroll_periods`:
    - `id BIGSERIAL PRIMARY KEY`
    - `period_month VARCHAR(7) NOT NULL` (Định dạng `YYYY-MM`)
    - `branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE`
    - `status VARCHAR(20) NOT NULL DEFAULT 'OPEN'` (`OPEN`, `LOCKED`)
    - `locked_at TIMESTAMP WITH TIME ZONE`
    - `locked_by BIGINT REFERENCES users(id) ON DELETE SET NULL`
    - `unlock_reason TEXT`
    - `UNIQUE (period_month, branch_id)`
  - Bảng `resignation_requests`:
    - `cancelled_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL`
    - `cancelled_at TIMESTAMP WITH TIME ZONE`

### 2.2. Backend (Java 17, Spring Boot 3, Spring Security 6)
- **DTOs & Entities**:
  - `PayrollPeriod`: Thực thể quản lý phiên chốt bảng lương.
  - `PayrollPeriodResponse`: DTO phản hồi trạng thái OPEN/LOCKED, thời gian khóa, người khóa.
  - `PayrollSummaryResponse`: DTO tổng hợp chi phí lương chi nhánh (`totalBranchCost`), tách riêng `totalUnpaidAbandonedSalary`, `abandonedCount`, `uniformRetainedCount`.
  - `UpdateAdvanceRequest`, `UnlockPeriodRequest`: Request DTOs chuẩn hóa dữ liệu đầu vào.
- **Dịch vụ & Nghiệp vụ (Services)**:
  - `SalaryAdvanceService`: Kiểm tra tính toàn vẹn kỳ lương trong `updateAdvanceRequest`, `cancelAdvanceRequest`, `disburseAdvance`. Ném ngoại lệ `ApiException("Kỳ lương ... đã được chốt và khóa...")` nếu kỳ lương ở trạng thái `LOCKED`.
  - `PayrollService`:
    - `lockPeriod(String periodMonth, Long branchId, UserPrincipal accountant)`: Chốt khóa kỳ lương và đồng loạt đóng băng các bảng lương chi nhánh.
    - `unlockPeriod(String periodMonth, Long branchId, UnlockPeriodRequest request, UserPrincipal accountant)`: Mở khóa kèm bắt buộc lý do và ghi nhận `AuditLog`.
    - `generateMonthlyPayroll(...)`: Kiểm tra trạng thái bỏ việc, tính toán ngày công thực tế nhưng áp dụng `netSalary = 0`, gán `excludedFromCost = true`, ghi chú *"Bỏ việc — không trả theo quy định"*.
    - `getPayrollSummary(String periodMonth, Long branchId)`: Tính tổng chi phí chỉ gồm các bảng lương không bị excluded, tổng hợp riêng quỹ lương bỏ việc không chi trả.
  - `AttendanceService`:
    - `cancelAbandonment(Long resignationRequestId, UserPrincipal accountant)`: Hủy bỏ việc nhầm, khôi phục `ACTIVE`, tính lại bảng lương và ghi audit log.
  - `UniformAndResignationService`:
    - Tự động sinh `holdReason = "Đang giữ — thiếu " + missingItems` khi nhân viên trả thiếu đồng phục, đồng bộ ngay lập tức vào `payrolls.hold_reason` và `payrolls.note`.
- **Controllers**:
  - `PayrollController`:
    - `POST /api/v1/payroll/lock/{periodMonth}` (`ROLE_GENERAL_ACCOUNTANT`)
    - `POST /api/v1/payroll/unlock/{periodMonth}` (`ROLE_GENERAL_ACCOUNTANT`)
    - `GET /api/v1/payroll/periods/{periodMonth}`
    - `GET /api/v1/payroll/summary`
    - `PUT /api/v1/payroll/advances/{id}`
    - `DELETE /api/v1/payroll/advances/{id}`
  - `HrAttendanceController`:
    - `POST /api/v1/hr/abandoned/{id}/cancel` (`ROLE_GENERAL_ACCOUNTANT`)

### 2.3. Frontend (React 18, TypeScript, Tailwind CSS)
- **API Clients (`frontend/src/api/payroll.ts` & `frontend/src/api/hr.ts`)**:
  - Bổ sung `lockPeriod`, `unlockPeriod`, `getPeriodStatus`, `getPayrollSummary`, `updateAdvance`, `cancelAdvance`, `cancelAbandonment`.
- **PayrollModule (`frontend/src/components/payroll/PayrollModule.tsx`)**:
  - Nút **[Chốt & Khóa Bảng Lương]** và **[Mở Khóa Kỳ Lương]** dành riêng cho Kế toán tổng.
  - Huy hiệu trạng thái nổi bật `[ĐÃ KHÓA]` kèm biểu tượng ổ khóa khi kỳ lương bị niêm phong.
  - Tự động vô hiệu hóa các nút Sửa / Hủy / Duyệt chi ứng lương khi kỳ lương bị khóa.
  - KPI Card riêng biệt: **"Lương Bỏ Việc Không Trả"** (loại khỏi chi phí P&L chi nhánh).
  - Cột chi tiết lý do giữ lương đồng phục (`p.holdReason`) hiển thị trực quan cả trên bảng kế toán và phiếu lương cá nhân.
  - Dòng nhân sự bỏ việc: Thể hiện đúng số ngày công thực tế, lương = 0 đ, ghi chú đỏ *"Bỏ việc — không trả theo quy định"*.
- **HRModule (`frontend/src/components/hr/HRModule.tsx`)**:
  - Nút **[Hủy xác nhận nhầm]** cho Kế toán tổng trong danh sách nhân viên bỏ việc, mở modal xác nhận và tự động khôi phục nhân viên về trạng thái bình thường.

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Acceptance Criteria Verification)

### 3.1. Kiểm thử Tự Động (Unit & Integration Tests)
- Toàn bộ 42 unit test trong backend chạy qua với tỷ lệ thành công 100%:
  - `PayrollLockAndAbandonmentTest`: 7/7 tests passed
  - `AttendanceServiceTest`: 4/4 tests passed
  - `InventoryCheckServiceTest`: 2/2 tests passed
  - `KitchenServiceTest`: 8/8 tests passed
  - `MultiRoleRbacTest`: 5/5 tests passed
  - `PayrollCalculationServiceTest`: 3/3 tests passed
  - `ReconciliationCalculationServiceTest`: 4/4 tests passed
  - `SupplierServiceTest`: 3/3 tests passed
  - `WarehouseServiceTest`: 5/5 tests passed
  - `RestaurantApplicationTests`: 1/1 test passed
- Lệnh thực thi: `cd backend && ./mvnw test` $\rightarrow$ **BUILD SUCCESS (42/42 tests passed)**.

### 3.2. Kiểm thử Frontend Build
- Lệnh thực thi: `npm run build` (`tsc && vite build`) $\rightarrow$ **Thành công trong 1.94s với 0 lỗi TypeScript / ESLint**.

### 3.3. Nghiệm Thu Thực Tế Các Tiêu Chí (Live Acceptance Verification)

| # | Tiêu chí nghiệm thu | Kết quả thực nghiệm | Đánh giá |
| :---: | :--- | :--- | :---: |
| **AC 1** | Kế toán tổng khóa bảng lương tháng 11/2026 $\rightarrow$ Cố tình gửi request sửa đơn ứng lương $\rightarrow$ Bị từ chối với HTTP 400 rõ ràng. | - Gọi `POST /api/v1/payroll/lock/2026-11` thành công, kỳ lương chuyển sang `LOCKED`.<br>- Gọi `PUT /api/v1/payroll/advances/1` nhận ngay `HTTP 400 Bad Request` kèm thông điệp: *"Kỳ lương 2026-11 đã được chốt và khóa. Không được phép chỉnh sửa đơn ứng lương!"*.<br>- Gọi `POST /api/v1/payroll/unlock/2026-11` mở khóa thành công kèm ghi audit log. | ✅ **ĐẠT** |
| **AC 2** | Nhân viên bỏ việc: Bảng lương hiện đúng công thực tế, lương = 0 đ, ghi chú "Bỏ việc — không trả theo quy định", không cộng vào tổng tiền lương chi nhánh. | - Xác nhận bỏ việc cho nhân viên Hoàng Nhân Viên (ID: 5).<br>- Gọi `POST /api/v1/hr/payroll/generate?month=2026-11`: Ngày công hiển thị 24.0 ngày, `netSalary = 0.00`, `status = "BO_VIEC"`, `excludedFromCost = true`, ghi chú: *"Bỏ việc — không trả theo quy định"*.<br>- Gọi `GET /api/v1/payroll/summary?month=2026-11`: `totalBranchCost` loại bỏ hoàn toàn nhân viên này (chỉ còn 39.576.923 đ), hiển thị tách riêng dòng `totalUnpaidAbandonedSalary = 6.500.000 đ`. | ✅ **ĐẠT** |
| **AC 3** | Quản lý xác nhận nhầm bỏ việc $\rightarrow$ Kế toán tổng hủy xác nhận nhầm $\rightarrow$ Nhân viên trở lại ACTIVE và tính lại lương đầy đủ. | - Kế toán tổng gọi `POST /api/v1/hr/abandoned/5/cancel`.<br>- Trạng thái nhân viên lập tức khôi phục `ACTIVE`, đơn bỏ việc chuyển `CANCELLED`, ghi nhận `cancelledByUser` là `ketoan_tong`.<br>- Tổng hợp lại bảng lương: `netSalary = 6.500.000 đ`, `status = "CHO_DUYET"`, `excludedFromCost = false`, `abandonedCount = 0`, `totalBranchCost` trở lại 46.076.923 đ. | ✅ **ĐẠT** |
| **AC 4** | Nhân viên nghỉ việc thiếu đồ đồng phục $\rightarrow$ Trạng thái lương hiển thị chi tiết lý do. | - Nhân viên Nguyễn Văn Bếp thiếu đồng phục khi bàn giao nghỉ việc.<br>- Trường `hold_reason` và `note` trong `payrolls` tự động hiển thị: *"Chưa hoàn trả: Tạp Dề Bếp / Phục Vụ Chống Thấm, Nón / Mũ Bếp Tiêu Chuẩn Vệ Sinh, Thẻ Tên Nhân Viên Từ Tính"*, hiển thị rõ ràng trên bảng lương và phiếu lương cá nhân. | ✅ **ĐẠT** |

---

## 4. Kết Luận
Giai đoạn 10 đã hoàn tất xuất sắc toàn bộ các mục tiêu nghiệp vụ theo đúng 4 điểm phản biện (#5, #7, #10, #11) trong `phan_bien_va_gop_y_plan.md`. Hệ thống đảm bảo tính toàn vẹn tài chính khi chốt bảng lương, xử lý nghiêm ngặt nhưng linh hoạt chế độ kỷ luật bỏ việc, bảo vệ chi phí lãi lỗ của nhà hàng không bị sai lệch, và công khai minh bạch mọi lý do giữ lương đồng phục.
