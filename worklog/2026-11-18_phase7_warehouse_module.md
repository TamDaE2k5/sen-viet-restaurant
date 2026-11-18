# Nhật Ký Công Việc: Giai Đoạn 7 — Phân Hệ Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp (Warehouse, Lots & Suppliers)

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P7-WAREHOUSE` (Kho cơ sở, Quản lý Lô nhập, Nhà cung cấp, Kiểm kê ca & Báo cáo tỷ lệ hỏng NCC)  
**Tác giả thực hiện**: `@backend-dev`, `@frontend-dev`  
**Kiểm thử & Nghiệm thu**: `@verifier-2`  
**Nhánh Git**: `feature/p7-warehouse-lots-suppliers`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

Căn cứ theo mục 1.1, 1.2, 3.4 của tài liệu phản biện `phan_bien_va_gop_y_plan.md` và `task/phase-7-warehouse-lots-suppliers.md`:
1. **Quản lý Nhà cung cấp (Suppliers)**: Quản lý danh mục đối tác cung cấp hải sản, rau củ quả, thịt; theo dõi thông tin liên hệ, mã số thuế và trạng thái hoạt động.
2. **Quản lý Lô nhập hàng (Import Batches / Lots)**:
   - Tự động sinh mã lô định dạng `LOT-YYYYMM-XXX`.
   - Theo dõi số lượng nhập ban đầu (`initial_quantity`), tồn kho hiện tại theo lô (`current_stock`), đơn giá nhập và hạn sử dụng.
   - Quản lý tồn kho đa chiều theo `(branch_id, item_id, batch_id)`.
3. **Phiếu Kho & Chứng từ (Warehouse Documents)**:
   - Các loại phiếu: Nhập hàng (`NHAP`), Xuất chuyển (`XUAT_CHUYEN`), Xuất huỷ (`HUY`), Kiểm kê (`KIEM_KE`).
   - Tự động sinh mã phiếu `PN-YYYYMMDD-XXX`, `PX-YYYYMMDD-XXX`.
   - Hỗ trợ tải kèm tối đa 5 ảnh hóa đơn/chứng từ giao nhận được nén tự động trên trình duyệt.
4. **Kiểm Kê Kho Đầu Ca / Cuối Ca (Inventory Checks)**:
   - Biên bản kiểm kê theo ca (`CA_SANG`, `CA_TOI`, `CA_NGAY`).
   - Tự động so sánh số lượng thực tế với tồn hệ thống, tính toán chênh lệch.
   - **Quy tắc bắt buộc**: Phải nhập lý do giải trình khi phát hiện chênh lệch (`actual_stock != system_stock`), chặn HTTP 400 nếu bỏ trống.
   - Tự động đồng bộ số liệu kiểm kê thực tế vào bảng tồn kho và snapshot đối soát cuối ngày.
5. **Báo Cáo Tỷ Lệ Hỏng Theo Nhà Cung Cấp (Supplier Loss Report)**:
   - Công thức: $\text{Tỷ lệ hỏng (\%)} = \frac{\text{Kg hỏng}}{\text{Kg nhập}} \times 100\%$.
   - Sắp xếp giảm dần theo tỷ lệ hỏng (NCC hỏng nhiều nhất đứng đầu bảng).
   - Xuất file Excel định dạng chuẩn Apache POI (`.xlsx`) phục vụ khiếu nại và đối soát.
   - Liên kết cua chết huỷ với lô nhập: Cho phép nhân viên bếp quét hoặc chọn lô nhập khi báo hỏng cua để truy vết chính xác NCC cung ứng.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Cơ Sở Dữ Liệu & Flyway Migration (V7)
- **Tệp migration**: `backend/src/main/resources/db/migration/V7__warehouse_lots_and_suppliers.sql`
- **Bảng CSDL mới**:
  1. `suppliers`: Quản lý danh bạ NCC (`supplier_code`, `supplier_name`, `phone`, `address`, `tax_code`, `status`).
  2. `import_batches`: Quản lý lô hàng chi tiết (`batch_code`, `supplier_id`, `item_id`, `branch_id`, `initial_quantity`, `current_stock`, `unit_price`, `expiry_date`, `status`).
  3. `warehouse_documents`: Quản lý chứng từ nhập/xuất/huỷ (`doc_type`, `doc_code`, `branch_id`, `supplier_id`, `total_amount`, `image_urls`, `status`).
  4. `warehouse_document_items`: Chi tiết từng dòng hàng của phiếu kho (`document_id`, `item_id`, `batch_id`, `quantity`, `unit_price`).
  5. `inventory_stocks`: Quản lý tồn kho theo chi nhánh, mặt hàng và lô (`branch_id`, `item_id`, `batch_id`, `quantity`).
  6. `inventory_checks`: Biên bản kiểm kê kho theo ca (`check_code`, `branch_id`, `shift`, `check_date`, `checked_by_user_id`, `status`).
  7. `inventory_check_items`: Chi tiết mặt hàng kiểm kê (`system_stock`, `actual_stock`, `difference`, `reason`).
  8. `recipe_ingredients`: Tỷ lệ thành phần nguyên liệu cấu thành món ăn.
  - Bổ sung trường `batch_id` và `supplier_id` vào bảng `damage_reports` để truy vết nguồn gốc con hàng hỏng.
  - Nạp dữ liệu mẫu ban đầu: 4 nhà cung cấp (`NCC-QN01`, `NCC-CM02`, `NCC-HN03`, `NCC-DL04`) và 2 lô hàng mẫu (`LOT-202611-001`, `LOT-202611-002`).

### 2.2. Backend (Java 17, Spring Boot 3, Hibernate JPA, Apache POI)
- **Entities & Repositories**:
  - `Supplier`, `ImportBatch`, `WarehouseDocument`, `WarehouseDocumentItem`, `InventoryStock`, `InventoryCheck`, `InventoryCheckItem`, `RecipeIngredient`.
  - Repositories: `SupplierRepository`, `ImportBatchRepository`, `WarehouseDocumentRepository`, `WarehouseDocumentItemRepository`, `InventoryStockRepository`, `InventoryCheckRepository`, `InventoryCheckItemRepository`, `RecipeIngredientRepository`.
- **Services**:
  - `WarehouseService`: Tự động sinh mã chứng từ/lô, tạo phiếu nhập/xuất/huỷ kho, cập nhật tồn kho đa chiều, tính toán báo cáo hỏng theo NCC và xuất file Excel POI.
  - `InventoryCheckService`: Lập biên bản kiểm kê ca, kiểm soát validation lý do chênh lệch, cập nhật tồn thực tế, đồng bộ snapshot cuối ngày.
  - `SupplierService`: Nghiệp vụ quản lý danh mục và tra cứu thông tin NCC.
  - `KitchenService`: Nâng cấp hàm báo hỏng `recordDamageReport` hỗ trợ liên kết `batchId`, tự động trừ tồn kho của lô nhập và gắn mã NCC.
- **Controllers & RBAC**:
  - `WarehouseController` (`/api/v1/warehouse/*`) và `SupplierController` (`/api/v1/suppliers/*`) với đầy đủ `@PreAuthorize` theo 5 vai trò nghiệp vụ.

### 2.3. Frontend (React 18, TypeScript, Tailwind CSS, Lucide Icons)
- **API Client**: `frontend/src/api/warehouse.ts` cung cấp đầy đủ hàm gọi API quản trị kho, phiếu kho, lô hàng, kiểm kê ca, báo cáo NCC và tải file Excel blob.
- **Giao diện người dùng**:
  - `frontend/src/components/warehouse/WarehouseModule.tsx` gồm 5 tab chức năng:
    1. *Phiếu Kho & Chứng Từ*: Tạo phiếu nhập/xuất/huỷ, chọn NCC, nén ảnh tự động, xem chi tiết chứng từ.
    2. *Lô Hàng & Tồn Kho*: Danh sách lô hàng chi tiết, theo dõi tồn ban đầu vs hiện tại, thanh trạng thái tồn kho.
    3. *Quản Lý Nhà Cung Cấp*: Thêm mới/sửa thông tin đối tác, bộ lọc trạng thái và tìm kiếm nhanh.
    4. *Kiểm Kê Đầu/Cuối Ca*: Nhập tồn thực tế theo ca, tự tính độ lệch, bắt buộc nhập lý do khi lệch.
    5. *Báo Cáo % Hỏng NCC*: Bảng xếp hạng giảm dần, chỉ số trực quan, thanh % hỏng phân cấp màu sắc và nút xuất Excel.
  - Cập nhật modal báo hỏng trong `KitchenModule.tsx` cho phép chọn trực tiếp lô hàng đang tồn (`LOT-202611-001`).
  - Tích hợp điều hướng trong `DesktopShell.tsx` và `Dashboard.tsx`.

---

## 3. Hoàn Thiện & Sửa Lỗi Trong Quá Trình Kiểm Thử (Verification Hardening)

1. **Khắc phục lỗi kiểu dữ liệu tham số null trên PostgreSQL**:
   - *Hiện tượng*: Khi tra cứu `Supplier` hoặc `InventoryCheck` với các trường lọc không bắt buộc (`shift`, `keyword`, `date`), PostgreSQL báo lỗi `ERROR: could not determine data type of parameter` hoặc `ERROR: function lower(bytea) does not exist`.
   - *Khắc phục*: Tinh chỉnh `SupplierService` phân tách nhánh tìm kiếm rõ ràng và bổ sung cú pháp ép kiểu tường minh `cast(:param as string)`, `cast(:param as long)`, `cast(:param as date)` trong JPQL repository queries.
2. **Khắc phục lỗi Hibernate Orphan Removal**:
   - *Hiện tượng*: Khi lưu biên bản kiểm kê, Hibernate ném ngoại lệ `A collection with cascade="all-delete-orphan" was no longer referenced`.
   - *Khắc phục*: Thay vì gán lại tham chiếu danh sách `savedCheck.setItems(...)`, sử dụng `savedCheck.getItems().clear()` và `addAll(items)` để duy trì đúng collection wrapper của Hibernate.

---

## 4. Kết Quả Nghiệm Thu Thực Tế (Acceptance Criteria Verification)

| Tiêu chí | Mô tả nghiệm thu | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| **Tiêu chí 1** | Tạo phiếu nhập 100 kg cua Cà Mau từ NCC "Hải Sản Quảng Ninh" $\rightarrow$ Tự sinh mã lô, tăng 100 kg vào tồn kho. | Gửi `POST /api/v1/warehouse/documents` loại `NHAP`, hệ thống tự sinh mã phiếu `PN-20261118-001`, sinh lô `LOT-202611-003`, ghi nhận 100 kg tồn kho cho chi nhánh Thái Nguyên. | ✅ ĐẠT |
| **Tiêu chí 2** | Báo hỏng cua chết: Chọn lô `LOT-202611-001` $\rightarrow$ Trừ tồn của lô đó và ghi nhận lượng hỏng vào báo cáo của NCC "Hải Sản Quảng Ninh". | Báo hỏng 5 kg cua chết với `batchId = 1`, tồn của `LOT-202611-001` lập tức giảm từ 95 kg xuống 90 kg; đơn báo hỏng được gán NCC `NCC-QN01`. | ✅ ĐẠT |
| **Tiêu chí 3** | Biên bản kiểm kê kho ghi nhận đúng người kiểm, ca làm việc, thời gian và lý do lệch cho từng mặt hàng. | Thử nghiệm không nhập lý do khi lệch $\rightarrow$ Bị chặn 400 Bad Request; khi nhập lý do, biên bản `KK-20261118-001` lưu đúng người kiểm Trần Quản Lý, ca `CA_TOI`, chênh lệch -1.5 kg và lý do hợp lệ. | ✅ ĐẠT |
| **Tiêu chí 4** | Báo cáo NCC hiển thị chính xác % hỏng và xuất file Excel không lỗi. | Báo cáo `GET /api/v1/warehouse/reports/supplier-loss` tính đúng % hỏng của NCC-QN01 là 2.50% (5 kg / 200 kg), xếp hạng 1; xuất file Excel POI `Bao_Cao_Ty_Le_Hong_NCC_Tat_Ca.xlsx` (HTTP 200, Content-Type `.sheet`, giải nén kiểm tra toàn vẹn không lỗi). | ✅ ĐẠT |

---

## 5. Kết Quả Build & Kiểm Thử Tự Động

- **Backend Unit & Integration Tests**: **24/24 tests passed (100%)**
  - `AttendanceServiceTest`: 4/4 passed
  - `InventoryCheckServiceTest`: 2/2 passed
  - `KitchenServiceTest`: 3/3 passed
  - `PayrollCalculationServiceTest`: 3/3 passed
  - `ReconciliationCalculationServiceTest`: 3/3 passed
  - `RestaurantApplicationTests`: 1/1 passed
  - `SupplierServiceTest`: 3/3 passed
  - `WarehouseServiceTest`: 5/5 passed
- **Frontend Production Build**: `tsc && vite build` hoàn thành trong **1.74 giây**, 0 lỗi TypeScript, 0 lỗi lint.
- **Docker Compose Containers**: Cả 3 containers (`senviet-postgres`, `senviet-backend`, `senviet-frontend`) đều ở trạng thái `Up (healthy)`.
- **Bảo mật Git Audit**: Không có file bí mật/tài liệu nội bộ rò rỉ.
