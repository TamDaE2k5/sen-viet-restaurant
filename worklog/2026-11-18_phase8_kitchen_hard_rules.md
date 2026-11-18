# Nhật Ký Công Việc: Giai Đoạn 8 — Quy Tắc Chặt Chẽ Bếp, Món Dùng Trong Ngày & Thêm Nhanh Ra Line

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P8-KITCHEN-HARD-RULES` (Quy tắc chặn cứng mẻ hỏng chưa duyệt, Món tươi chỉ dùng trong ngày, Ra line bất biến & Quick add món mới)  
**Tác giả thực hiện**: `@backend-dev`, `@frontend-dev`  
**Kiểm thử & Nghiệm thu**: `@verifier-2`  
**Nhánh Git**: `feature/p8-kitchen-hard-rules`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

Thực thi triệt để các phản biện nghiệp vụ cốt lõi tại khu vực Bếp (Căn cứ mục 1.3, 1.4, 2.4, 3.1, 3.4 trong `phan_bien_va_gop_y_plan.md`):
1. **Chặn cứng mẻ hỏng chưa duyệt**: Khi một món ăn tại chi nhánh có báo hỏng đang chờ duyệt (`CHO_DUYET`), hệ thống kiên quyết không cho phép tạo mẻ chế biến mới cho món đó (trả về HTTP 422 Unprocessable Entity kèm thông báo rõ ràng). Ngăn ngừa nhân viên cố ý mở mẻ mới nhằm che giấu hao hụt mẻ trước.
2. **Quy trình xử lý món tươi dùng trong ngày cuối ca**: Quét và liệt kê các món chỉ dùng trong ngày (`is_daily_only = true`), nhân viên xác nhận ghi bỏ cuối ca, hạch toán vào cột "Hỏng/bỏ có báo" của Bảng cuối ngày nhưng không tính phạt nhân viên.
3. **Bất biến nghiệp vụ nút Ra Line (+1)**: Khẳng định nút Ra line chỉ dùng để đếm khay theo dõi tần suất ra quầy buffet đối soát với POS CukCuk, tuyệt đối không trừ kho nguyên liệu.
4. **Thêm nhanh món mới ra line (Quick Add)**: Bổ sung món ăn vào quầy line tức thì ngay trong ca mà không cần truy cập trang Cấu hình Admin.
5. **Tách riêng hao hụt chế biến**: Trong bảng tính đối soát cuối ngày, hao hụt chế biến được ghi nhận độc lập, không cộng dồn vào tỷ lệ ăn của khách hàng.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Cơ Sở Dữ Liệu & Flyway Migration (V8)
- **Tệp migration**: `backend/src/main/resources/db/migration/V8__kitchen_rules_and_daily_items.sql`
- **Thay đổi cấu trúc**:
  - Bổ sung cột `is_daily_only` (`BOOLEAN DEFAULT FALSE`) vào bảng `items`.
  - Nạp cờ `is_daily_only = true` cho Kim Chi Cải Thảo (`KIM_CHI`), Salad Nga (`SALAD_NGA`), Bánh Bao Thịt Hấp (`BANH_BAO_THIT`).
  - Tạo bảng `daily_waste_confirmations` (`id`, `branch_id`, `item_id`, `waste_date`, `shift`, `quantity`, `unit`, `confirmed_by_user_id`, `status`, `note`, `created_at`).
  - Thiết lập chỉ mục `idx_daily_waste_branch_date` tối ưu hóa tra cứu theo chi nhánh và ngày.

### 2.2. Backend Services & Controllers
- **Hard Rule Chặn Mẻ Hỏng**:
  - `KitchenService.startBatch()`: Kiểm tra `damageReportRepository.existsByBranchIdAndItemIdAndStatus(branchId, itemId, "CHO_DUYET")`. Nếu phát hiện, ném `UnapprovedDamageReportException` (HTTP 422).
  - Tích hợp vào `GlobalExceptionHandler` ánh xạ về HTTP 422 với thông điệp: *"Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!"*.
- **Daily Waste APIs**:
  - `GET /api/v1/kitchen/daily-only/remaining`: Quét các món tươi `is_daily_only = true` và số lượng tồn kho hiện tại.
  - `POST /api/v1/kitchen/daily-only/confirm-waste`: Lưu biên bản hủy bỏ cuối ca, trừ kho tương ứng và hạch toán vào hàng hỏng/bỏ có báo.
- **Quick Add Line Item API**:
  - `POST /api/v1/kitchen/line-items/quick-add`: Cho phép thêm nhanh món mới vào menu ra line với mã món tự sinh hoặc chỉ định.
- **Kiểm toán code Ra Line**:
  - Phương thức `recordLineItem` và `incrementLineTray` được bổ sung Javadoc chi tiết khẳng định nguyên tắc bất khả xâm phạm: chỉ ghi log vào `line_item_logs`, không trừ kho nguyên liệu.

### 2.3. Frontend (React 18 & TypeScript)
- **Modal Cảnh Báo Đỏ Chặn Cứng (HTTP 422)**:
  - Bắt lỗi HTTP 422 khi bấm "Bắt đầu mẻ mới" trên `KitchenModule.tsx`, hiển thị Modal cảnh báo màu đỏ nổi bật `CẢNH BÁO CHẶN CỨNG: BÁO HỎNG CHỜ DUYỆT`.
- **Drawer Chốt Ca Món Dùng Trong Ngày**:
  - Nút "Chốt món dùng trong ngày" trên giao diện Bếp mở giao diện nhập số lượng ghi bỏ cho các món salad, bánh bao, nộm; hiển thị ghi chú không tính phạt nhân viên.
- **Nút [+ Thêm món nhanh] trên Sổ Ra Line**:
  - Form thêm món nhanh trực tiếp trên màn hình Ra Line, cập nhật tức thời vào danh sách nút bấm `+1`.

---

## 3. Kết Quả Nghiệm Thu Thực Tế (Acceptance Criteria Verification)

| Tiêu chí | Mô tả nghiệm thu | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| **Tiêu chí 1** | Báo hỏng 2 kg Cua Cà Mau (giá trị 700k $\rightarrow$ chờ duyệt) $\rightarrow$ Bấm mở mẻ mới cho Cua Cà Mau $\rightarrow$ Hệ thống chặn ngay lập tức, trả về lỗi HTTP 422. | Gọi `POST /api/v1/kitchen/processing/start` cho món Cua Cà Mau $\rightarrow$ Phản hồi HTTP 422 Unprocessable Entity kèm thông báo *"Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!"*. | ✅ ĐẠT |
| **Tiêu chí 2** | Quản lý duyệt đơn báo hỏng $\rightarrow$ Nhân viên được phép tạo mẻ mới bình thường. | Quản lý gọi `PUT /api/v1/kitchen/damage-reports/5/approve` chuyển trạng thái sang `DA_DUYET`. Nhân viên bếp tạo lại mẻ mới cho Cua Cà Mau $\rightarrow$ Thành công HTTP 200, mã mẻ `ME-69078`. | ✅ ĐẠT |
| **Tiêu chí 3** | Cuối ca, giao diện gợi ý danh sách Salad, Kim chi còn tồn; nhân viên xác nhận ghi bỏ $\rightarrow$ Ghi nhận vào cột Hỏng/bỏ có báo. | Gọi `GET /api/v1/kitchen/daily-only/remaining` hiển thị danh sách Kim Chi, Salad Nga, Bánh Bao. Gọi `POST /api/v1/kitchen/daily-only/confirm-waste` ghi nhận bỏ 3.5 kg Kim Chi ca tối thành công. | ✅ ĐẠT |
| **Tiêu chí 4** | Bấm `+1` ra line 10 lần $\rightarrow$ Tồn kho nguyên liệu không đổi; bảng `line_item_logs` tăng thêm 10 bản ghi. | Thực hiện bấm `+1` ra line 10 lần liên tiếp: `line_item_logs` tăng từ 6 lên 16 bản ghi (+10); tổng tồn kho nguyên liệu trong `inventory_stocks` giữ nguyên 188.500 kg (không hao hụt 1 gram nào). | ✅ ĐẠT |
| **Tiêu chí 5** | Thêm nhanh món mới "Nộm hoa chuối tai heo" ngay tại quầy $\rightarrow$ Món lập tức xuất hiện trong danh sách ra line để bấm `+1`. | Gọi `POST /api/v1/kitchen/line-items/quick-add` tạo món ID 9 "Nộm hoa chuối tai heo". Bấm ngay `POST /api/v1/kitchen/line-items/inc` cho món ID 9 $\rightarrow$ Thành công HTTP 200, tạo bản ghi ra line log ID 22. | ✅ ĐẠT |

---

## 4. Kiểm Thử Tự Động & Đóng Gói

- **Backend Unit Tests**: **30/30 tests passed (100%)** trên `mvn test`:
  - `AttendanceServiceTest`: 4/4
  - `InventoryCheckServiceTest`: 2/2
  - `KitchenServiceTest`: 8/8 (kiểm thử chặn mẻ hỏng 422, duyệt mẻ mở lại, hủy món trong ngày, thêm nhanh ra line, kiểm toán không trừ kho)
  - `PayrollCalculationServiceTest`: 3/3
  - `ReconciliationCalculationServiceTest`: 4/4 (kiểm thử tách độc lập hao hụt chế biến khỏi tỷ lệ ăn của khách)
  - `RestaurantApplicationTests`: 1/1
  - `SupplierServiceTest`: 3/3
  - `WarehouseServiceTest`: 5/5
- **Frontend Production Build**: `tsc && vite build` hoàn thành trong **1.77 giây**, 0 lỗi TypeScript, 0 cảnh báo.
- **Docker Compose Containers**: Hệ thống 3 container vận hành ổn định, healthcheck đạt chuẩn.
- **Git Security Audit**: Đã cập nhật `.gitignore` với `senviet_project_docs*/`, không rò rỉ bí mật.
