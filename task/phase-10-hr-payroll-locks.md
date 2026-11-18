# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 10 (PHASE 10)
## Hoàn Thiện Nghiệp Vụ Nhân Sự, Kỷ Luật Bỏ Việc & Khóa Bảng Lương

> **Căn cứ**: Mục 2.1, 2.3, 3.2, 3.3 trong [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md)  
> **Mục tiêu**: Bổ sung các trường dữ liệu bắt buộc cho bảng lương, thiết lập cơ chế Khóa bảng lương ngăn sửa đơn ứng, xử lý lương bỏ việc = 0 cho cả tháng kèm loại khỏi chi phí, và quyền Kế toán tổng hủy xác nhận bỏ việc nhầm.

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [ ] **Task 10.1: Flyway Migration `V10__payroll_enhancement_and_locks.sql`**
  - Mở rộng bảng `payrolls`:
    - Thêm `branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE`.
    - Thêm `excluded_from_cost BOOLEAN NOT NULL DEFAULT FALSE` (phục vụ tách dòng lương bỏ việc khỏi chi phí lãi lỗ).
    - Thêm `hold_reason VARCHAR(500)` (lưu lý do cụ thể: ví dụ "Đang giữ — thiếu 1 tạp dề, 1 mũ").
    - Thêm `status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'` (`DRAFT`, `FINALIZED`, `LOCKED`).
    - Thêm `locked_at TIMESTAMP WITH TIME ZONE`, `locked_by BIGINT REFERENCES users(id)`.
  - Tạo bảng `payroll_periods`: `id`, `period_month VARCHAR(7)`, `branch_id`, `status` (`OPEN`, `LOCKED`), `locked_at`, `locked_by`, `PRIMARY KEY (period_month, branch_id)`.

- [ ] **Task 10.2: Cơ Chế Khóa Bảng Lương & Bảo Vệ Đơn Ứng Lương (Payroll Lock)**
  - **Đặc tả gốc**: *"Đơn đã duyệt chi sửa hoặc huỷ được khi bảng lương tháng đó chưa chốt; đã chốt thì khoá."*
  - `POST /api/v1/payroll/lock/{periodMonth}`: Kế toán tổng chốt và khóa bảng lương tháng.
  - `POST /api/v1/payroll/unlock/{periodMonth}`: Kế toán tổng mở khóa bảng lương (bắt buộc nhập lý do mở khóa và ghi audit log).
  - Kiểm tra tính toàn vẹn: Khi kỳ lương `periodMonth` ở trạng thái `LOCKED`, mọi thao tác sửa hoặc huỷ đơn ứng lương (`PUT/DELETE /api/v1/payroll/advances/{id}`) của tháng đó bị từ chối với mã lỗi HTTP 400 Bad Request.

- [ ] **Task 10.3: Xử Lý Nghiệp Vụ Bỏ Việc: Lương = 0 Cả Tháng & Tách Khỏi Chi Phí Lãi Lỗ**
  - **Đặc tả gốc**: *"Bỏ việc: lương = 0 cả tháng có ngày xác nhận; công vẫn hiện, lương = 0, ghi 'Bỏ việc — không trả theo quy định', không cộng vào tổng chi phí lương và lãi lỗ; cuối tháng có dòng riêng 'Lương không trả do bỏ việc'."*
  - Cập nhật `PayrollCalculationService`:
    - Khi nhân viên có xác nhận bỏ việc trong tháng:
      - Số ngày công thực tế vẫn hiển thị trên bảng công để đối soát.
      - Thiết lập `net_salary = 0.00`.
      - Cột ghi chú lưu: *"Bỏ việc — không trả theo quy định"*.
      - Thiết lập cờ `excluded_from_cost = true`.
    - Tại API tổng hợp chi phí lãi lỗ chi nhánh: Loại bỏ toàn bộ các dòng có `excluded_from_cost = true`.
    - Tại báo cáo bảng lương tháng: Hiển thị mục thống kê riêng: *"Tổng lương không trả do bỏ việc: X.XXX.000 VNĐ"*.

- [ ] **Task 10.4: Quyền Kế Toán Tổng Hủy Xác Nhận Bỏ Việc Nhầm**
  - **Đặc tả gốc**: *"Xác nhận nhầm thì kế toán tổng huỷ được."*
  - Backend API: `POST /api/v1/hr/abandoned/{id}/cancel`:
    - Chỉ cho phép vai trò `ROLE_GENERAL_ACCOUNTANT` (Kế toán tổng) gọi API này.
    - Cập nhật trạng thái bản ghi bỏ việc từ `CONFIRMED` sang `CANCELLED`.
    - Tự động khôi phục trạng thái nhân viên về `ACTIVE` và tính toán lại bảng lương tháng theo công thực tế.
    - Ghi nhận `cancelled_by` và `cancelled_at` để bảo đảm tính minh bạch.

- [ ] **Task 10.5: Chi Tiết Lý Do Giữ Lương Khi Bàn Giao Đồng Phục Thiếu**
  - Khi Quản lý tick nhận lại đồng phục trong quy trình nghỉ việc:
    - Nếu thiếu món nào (ví dụ thiếu 1 áo thun, 1 tạp dề), hệ thống tự động sinh chuỗi mô tả: *"Đang giữ — thiếu 1 Áo thun, 1 Tạp dề"* và lưu vào trường `payrolls.hold_reason`.
    - Hiển thị trực quan lý do này trên màn hình cá nhân của nhân viên và bảng lương của kế toán.

- [ ] **Task 10.6: Cải Tiến Giao Diện Bảng Lương & Nhân Sự**
  - Nút "Chốt & Khóa bảng lương" có xác nhận mật khẩu dành cho Kế toán tổng.
  - Huy hiệu (Badge) `[ĐÃ KHÓA]` hiển thị rõ trên bảng lương; vô hiệu hóa nút sửa đơn ứng lương.
  - Nút `[Hủy xác nhận bỏ việc]` hiển thị cho Kế toán tổng trong danh sách nhân viên bỏ việc.
  - Bảng lương hiển thị dòng riêng phân tách các trường hợp giữ lương và bỏ việc.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. Kế toán tổng bấm "Khóa bảng lương tháng 11/2026" -> Cố tình gửi request sửa số tiền ứng lương tháng 11 -> Bị từ chối với lỗi rõ ràng.
2. Nhân viên Nguyễn Văn A bỏ việc vào ngày 20/11 -> Bảng lương tháng 11 hiện đúng 19 ngày công, lương = 0 đ, ghi chú "Bỏ việc — không trả theo quy định", không cộng vào tổng tiền lương chi nhánh.
3. Quản lý bấm nhầm xác nhận bỏ việc cho nhân viên B -> Kế toán tổng bấm "Hủy xác nhận nhầm" -> Trạng thái nhân viên B trở lại bình thường và lương được tính lại đầy đủ.
4. Nhân viên nghỉ việc thiếu 1 nón và 1 tạp dề -> Trạng thái lương hiển thị: *"Đang giữ — thiếu 1 Nón, 1 Tạp dề"*.
