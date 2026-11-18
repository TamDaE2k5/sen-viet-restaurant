# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 8 (PHASE 8)
## Quy Tắc Chặt Chẽ Bếp, Món Dùng Trong Ngày & Thêm Nhanh Ra Line

> **Căn cứ**: Mục 1.3, 1.4, 2.4, 3.1, 3.4 trong [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md)  
> **Mục tiêu**: Thiết lập các quy tắc nghiệp vụ "bất khả xâm phạm" tại quầy bếp: Chặn cứng mẻ hỏng chưa duyệt, quy trình xử lý món tươi dùng trong ngày cuối ca, khẳng định nút Ra line không trừ kho, và cho phép thêm món nhanh ra line.

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [x] **Task 8.1: Flyway Migration `V8__kitchen_rules_and_daily_items.sql`**
  - Thêm cột `is_daily_only` (`BOOLEAN DEFAULT FALSE`) vào bảng `items` (đánh dấu các món tươi chỉ dùng trong ngày như salad, bánh bao, kim chi, nộm).
  - Tạo bảng `daily_waste_confirmations`: `id`, `branch_id`, `item_id`, `waste_date`, `shift`, `quantity`, `unit`, `confirmed_by`, `status`, `note`, `created_at`.
  - Bổ sung chỉ mục tối ưu hóa tìm kiếm: `idx_daily_waste_branch_date`.

- [x] **Task 8.2: Logic Chặn Cứng: Mẻ Hỏng Chưa Duyệt $\rightarrow$ Không Cho Làm Mẻ Tiếp Theo**
  - **Đặc tả gốc**: *"Mẻ trước đã báo hỏng nhưng quản lý chưa duyệt thì chưa làm được mẻ tiếp."*
  - Tại `BatchProcessingService.startBatch()`: Kiểm tra nếu tồn tại báo hỏng của cùng món (`item_id`), cùng chi nhánh (`branch_id`) có trạng thái `CHO_DUYET`:
    - Backend ném `UnapprovedDamageReportException` (HTTP 422 Unprocessable Entity) với thông báo: *"Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!"*.
    - Ngăn chặn triệt để hành vi cố tình mở mẻ mới để che giấu hao hụt/hỏng hóc mẻ trước.

- [x] **Task 8.3: Quy Trình Xử Lý "Món Chỉ Dùng Trong Ngày" Cuối Ca**
  - **Đặc tả gốc**: *"Món chỉ dùng trong ngày (salad, bánh bao…): cuối ca app liệt kê món còn tồn, nhân viên xác nhận ghi bỏ; tách khỏi hàng hỏng."*
  - `GET /api/v1/kitchen/daily-only/remaining`: Quét danh sách các món có `is_daily_only = true` và tồn thực tế cuối ca.
  - `POST /api/v1/kitchen/daily-only/confirm-waste`: Nhân viên bếp xác nhận số lượng hủy bỏ cuối ngày.
  - Tách bạch hạch toán: Số lượng này được ghi nhận vào cột "Hỏng/bỏ có báo" của Bảng cuối ngày, nhưng không tính vào chi phí phạt nhân viên bếp (do tính chất hàng tươi hết hạn sử dụng theo ca).

- [x] **Task 8.4: Khẳng Định Nghiệp Vụ: Nút Ra Line Chỉ Để Theo Dõi, Tuyệt Đối Không Trừ Kho**
  - **Đặc tả gốc**: *"Chỉ để theo dõi, đối chiếu, không trừ kho."*
  - Audit và kiểm toán mã nguồn tại `LineItemLogService`: Xác nhận tuyệt đối không có lệnh trừ tồn kho trong phương thức `incrementLineTray()`.
  - Bổ sung tài liệu Javadoc và comment nghiệp vụ làm rõ lý do: Lượng xuất kho đã được tính toán thông qua mẻ chế biến hoặc lấy hàng thô; nút Ra line chỉ đo lường tần suất tiếp đồ ra quầy buffet để đối soát với lượng khách dùng của CukCuk POS.

- [x] **Task 8.5: Thêm Món Mới Trực Tiếp Trên Màn Hình Ra Line (Quick Add Line Item)**
  - **Đặc tả gốc**: *"Thêm món mới ngay trên màn hình"*
  - Backend: `POST /api/v1/kitchen/line-items/quick-add`: Cho phép nhân viên bếp hoặc quản lý bổ sung nhanh một món vào thực đơn ra line trong ca mà không cần truy cập trang Cấu hình Admin.
  - Frontend: Thêm nút `[+ Thêm món]` trên thanh công cụ của Sổ Ra Line, mở Modal nhập nhanh tên món, nhóm món và thứ tự hiển thị.

- [x] **Task 8.6: Tách Riêng Hao Hụt Chế Biến Trong Báo Cáo Chống Thất Thoát**
  - Đảm bảo trong công thức tính Bảng cuối ngày: $\text{Hao hụt chế biến}$ được ghi riêng, không cộng dồn vào tỷ lệ con hàng ($\text{Kg/khách}$) của khách dùng thực tế.
  - Viết unit test JUnit 5 kiểm tra công thức tính độc lập này.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. Món "Cua hấp" vừa báo hỏng 5 kg (chờ quản lý duyệt) -> Nhân viên bấm "Bắt đầu mẻ mới" cho Cua hấp -> Hệ thống chặn ngay lập tức, hiển thị thông báo lỗi rõ ràng.
2. Quản lý vào duyệt báo hỏng -> Nhân viên được phép tạo mẻ mới bình thường.
3. Cuối ca, giao diện gợi ý danh sách Salad, Kim chi còn tồn; nhân viên bấm "Xác nhận ghi bỏ" -> Số liệu ghi nhận vào cột Hỏng/bỏ có báo của Bảng cuối ngày.
4. Bấm `+1` ra line 10 lần -> Số lượng tồn kho nguyên liệu không đổi; bảng `line_item_logs` tăng thêm 10 bản ghi.
5. Thêm nhanh món mới "Nộm hoa chuối" ngay tại quầy buffet -> Món lập tức xuất hiện trong danh sách ra line để nhân viên bấm `+1`.
