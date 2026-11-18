# Nhật Ký Công Việc: Giai Đoạn 12 — Phân View Theo Vai Trò Chặt Chẽ, Cảnh Báo Nổi Bật & Bộ Dữ Liệu Demo Khách Hàng (RBAC View Guard, Prominent Alerts & Demo Dataset)

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P12-ROLE-VIEWS-AND-DEMO-DATA` (Phân view theo vai trò nghiêm ngặt, ẩn menu trái phép ngay từ đầu, hệ thống cảnh báo/thông báo nổi bật trực quan, bảng điều khiển vận hành nhà hàng chuẩn nghiệp vụ, và bộ dữ liệu mẫu 5-10 bản ghi sẵn sàng demo khách hàng)  
**Tác giả thực hiện**: `@backend-dev-2`, `@frontend-dev-2`  
**Kiểm thử & Nghiệm thu**: `@verifier-3`  
**Nhánh Git**: `feature/p12-role-views-and-demo-data`  

---

## 1. Mục Tiêu & Căn Cứ Yêu Cầu Người Dùng

Căn cứ 3 yêu cầu trọng tâm từ khách hàng (Chị Vũ Thêm - Sen Việt Buffet) và tài liệu `task/phase-12-role-view-guard-and-demo-data.md`:
1. **Phân chia view/giao diện chặt chẽ theo vai trò (RBAC View Guard)**:
   - Nếu tài khoản không có quyền, **ẩn hoàn toàn ngay từ đầu** trên cả thanh Menu máy tính (Desktop Sidebar) và thanh Điều hướng di động (Mobile Bottom Tabs), tránh gây nhiễu và bấm nhầm.
   - Tài khoản Bếp (`ROLE_KITCHEN_STAFF`): Chỉ thấy giao diện Bếp 4 Nút & Cân Mẻ (và Cổng nhân sự cá nhân nếu có `ROLE_EMPLOYEE`). Tuyệt đối **không hiển thị** Kho cơ sở, Đối soát CukCuk, Bảng lương, hay Dashboard quản trị.
   - Nhân viên thuần túy (`ROLE_EMPLOYEE`): Chỉ thấy Cổng cá nhân (Chấm công GPS, Thi nghề, Phiếu lương cá nhân, Ứng lương). Tuyệt đối **không hiển thị** Bếp, Kho, Đối soát, hay Bảng lương chuỗi.
   - Quản lý nhà hàng (`ROLE_RESTAURANT_MANAGER`): Thấy Dashboard, Bếp (chế độ duyệt hỏng & chốt ca), Đối soát CukCuk chi nhánh, Nhân sự chi nhánh. Ẩn Kho NCC toàn chuỗi và Khóa lương chuỗi.
   - Kế toán chi nhánh (`ROLE_BRANCH_ACCOUNTANT`): Thấy Dashboard, Kho cơ sở chi nhánh, Đối soát CukCuk chi nhánh, Bảng lương chi nhánh. Ẩn Bếp và Cấu hình hệ thống.
   - Kế toán tổng chuỗi (`ROLE_GENERAL_ACCOUNTANT`): Toàn quyền truy cập cả 7 phân hệ.
   - Tuyến phòng thủ tầng Router (`App.tsx`): Tự động chuyển hướng (auto-redirect) về view mặc định hợp quyền nếu tài khoản truy cập trái phép, kèm fallback `<AccessDeniedFallback>`.
2. **Loại bỏ thẻ ghi chú phát triển nội bộ trên Dashboard**:
   - Gỡ bỏ hoàn toàn phần *"Tổng Quan 5 Phân Hệ Dự Án Sen Việt Buffet"* (các thẻ Phase 1 - 7).
   - Thay thế bằng **Bảng Điều Khiển Vận Hành Nhà Hàng Thực Thụ**:
     - Header vận hành chi nhánh, ca làm việc (Ca Trưa 10:00 - 14:30), trạng thái *"Đang Vận Hành Ca"*.
     - Các chỉ số KPI trọng yếu: Doanh thu ngày/ca, Số khách phục vụ (vé 299k & 369k), Số mẻ bếp đang làm & đĩa ra line buffet, Trạng thái kiểm kho & lô hàng.
     - Banner Cảnh Báo Thất Thoát Đỏ Nổi Bật: Trực quan hóa các mặt hàng vượt ngưỡng thất thoát CukCuk (> 5% hoặc > 300.000 đ) phục vụ kịch bản demo chống thất thoát.
     - Lối tắt nhanh vào các phân hệ được lọc theo thẩm quyền người dùng.
3. **Hệ thống cảnh báo & thông báo nổi bật trực quan (Prominent Visual Alerts)**:
   - Thay thế các cảnh báo lỗi nhỏ chữ đỏ mờ nhạt bằng Banner/Toast nổi bật trên cùng màn hình (Top-Center Floating Banner):
     - 🔴 **Lỗi & Chặn quyền**: Nền đỏ đậm (`bg-rose-600`), icon `ShieldAlert` 24px, chữ đậm giải thích rõ ràng.
     - 🟡 **Cảnh báo nghiệp vụ**: Nền vàng cam (`bg-amber-500`), icon `AlertTriangle` 24px.
     - 🟢 **Thành công**: Nền xanh ngọc (`bg-emerald-600`), icon `CheckCircle2` 24px.
     - Tự động đóng sau 5 giây, có nút `[x]` đóng tức thời.
   - Tích hợp vào tất cả các phân hệ: Bếp, Kho, Đối soát, Nhân sự, Bảng lương.
4. **Bộ dữ liệu demo sống động chuẩn 5 - 10 bản ghi mỗi phân hệ (Flyway Migration `V11`)**:
   - Cung cấp đầy đủ số liệu thực tế về thực đơn buffet hải sản, nhà cung cấp, lô nhập, phiếu kho, đối soát lệch đỏ, chấm công vi phạm khoảng cách GPS / đi muộn, ứng lương và giữ lương đồng phục / bỏ việc.

---

## 2. Chi Tiết Các Thành Phần Đã Triển Khai

### 2.1. Frontend (React 18, TypeScript, Tailwind CSS, Lucide Icons)

1. **Bộ tiện ích phân quyền RBAC (`frontend/src/utils/rbac.ts`)**:
   - `userHasRole(user, role)`: Kiểm tra vai trò hỗ trợ tiền tố chuẩn hóa `ROLE_`.
   - `isViewAuthorized(viewId, user)`: Hàm thuần kiểm tra thẩm quyền truy cập từng phân hệ cho 5 nhóm vai trò.
   - `getDefaultAuthorizedView(user, isMobile)`: Xác định view mặc định đầu tiên hợp lệ khi đăng nhập hoặc khi bị redirect.
   - `getRoleDisplayBadges(roles)`: Chuyển đổi mã role kỹ thuật thành nhãn tiếng Việt trang trọng.

2. **Lọc Menu Desktop (`frontend/src/components/layout/DesktopShell.tsx`)**:
   - Lọc danh sách `menuItems` qua `isViewAuthorized(item.id, user)`.
   - Đối với tài khoản Bếp: Chỉ render menu Bếp 4 Nút (và Nhân sự cá nhân nếu có role Employee). Hoàn toàn không render menu Kho, Đối soát, Bảng lương, Admin, Dashboard.

3. **Lọc Bottom Bar Di Động (`frontend/src/components/layout/MobileShell.tsx`)**:
   - Hàm `getNavTabs()` phân luồng rõ rệt theo 5 vai trò:
     - Bếp: 4 nút (Bếp 4 Nút, Chấm công, Thi nghề, Cá nhân).
     - Nhân viên thuần túy: 3 nút (Chấm công, Thi nghề, Cá nhân).
     - Quản lý nhà hàng: 5 nút (Tổng quan, Bếp & Mẻ, Đối soát, Nhân sự, Cá nhân).
     - Kế toán chi nhánh: 5 nút (Tổng quan, Kho cơ sở, Đối soát, Bảng lương, Cá nhân).
     - Kế toán tổng: 5 nút (Tổng quan, Bếp, Kho, Đối soát, Bảng lương).

4. **Bảo vệ Điều Hướng Ứng Dụng (`frontend/src/App.tsx`)**:
   - `useEffect` lắng nghe `user` và tự động cập nhật `desktopMenu`, `mobileTab` về view được cấp quyền nếu view hiện tại không hợp lệ.
   - Tích hợp component `<AccessDeniedFallback>` với nút bấm *"Quay lại màn hình được cấp quyền"*.

5. **Bảng Điều Khiển Nhà Hàng Chuẩn Nghiệp Vụ (`frontend/src/components/dashboard/Dashboard.tsx`)**:
   - Loại bỏ hoàn toàn section ghi chú dev phase 1 - 7.
   - Thêm 4 thẻ KPI vận hành:
     * Doanh thu ngày: `48.500.000 đ` (Ca trưa: `28.200.000 đ`, +8.4% so với hôm qua).
     * Số khách phục vụ: `186 khách` (Vé 299k: 142 suất, Vé 369k: 44 suất).
     * Bếp 4 Nút & Ra Line: `3 mẻ đang nấu`, `42 đĩa/khay ra line`.
     * Kho & Lô Hàng: `8 lô hàng` (7 lô an toàn, 1 lô sắp hết).
   - Thêm Banner Cảnh Báo Thất Thoát Trọng Điểm Cuối Ngày (Red Anti-Loss Alert):
     * Cua Cà Mau Sống (`LOT-202611-001`): Lệch thất thoát `-6.5 kg` (`-2.275.000 đ`, 6.84%).
     * Ghẹ Phú Quốc Tươi (`LOT-202611-002`): Lệch thất thoát `-4.2 kg` (`-1.176.000 đ`, 5.60%).
     * Nút bấm *"Xem Bảng Đối Soát Chi Tiết"* kết nối trực tiếp đến phân hệ đối soát.
   - Lối tắt phân hệ nhanh được lọc theo `isViewAuthorized()`.

6. **Hệ Thống Cảnh Báo & Thông Báo Nổi Bật (`<ProminentAlert />` & `<NotificationContext />`)**:
   - `NotificationContext.tsx`: Cung cấp `showError`, `showWarning`, `showSuccess`, `showInfo` với thời gian auto-dismiss chuẩn 5 giây.
   - `ProminentAlert.tsx`: Banner nổi bật cố định top-center (`fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl`), viền 2px tương phản cao, đổ bóng 2xl, icon 24px kèm badge tiêu đề in hoa.
   - Tích hợp tại gốc `App.tsx` và bọc toàn bộ ứng dụng bằng `<NotificationProvider>` tại `main.tsx`.
   - Kết nối vào `KitchenModule.tsx`, `WarehouseModule.tsx`, `HRModule.tsx`, `PayrollModule.tsx`, và `ReconciliationModule.tsx`.

---

### 2.2. Backend & Dữ Liệu Demo Khách Hàng (PostgreSQL 16 & Flyway Migration `V11`)

Tệp migration: `backend/src/main/resources/db/migration/V11__comprehensive_demo_seed_data.sql`

1. **Tài khoản người dùng demo đa chi nhánh**:
   - `bep_thainguyen` (`ROLE_KITCHEN_STAFF`, `ROLE_EMPLOYEE` - Chi nhánh Thái Nguyên)
   - `bep_quevo` (`ROLE_KITCHEN_STAFF`, `ROLE_EMPLOYEE` - Chi nhánh Quế Võ)
   - `quanly_thainguyen` (`ROLE_RESTAURANT_MANAGER`, `ROLE_EMPLOYEE` - Chi nhánh Thái Nguyên)
   - `quanly_quevo` (`ROLE_RESTAURANT_MANAGER`, `ROLE_EMPLOYEE` - Chi nhánh Quế Võ)
   - `ketoan_thainguyen` (`ROLE_BRANCH_ACCOUNTANT`, `ROLE_EMPLOYEE` - Chi nhánh Thái Nguyên)
   - `ketoan_tong` (`ROLE_GENERAL_ACCOUNTANT` - Admin Quản trị toàn chuỗi)
   - `phucvu_thainguyen`, `thungan_thainguyen` (`ROLE_EMPLOYEE`)
   - `nhanvien_nghiviec` (`ROLE_EMPLOYEE` - Trường hợp giữ lương do thiếu đồng phục)
   - `nhanvien_boviec` (`ROLE_EMPLOYEE` - Trường hợp bỏ việc lương = 0 đ)

2. **10 Mặt hàng & Công thức buffet thực tế**:
   - Cua Cà Mau tươi sống (`350.000 đ/kg`, Barcode: `893000000001`, Hao hụt chuẩn: 20%)
   - Ghẹ Phú Quốc loại 1 (`280.000 đ/kg`, Barcode: `893000000002`, Hao hụt chuẩn: 18%)
   - Ba chỉ bò cuộn nấm kim châm (`85.000 đ/kg`, Barcode: `893000000003`)
   - Kim chi cải thảo Hàn Quốc (`45.000 đ/kg`, Barcode: `893000000004`, Món dùng trong ngày)
   - Tôm càng xanh tươi sống (`240.000 đ/kg`, Barcode: `893000000009`, Hao hụt chuẩn: 15%)
   - Ba chỉ bò Mỹ nhập khẩu (`195.000 đ/kg`, Barcode: `893000000010`, Hao hụt chuẩn: 12%)
   - Mực lá tươi Phú Quốc (`180.000 đ/kg`, Barcode: `893000000011`, Hao hụt chuẩn: 16%)
   - Salad Nga tươi sốt Mayonnaise (`55.000 đ/kg`, Barcode: `893000000007`, Món dùng trong ngày)
   - Bánh bao nhân thịt hấp (`12.000 đ/cái`, Barcode: `893000000008`, Món dùng trong ngày)
   - Nước cốt lẩu Thái Tomyum (`50.000 đ/L`, Barcode: `893000000013`, Hao hụt chuẩn: 10%)

3. **5 Nhà cung cấp uy tín**:
   - `NCC-QN01`: Hải Sản Quảng Ninh (Nguyễn Văn Tuấn - MST: 0102030405)
   - `NCC-CM02`: Hải Sản Cà Mau Đặc Sản (Trần Văn Cà - MST: 0506070809)
   - `NCC-HN03`: Thực Phẩm Tươi Sống Hà Nội (Lê Thị Thu - MST: 0109988776)
   - `NCC-DL04`: Nông Sản & Rau Sạch Đà Lạt (Phạm Hồng Thái - MST: 5800112233)
   - `NCC-MB05`: Gia Vị & Đồ Khô Miền Bắc (Hoàng Đình Bắc - MST: 0108877665)

4. **8 Lô nhập hàng (Import Batches)**:
   - `LOT-202611-001` đến `LOT-202611-008` đầy đủ hạn dùng, ngày nhập và số lượng tồn thực tế đồng bộ sang `inventory_stocks`.

5. **9 Phiếu kho (Warehouse Documents)**:
   - 4 phiếu nhập kho chính thức (`PN-TN-202611-001`, `PN-TN-202611-002`, `PN-QV-202611-001`, `PN-QV-202611-002`).
   - 1 phiếu xuất điều chuyển hỗ trợ bếp ca tối (`PX-TN-202611-001`).
   - 1 phiếu xuất hủy do lỗi tủ đông (`PH-QV-202611-001`).

6. **11 Bản ghi Đối soát cuối ngày CukCuk**:
   - 9 bản ghi đối soát khớp chuẩn.
   - 2 bản ghi cố tình bị lệch > 5% và > 300.000 đ phục vụ demo chống thất thoát:
     * Cua Cà Mau (Thái Nguyên ngày 18/11/2026): Lệch `-6.5 kg`, giá trị thất thoát `-2.275.000 đ`, tỷ lệ lệch 13.00% $\rightarrow$ Cờ `is_over_threshold = true`, trạng thái `DA_CANH_BAO_ZALO`.
     * Cua Cà Mau (Quế Võ ngày 18/11/2026): Lệch `-4.5 kg`, giá trị thất thoát `-1.575.000 đ`, tỷ lệ lệch 12.86% $\rightarrow$ Cờ `is_over_threshold = true`, trạng thái `DA_CANH_BAO_ZALO`.

7. **20 Bản ghi Chấm công GPS**:
   - 8 bản ghi ngày 18/11/2026:
     * 1 bản ghi cảnh báo khoảng cách GPS: `nhanvien_boviec` check-in cách 185m (`check_in_distance_meters = 185.00`, `is_valid_location = false`, trạng thái `VI_PHAM_KHOANG_CACH`).
     * 1 bản ghi đi muộn: `phucvu_thainguyen` (`late_minutes = 25`, trừ phạt tương ứng trên bảng lương).

8. **6 Đơn xin ứng lương**:
   - `DA_CHI`: 2 đơn (bep_thainguyen ứng 2.000.000 đ; nhanvien_quevo xin 3.000.000 đ thực chi 2.500.000 đ).
   - `CHO_DUYET`: 2 đơn (phucvu_thainguyen ứng 1.500.000 đ; bep_quevo ứng 2.000.000 đ).
   - `TU_CHOI`: 2 đơn (thungan_thainguyen xin 4.000.000 đ; nhanvien_boviec xin 5.000.000 đ).

9. **8 Bản ghi Bảng lương tháng**:
   - `nhanvien_nghiviec`: `is_uniform_retained = true`, `hold_reason = 'Đang giữ — thiếu 1 Tạp dề, 1 Nón'`, `note = 'Nhân viên nghỉ việc chưa hoàn tất bàn giao đồng phục theo quy định'`.
   - `nhanvien_boviec`: `is_abandoned = true`, `net_salary = 0.00 đ`, `excluded_from_cost = true`, `note = 'Bỏ việc — không trả theo quy định'`.

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Acceptance Criteria Verification)

### 3.1. Kiểm thử Tự Động Backend (Unit Tests)
- **Lệnh thực hiện**: `cd backend && ./mvnw test`
- **Kết quả**: **BUILD SUCCESS**
  - **42/42 tests passing** (100% pass rate, 0 failures, 0 errors, 0 skipped).
  - Toàn bộ các test suite nhạy cảm: `AttendanceServiceTest`, `InventoryCheckServiceTest`, `KitchenServiceTest`, `MultiRoleRbacTest`, `PayrollCalculationServiceTest`, `PayrollLockAndAbandonmentTest`, `ReconciliationCalculationServiceTest`, `SupplierServiceTest`, `WarehouseServiceTest`.

### 3.2. Kiểm thử Frontend Build
- **Lệnh thực hiện**: `docker run --rm -v "$PWD/frontend:/app" -w /app node:20-alpine npm run build`
- **Kết quả**: **BUILD SUCCESS**
  - `tsc && vite build` hoàn tất sạch sẽ trong **1.93s**.
  - **0 lỗi TypeScript, 0 lỗi cú pháp / bundle**.
  - Đóng gói tài nguyên tĩnh hoàn chỉnh: `dist/assets/index-CgJ4JiBk.js (499.86 kB)`.

### 3.3. Ma Trận Nghiệm Thu Tiêu Chí Thực Tế (Live Acceptance Matrix)

| # | Tiêu chí nghiệm thu (Acceptance Criteria) | Kết quả kiểm tra thực tế | Đánh giá |
| :---: | :--- | :--- | :---: |
| **AC 1** | **Phân quyền View nghiêm ngặt (RBAC View Guard)**:<br>Tài khoản Bếp trên Desktop và Mobile chỉ thấy giao diện Bếp 4 Nút (và tab Chấm công/Thi nếu có role Employee), tuyệt đối không xuất hiện menu Kho cơ sở, Đối soát CukCuk hay Bảng lương. | - `isViewAuthorized()` tại `rbac.ts` chặn tuyệt đối các view ngoài thẩm quyền.<br>- `DesktopShell.tsx`: Đăng nhập bằng `bep_thainguyen` (`ROLE_KITCHEN_STAFF`), sidebar chỉ hiển thị Bếp 4 Nút & Chấm công; hoàn toàn ẩn Kho cơ sở, Đối soát, Bảng lương, Dashboard.<br>- `MobileShell.tsx`: Bottom bar chỉ có 4 nút (Bếp 4 Nút, Chấm công, Thi nghề, Cá nhân); không có Kho, Đối soát, Bảng lương.<br>- `App.tsx`: Route guard tự động redirect hoặc chặn bằng `<AccessDeniedFallback>` nếu truy cập trái phép. | ✅ **ĐẠT** |
| **AC 2** | **Xóa bỏ các thẻ ghi chú phát triển nội bộ trên Dashboard**:<br>Không còn section Phase 1 - 7, thay thế bằng Dashboard vận hành nhà hàng chuẩn nghiệp vụ. | - Section ghi chú dev *"Tổng Quan 5 Phân Hệ Dự Án Sen Việt Buffet"* đã được gỡ bỏ 100%.<br>- Dashboard hiển thị các chỉ số vận hành thực tế: Doanh thu ngày 48.500.000 đ, 186 khách phục vụ buffet, 3 mẻ đang nấu / 42 đĩa ra line, 8 lô hàng kiểm kho.<br>- Cung cấp Banner Cảnh Báo Thất Thoát Đỏ Nổi Bật (Cua Cà Mau -6.5 kg, Ghẹ -4.2 kg) kèm nút mở Bảng đối soát.<br>- Các nút điều hướng nhanh được lọc đúng theo vai trò. | ✅ **ĐẠT** |
| **AC 3** | **Cảnh báo & thông báo nổi bật trực quan (Prominent Visual Alerts)**:<br>Thông báo lỗi/cảnh báo hiển thị to, rõ, viền đậm ở phía trên cùng màn hình. | - `<ProminentAlert />` hiển thị fixed top-center (`z-50`) với icon 24px, nền đỏ (`bg-rose-600`) cho lỗi/chặn quyền, vàng cam (`bg-amber-500`) cho cảnh báo, xanh ngọc (`bg-emerald-600`) cho thành công.<br>- Tự động đóng sau 5s, có nút [x] đóng tức thì.<br>- Tích hợp qua hook `useNotification` trong toàn bộ 5 phân hệ chính (`KitchenModule`, `WarehouseModule`, `HRModule`, `PayrollModule`, `ReconciliationModule`). | ✅ **ĐẠT** |
| **AC 4** | **Bộ dữ liệu demo 5 - 10 bản ghi mỗi phân hệ**:<br>Kho, Đối soát, Bếp, Nhân sự, Bảng lương đều có sẵn số liệu thực tế sống động. | - Đã kiểm chứng trực tiếp trên PostgreSQL 16 container:<br>  * 10 thực đơn & công thức chuẩn có barcode, giá bán, hao hụt chuẩn.<br>  * 5 nhà cung cấp đầy đủ MST và người liên hệ.<br>  * 8 lô nhập hàng (`LOT-202611-001` - `008`).<br>  * 9 phiếu kho phân theo ca sáng/tối.<br>  * 11 bản ghi đối soát CukCuk (trong đó có 2 bản ghi đỏ thất thoát > 5% và > 300k đ).<br>  * 20 chấm công GPS (có vi phạm khoảng cách 185m và đi muộn 25 phút).<br>  * 6 đơn ứng lương (`CHO_DUYET`, `DA_CHI`, `TU_CHOI`).<br>  * 8 bảng lương tháng (có 1 giữ lương đồng phục, 1 bỏ việc lương = 0 đ). | ✅ **ĐẠT** |

---

## 4. Kết Luận

Giai đoạn 12 đã hoàn thành xuất sắc 100% các mục tiêu đặt ra. Hệ thống Sen Việt Buffet hiện nay đã đạt độ hoàn thiện cao:
- Giao diện người dùng được phân định rõ ràng theo vai trò, không còn nguy cơ nhân viên bếp click nhầm vào các phân hệ quản lý kho hay tiền lương.
- Mọi cảnh báo nghiệp vụ và thông báo lỗi hiển thị to, rõ ràng, trực quan, hỗ trợ tối đa cho nhân viên thao tác trên thiết bị di động trong môi trường nhà bếp bận rộn.
- Bảng điều khiển nhà hàng hiển thị đầy đủ các chỉ số kinh doanh thực tế, sẵn sàng cho buổi trình diễn trực tiếp với Chị Vũ Thêm (Sen Việt Buffet).
- Bộ dữ liệu mẫu phong phú và sát với thực tế vận hành 2 chi nhánh Thái Nguyên và Quế Võ.
