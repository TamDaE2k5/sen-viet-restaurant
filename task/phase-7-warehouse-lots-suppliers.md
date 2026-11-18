# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 7 (PHASE 7)
## Phân Hệ Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp (Warehouse, Lots & Suppliers)

> **Căn cứ**: Mục 1.1, 1.2, 3.4 trong [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md)  
> **Mục tiêu**: Xây dựng nền tảng quản lý kho độc lập kế thừa Giai đoạn 1: Phiếu nhập/xuất/huỷ, lô hàng (Batch/Lot tracking), quản lý Nhà cung cấp và báo cáo % hỏng theo nhà cung cấp.

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [x] **Task 7.1: Thiết kế Sơ đồ CSDL & Flyway Migration `V7__warehouse_lots_and_suppliers.sql`**
  - Tạo bảng `suppliers`: `id`, `supplier_code`, `supplier_name`, `phone`, `address`, `status`.
  - Tạo bảng `import_batches` (Lô nhập): `id`, `batch_code`, `supplier_id`, `item_id`, `branch_id`, `import_date`, `expiry_date`, `initial_quantity`, `current_stock`, `unit_price`, `unit`.
  - Tạo bảng `warehouse_documents`: `id`, `doc_type` (`NHAP`, `XUAT_CHUYEN`, `HUY`, `KIEM_KE`), `doc_code`, `branch_id`, `supplier_id`, `created_by`, `status`, `note`, `total_amount`.
  - Tạo bảng `warehouse_document_items`: `id`, `document_id`, `item_id`, `batch_id`, `quantity`, `unit_price`.
  - Tạo bảng `inventory_stocks`: `id`, `branch_id`, `item_id`, `batch_id`, `quantity`, `last_updated_at`.
  - Tạo bảng `inventory_checks`: `id`, `check_code`, `branch_id`, `shift`, `check_date`, `checked_by`, `status`, `note`.
  - Tạo bảng `inventory_check_items`: `id`, `check_id`, `item_id`, `batch_id`, `system_stock`, `actual_stock`, `difference`, `reason`.
  - Tạo bảng `recipe_ingredients`: Định nghĩa tỷ lệ nhiều nguyên liệu cấu thành 1 món hoàn chỉnh.

- [x] **Task 7.2: Triển Khai JPA Entities, Repositories & DTOs Phân Hệ Kho**
  - Entity: `Supplier`, `ImportBatch`, `WarehouseDocument`, `WarehouseDocumentItem`, `InventoryStock`, `InventoryCheck`, `InventoryCheckItem`, `RecipeIngredient`.
  - Repositories với các query tối ưu (tránh N+1 query bằng `JOIN FETCH`).
  - DTOs: `CreateDocumentRequest`, `DocumentResponse`, `InventoryCheckRequest`, `SupplierLossReportDto`.

- [x] **Task 7.3: Backend Service & API Quản Lý Phiếu Nhập / Xuất / Huỷ Kho**
  - `POST /api/v1/warehouse/documents`: Tạo phiếu nhập kho/xuất huỷ, tự động sinh mã phiếu, cập nhật tồn kho tức thời (`inventory_stocks`), sinh lô nhập mới (`import_batches`).
  - Hỗ trợ đính kèm tối đa 5 ảnh hóa đơn/chứng từ nhập hàng.
  - `GET /api/v1/warehouse/batches/available`: Lấy danh sách lô nhập còn tồn theo mặt hàng và chi nhánh.

- [x] **Task 7.4: Backend Service & API Kiểm Kê Kho Đầu Ca / Cuối Ca**
  - `POST /api/v1/warehouse/inventory-checks`: Tạo biên bản kiểm kê, tự động đối soát số lượng tồn thực tế so với tồn hệ thống.
  - Bắt buộc ghi nhận lý do chênh lệch khi `actual_stock != system_stock`.
  - Tích hợp số liệu tồn kiểm kê vào công thức tính toán Bảng cuối ngày (I.5).

- [x] **Task 7.5: Báo Cáo % Hỏng Theo Nhà Cung Cấp & Lô Nhập (Supplier Loss Report)**
  - `GET /api/v1/warehouse/reports/supplier-loss`: Lọc theo tháng, chi nhánh, mặt hàng.
  - Tính toán: Cột `Kg nhập`, `Kg hỏng`, `% Hỏng = (Kg hỏng / Kg nhập) * 100%`.
  - Sắp xếp giảm dần theo `% Hỏng` (nhà cung cấp hỏng nhiều nhất lên đầu).
  - Xuất file Excel báo cáo chuẩn định dạng POI phục vụ đối soát và khiếu nại.
  - Liên kết cua chết huỷ theo lô nhập: Nhân viên quét mã hoặc chọn lô hàng khi báo hỏng cua chết để truy vết chính xác NCC.

- [x] **Task 7.6: Frontend Giao Diện Quản Trị Kho, Lô Nhập & Báo Cáo NCC**
  - Màn hình Tạo phiếu nhập kho (Desktop & Tablet) có tải ảnh hóa đơn.
  - Màn hình Kiểm kê kho cuối ca (Mobile & Desktop) với bảng nhập nhanh tồn thực tế và lý do lệch.
  - Bảng Báo cáo % Hỏng theo Nhà Cung Cấp kèm biểu đồ xếp hạng và nút tải Excel.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. Tạo phiếu nhập 100 kg cua Cà Mau từ NCC "Hải Sản Quảng Ninh" -> Hệ thống tự sinh Lô nhập `LOT-202611-001`, cộng 100 kg vào tồn kho.
2. Báo hỏng cua chết: Chọn được lô `LOT-202611-001` -> Trừ tồn của lô đó và ghi nhận lượng hỏng vào báo cáo của NCC "Hải Sản Quảng Ninh".
3. Biên bản kiểm kê kho ghi nhận đúng người kiểm, ca làm việc, thời gian và lý do lệch cho từng mặt hàng.
4. Báo cáo NCC hiển thị chính xác % hỏng và xuất file Excel không lỗi.
