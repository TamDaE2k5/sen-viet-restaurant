# Nhật Ký Phát Triển: Giai Đoạn 3 - Động Cơ Chống Thất Thoát, Đối Soát CukCuk & Bảng Cuối Ngày
- **Thời gian**: 2026-11-17 22:58 - 23:10 (UTC+7)
- **Người thực hiện**: Lead Builder (AI Agent)
- **Mã Task liên quan**: P3-RECON (Tasks 3.1 - 3.6)
- **Nhánh Git**: `dev`
- **Trạng thái**: ✅ Hoàn thành 100%

---

### 1. Mục Tiêu Giai Đoạn 3
Xây dựng phân hệ đối soát cuối ngày tự động hóa, bóc tách số liệu bán hàng từ file Excel POS CukCuk qua Apache POI, tính toán 6 chỉ số cốt lõi, cảnh báo đỏ thất thoát (>300.000 VNĐ hoặc >5%), tích hợp cảnh báo Webhook Zalo Bot, báo cáo tỷ lệ hỏng theo từng nhà cung cấp và hỗ trợ xuất file Excel báo cáo.

---

### 2. Tiến Độ Thực Hiện Từng Task

#### Task 3.1: Database Schema Migration cho Đối Soát & Thất Thoát (V4)
- **Tập tin**: `backend/src/main/resources/db/migration/V4__reconciliation_and_cukcuk_schema.sql`
- **Nội dung**: Các bảng `cukcuk_sales_imports`, `inventory_snapshots`, `daily_reconciliations`, `notification_logs` và seed số liệu mẫu ca hôm nay.
- **Index**: `idx_cukcuk_sales_branch_date`, `idx_inventory_snapshots_lookup`, `idx_daily_reconciliations_lookup`, `idx_daily_reconciliations_flag`.
- **Trạng thái**: ✅ Hoàn thành, Flyway V4 applied thành công trên PostgreSQL 16.

#### Task 3.2: Bộ Bóc Tách File Excel CukCuk POS (Apache POI)
- **Tập tin**:
  - `backend/src/main/java/com/senviet/service/CukCukExcelParserService.java`
  - `backend/src/main/java/com/senviet/domain/dto/response/CukCukImportResponse.java`
- **Chức năng**:
  - `parseCukCukExcel`: Bóc tách doanh thu ca, số khách người lớn, trẻ em, gói vé tiêu chuẩn/VIP.
  - `generateSampleCukCukExcel`: Tự động tạo file Excel mẫu POS CukCuk để kiểm thử với 1-click.
- **Trạng thái**: ✅ Hoàn thành, kiểm tra curl nạp file thành công 155 khách và 42.5 triệu doanh thu.

#### Task 3.3: Động Cơ Tính Toán 6 Công Thức Đối Soát Tự Động
- **Tập tin**:
  - `backend/src/main/java/com/senviet/service/ReconciliationCalculationService.java`
  - `CalculationFormulaInput.java`, `CalculationFormulaResult.java`
  - `backend/src/test/java/com/senviet/ReconciliationCalculationServiceTest.java`
- **6 Công thức cốt lõi**:
  1. $\text{Xuất} = \text{Tồn đầu} + \text{Nhập} - \text{Tồn cuối}$
  2. $\text{Khách dùng} = (\text{Người lớn} + \text{Trẻ em} \times \text{Hệ số 0.5}) \times \text{Định mức chuẩn}$
  3. $\text{Hụt chế biến} = \text{Kg hụt thực tế từ các mẻ}$
  4. $\text{Hỏng có báo} = \text{Kg báo hỏng đã duyệt / tự động}$
  5. $\text{Lệch không rõ (Thất thoát)} = \text{Xuất} - \text{Khách dùng} - \text{Hụt} - \text{Hỏng}$
  6. $\text{Tiêu hao thực tế/khách} = (\text{Xuất} - \text{Hụt} - \text{Hỏng}) / \text{Tổng số khách}$
  - Ngưỡng cảnh báo: Thất thoát $> 300.000$ VNĐ hoặc Tỷ lệ lệch $> 5.0\% \rightarrow \text{isOverThreshold} = \text{true}$.
- **Trạng thái**: ✅ Hoàn thành, 3/3 Unit tests AssertJ passed.

#### Task 3.4: Backend API Bảng Cuối Ngày & Cảnh Báo Zalo
- **Tập tin**:
  - `backend/src/main/java/com/senviet/service/ZaloNotificationService.java`
  - `backend/src/main/java/com/senviet/service/ReconciliationService.java`
  - `backend/src/main/java/com/senviet/controller/ReconciliationController.java` (`GET /daily-summary`)
- **Trạng thái**: ✅ Hoàn thành, API trả về 3 món (Cua Cà Mau lệch 4.4kg = 1.54M đ -> BÁO ĐỎ; Ghẹ Phú Quốc lệch 1.6kg = 448k đ -> BÁO ĐỎ; Ba chỉ bò -> Chuẩn xanh).

#### Task 3.5: Backend API Báo Cáo Tỷ Lệ Hỏng Theo Nhà Cung Cấp
- **Tập tin**:
  - `SupplierLossResponse.java`
  - `ReconciliationController.java` (`GET /supplier-loss-report`)
- **Trạng thái**: ✅ Hoàn thành, trả về danh sách NCC xếp giảm dần theo % hỏng.

#### Task 3.6: Frontend Dashboard Đối Soát & Xuất Báo Cáo Excel
- **Tập tin**:
  - `frontend/src/api/reconciliation.ts`
  - `frontend/src/components/reconciliation/ReconciliationModule.tsx`:
    - 4 Thẻ KPI tổng hợp (Doanh thu POS, Khách dùng, Món báo đỏ, Tiền thất thoát).
    - Tab 1: Bảng 6 công thức đối soát cuối ngày, tự động tô đỏ dòng vượt ngưỡng, hiển thị người kiểm kho, nút Xuất Excel.
    - Tab 2: Nạp file Excel CukCuk kéo thả, kèm nút tải file mẫu và hiển thị kết quả phân tích.
    - Tab 3: Báo cáo tỷ lệ hỏng theo NCC với badge % hỏng và tiền thất thoát.
  - Tích hợp vào `DesktopShell.tsx` và `App.tsx`.
- **Trạng thái**: ✅ Hoàn thành, TypeScript & Vite build thành công trong 1.59s, Docker Nginx container phục vụ mượt mà.

---

### 3. Kết Quả Kiểm Thử (Verification Summary)
- Backend Unit Tests: 7/7 Tests Passed (`KitchenServiceTest`: 3, `ReconciliationCalculationServiceTest`: 3, `RestaurantApplicationTests`: 1).
- Frontend Build: `npm run build` không có cảnh báo/lỗi TypeScript nào (0 errors).
- End-to-End API Test: Đăng nhập bằng `ketoan_thainguyen` (`ROLE_BRANCH_ACCOUNTANT`), gọi thành công các endpoints `/daily-summary`, `/supplier-loss-report`, `/cukcuk/sample`, `/cukcuk/upload`, `/export-excel`.
