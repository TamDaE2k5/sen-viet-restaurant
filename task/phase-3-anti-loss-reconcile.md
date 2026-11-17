# Giai Đoạn 3: Động Cơ Chống Thất Thoát, Đối Soát CukCuk & Bảng Cuối Ngày
> **Mã giai đoạn**: `P3-RECON`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#2-phân-hệ-đối-soát--chống-thất-thoát-i5](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Xây dựng phân hệ đối soát cuối ngày tự động hóa, bóc tách số liệu bán hàng từ file Excel POS CukCuk, tính toán 6 chỉ số cốt lõi, cảnh báo đỏ thất thoát và báo cáo tỷ lệ hỏng theo từng nhà cung cấp.

---

## Danh Sách Công Việc (Tasks)

- [x] **Task 3.1: Database Schema Migration cho Đối Soát & Thất Thoát (V4)**
  - **Mô tả**: Viết script migration `V4__reconciliation_and_cukcuk_schema.sql` tạo các bảng:
    - `cukcuk_sales_imports` (Lịch sử nạp file POS CukCuk: số khách người lớn, trẻ em theo từng suất buffet)
    - `inventory_snapshots` (Số liệu kiểm kê: tồn đầu ca, nhập trong ca, tồn cuối ca)
    - `daily_reconciliations` (Kết quả đối soát 6 cột, cờ `is_over_threshold`, danh tính người kiểm kho)
    - `notification_logs` (Lịch sử bắn webhook Zalo / thông báo hệ thống)
  - **Tiêu chí nghiệm thu**: Tạo cấu trúc bảng chuẩn trên PostgreSQL 16, có index `branch_id, recon_date`, `is_over_threshold`. Flyway V4 applied thành công.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 3.2: Bộ Bóc Tách File Excel CukCuk POS (Apache POI)**
  - **Mô tả**: Xây dựng service `CukCukExcelParserService` đọc file Excel (`.xlsx`, `.xls`) xuất từ phần mềm CukCuk:
    - Trích xuất tự động: Doanh thu theo ca, số lượng từng gói vé buffet (vé tiêu chuẩn, vé vip, vé trẻ em).
    - Hỗ trợ tạo file Excel mẫu POS CukCuk để kiểm thử và tải về máy tính.
    - Lưu trữ lịch sử import vào `cukcuk_sales_imports`.
  - **Tiêu chí nghiệm thu**: Đọc chính xác file Excel mẫu CukCuk không phát sinh lỗi memory leak, xử lý được dữ liệu có ô rỗng hoặc định dạng đặc biệt.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 3.3: Động Cơ Tính Toán 6 Công Thức Đối Soát Tự Động**
  - **Mô tả**: Triển khai `ReconciliationCalculationService` tính toán tự động:
    1. $\text{Xuất} = \text{Tồn đầu} + \text{Nhập} - \text{Tồn kiểm cuối ca}$
    2. $\text{Khách dùng} = (\text{Người lớn} + \text{Trẻ em} \times \text{Hệ số}) \times \text{Định mức chuẩn}$
    3. $\text{Hụt chế biến} = \sum (\text{Kg nguyên liệu xuất} - \text{Kg thành phẩm thu được})$
    4. $\text{Hỏng có báo} = \sum (\text{Kg báo hỏng đã duyệt hoặc tự động ghi nhận})$
    5. $\text{Lệch không rõ (Thất thoát)} = \text{Xuất} - \text{Khách dùng} - \text{Hụt chế biến} - \text{Hỏng có báo}$
    6. $\text{Tỷ lệ con hàng thực tế/khách} = \frac{\text{Xuất} - \text{Hụt chế biến} - \text{Hỏng có báo}}{\text{Tổng số khách}}$
  - **Tiêu chí nghiệm thu**: Viết Unit Test `ReconciliationCalculationServiceTest` (AssertJ) kiểm chứng chuẩn xác với bộ dữ liệu kiểm thử (món cua thất thoát 6.8kg -> cờ đỏ, món bò -> cờ xanh, edge case 0 khách).
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 3.4: Backend API Bảng Cuối Ngày & Logic Cảnh Báo Thất Thoát**
  - **Mô tả**: Xây dựng endpoint `GET /api/v1/reconciliation/daily-summary`:
    - Bộ lọc đa chiều: Ngày, Ca (`CA_TRUA`, `CA_TOI`, `CA_NGAY`), Chi nhánh, Cờ vượt ngưỡng.
    - Đánh dấu cờ `is_over_threshold = true` nếu $\text{Lệch không rõ} > 5\%$ hoặc giá trị thất thoát $> 300.000\text{ VNĐ}$.
    - Gửi tín hiệu thông báo Zalo Webhook tới Chủ chuỗi và Kế toán khi phát hiện thất thoát bất thường (`ZaloNotificationService`).
  - **Tiêu chí nghiệm thu**: API trả về dữ liệu đối soát đầy đủ kèm trạng thái cảnh báo theo đúng schema.
  - **Độ ưu tiên**: P0 (Hoàn thành)

- [x] **Task 3.5: Backend API Báo Cáo Tỷ Lệ Hỏng Theo Nhà Cung Cấp**
  - **Mô tả**: Xây dựng endpoint `GET /api/v1/reconciliation/supplier-loss-report`:
    - Tính toán: $\%\text{ Hỏng} = \frac{\text{Kg hỏng theo lô NCC}}{\text{Kg nhập của NCC trong tháng}} \times 100\%$.
    - Tự động sắp xếp nhà cung cấp có tỷ lệ hỏng cao nhất lên đầu bảng.
  - **Tiêu chí nghiệm thu**: Thống kê chính xác tỷ lệ cua chết/hàng hỏng theo từng NCC trong tháng.
  - **Độ ưu tiên**: P1 (Hoàn thành)

- [x] **Task 3.6: Frontend Dashboard Đối Soát & Xuất Báo Cáo Excel**
  - **Mô tả**: Phát triển màn hình Quản trị Đối soát dành cho Quản lý & Kế toán:
    - Bảng dữ liệu trực quan: Tự động tô đỏ nổi bật toàn bộ dòng có thất thoát vượt ngưỡng (`is_over_threshold = true`).
    - Form upload file Excel CukCuk có kết quả bóc tách trực tiếp và nút tải file mẫu.
    - Hiển thị rõ ràng tên nhân viên chịu trách nhiệm kiểm kho ca đó.
    - Nút "Xuất Báo Cáo Excel" tải báo cáo đối soát chi tiết về máy tính (`GET /export-excel`).
  - **Tiêu chí nghiệm thu**: Giao diện hiển thị bảng rõ ràng, responsive mượt mà trên Desktop/Tablet, tích hợp hoàn chỉnh vào DesktopShell & App.
  - **Độ ưu tiên**: P0 (Hoàn thành)
