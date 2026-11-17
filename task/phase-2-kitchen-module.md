# Giai Đoạn 2: Phân Hệ Bếp 4 Nút Mobile & Quản Trị Chế Biến Mẻ
> **Mã giai đoạn**: `P2-KITCHEN`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#42-phần-i--kho-bếp--chống-thất-thoát](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Xây dựng giao diện di động 4 nút cỡ lớn cho Bếp, kiểm soát chặt chẽ quy trình cân mẻ, tính tỷ lệ hao hụt tự động, cảnh báo mẻ thứ hai chưa xong, cơ chế chống double-click khi ra line và nén ảnh báo hỏng trực tiếp trên trình duyệt.

---

## Danh Sách Công Việc (Tasks)

- [x] **Task 2.1: Database Schema Migration cho Phân hệ Bếp (V3)**
  - **Mô tả**: Viết script migration `V3__kitchen_and_processing_schema.sql` tạo các bảng:
    - `items` (Nguyên liệu & món ăn: Cua, Ghẹ, Kim chi, Bò cuộn nấm...)
    - `recipes` (Công thức & tỷ lệ hao hụt chuẩn: ví dụ Cua hấp chuẩn hụt 20%)
    - `processing_batches` (Mẻ chế biến: kg xuất, kg thành phẩm, % hao hụt thực tế, cờ `is_over_standard`, cờ `is_second_batch`, trạng thái `DANG_LAM` / `HOAN_THANH`)
    - `damage_reports` (Báo hỏng: mã lô, NCC, kg hỏng, giá trị ước tính, lý do, link ảnh, trạng thái duyệt)
    - `line_item_logs` (Ghi nhận ra line +1)
    - `take_out_logs` (Ghi nhận xuất kho sơ bộ ra bếp)
  - **Tiêu chí nghiệm thu**: Tạo bảng thành công trên PostgreSQL 16, index `branch_id`, `created_at` đầy đủ, Flyway migration v3 executed.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 2.2: Backend API "Lấy Hàng" (Take-out)**
  - **Mô tả**: Xây dựng endpoint `POST /api/v1/kitchen/take-out` và `GET /api/v1/kitchen/items/search?code=...`:
    - Tìm kiếm nguyên liệu nhanh theo mã vạch / barcode hoặc tên.
    - Ghi nhận lượng xuất kho sơ bộ và thông tin người thực hiện.
  - **Tiêu chí nghiệm thu**: Phản hồi kết quả tìm kiếm trong $< 200\text{ms}$.
  - **Độ ưu tiên**: P1 (Hoàn thành)

- [x] **Task 2.3: Backend API "Chế Biến Mẻ" & Logic Cảnh Báo Hao Hụt**
  - **Mô tả**: Xây dựng 2 endpoints:
    - `POST /api/v1/kitchen/processing/start`: Tạo mẻ mới. Nếu cùng món đó trong ca đang có mẻ `DANG_LAM` $\rightarrow$ Tự động bật cờ `is_second_batch = true` và trả mã HTTP 409 Conflict yêu cầu xác nhận `forceSecondBatch`.
    - `POST /api/v1/kitchen/processing/finish`: Nhập kg thành phẩm. Tự động tính:
      $$\text{Tỷ lệ hụt} = \frac{\text{Kg xuất} - \text{Kg thành phẩm}}{\text{Kg xuất}} \times 100\%$$
      Nếu hụt thực tế $>$ hao hụt chuẩn cấu hình $\rightarrow$ Đánh dấu cờ `is_over_standard = true` và cảnh báo.
  - **Tiêu chí nghiệm thu**: Unit test kiểm tra mẻ cua hấp ($10\text{ kg} \rightarrow 8\text{ kg} \Rightarrow 20\%$ chuẩn; $10\text{ kg} \rightarrow 7\text{ kg} \Rightarrow 30\%$ báo đỏ) pass 100%.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 2.4: Backend API "Ra Line" (+1) & Chống Double-Click**
  - **Mô tả**: Xây dựng endpoint `POST /api/v1/kitchen/line-items/inc` ghi nhận lượt đưa khay món ăn ra line buffet theo nhóm món. Áp dụng cơ chế Idempotency Key theo `request_id` để loại trừ hoàn toàn việc ghi nhận lặp khi mạng chập chờn.
  - **Tiêu chí nghiệm thu**: Ghi nhận chính xác số khay đưa ra theo từng ca/ngày, gửi 2 lần cùng `request_id` không nhân đôi.
  - **Độ ưu tiên**: P1 (Hoàn thành)

- [x] **Task 2.5: Backend API "Báo Hỏng" & Upload Ảnh (Kèm Nén)**
  - **Mô tả**: Xây dựng endpoint `POST /api/v1/kitchen/damage-reports`:
    - Tiếp nhận thông tin: Nguyên liệu, mã lô NCC, số kg, lý do (`HONG_DO_NHA_CUNG_CAP`, `HONG_CHE_BIEN`, `HONG_BAO_QUAN`, `HET_HAN_SU_DUNG`), ảnh minh chứng.
    - Nếu giá trị $\le 500.000$ đ $\rightarrow$ Tự động ghi nhận `TU_DONG_DUYET`. Nếu $> 500.000$ đ $\rightarrow$ Đặt trạng thái `CHO_DUYET`.
    - Endpoint `PUT /api/v1/kitchen/damage-reports/{id}/approve` dành riêng cho Quản lý nhà hàng / Kế toán duyệt.
  - **Tiêu chí nghiệm thu**: Lưu trữ ảnh nén Base64/URL và cập nhật trạng thái chính xác.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 2.6: Frontend Mobile 4 Nút Bếp & Trải Nghiệm Thao Tác Nhanh**
  - **Mô tả**: Phát triển màn hình di động Bếp chuyên dụng:
    - 4 nút màu sắc lớn: 🟦 Lấy hàng | 🟩 Chế biến | 🟨 Ra line | 🟥 Báo hỏng (Touch target $\ge 48$px).
    - Tích hợp HTML5 Canvas Compressor tự động nén ảnh chụp camera xuống $\sim 200\text{ KB}$ trước khi gửi request.
    - Xử lý UX nút `+1` Ra line: Khi bấm lập tức disable nút, hiển thị spinner và sinh UUID idempotency key.
    - Hiển thị Popup cảnh báo màu đỏ nổi bật khi mở "Mẻ thứ hai" chưa xong mẻ cũ.
    - Realtime preview tỷ lệ hao hụt khi cân thành phẩm.
  - **Tiêu chí nghiệm thu**: Thao tác mượt mà trên điện thoại di động, kích thước nút bấm chuẩn di động, tích hợp hoàn chỉnh vào MobileShell & DesktopShell.
  - **Độ ưu tiên**: P0 (Hoàn thành)
