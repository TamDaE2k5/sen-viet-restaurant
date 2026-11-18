# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 12 (PHASE 12)
## Phân View Theo Vai Trò Chặt Chẽ, Cảnh Báo Nổi Bật & Bộ Dữ Liệu Demo Khách Hàng

> **Căn cứ yêu cầu người dùng**:
> 1. Phân chia view/giao diện chặt chẽ theo vai trò (RBAC View Guard): Nếu không có quyền thì ẩn hoàn toàn ngay từ đầu, không hiển thị menu/tab để tránh click nhầm.
> 2. Làm nổi bật các thông báo / cảnh báo (Prominent Visual Alerts): Banner/Toast/Modal rõ ràng, nổi bật, dễ nhận biết khi có lỗi hoặc thông báo quan trọng.
> 3. Tạo bộ dữ liệu mẫu chuẩn thực tế (5 - 10 bản ghi mỗi phân hệ) phục vụ demo trực quan cho khách hàng (Chị Vũ Thêm - Sen Việt Buffet).

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [ ] **Task 12.1: Triển Khai RBAC View Guard & Lọc Menu Điều Hướng (Navigation Filter)**
  - **Desktop Navigation (`DesktopShell.tsx`)**:
    - Lọc danh sách menu `menuItems` theo danh sách vai trò (`user.roles`):
      * `ROLE_KITCHEN_STAFF`: Chỉ thấy menu **"Bếp 4 Nút & Cân Mẻ"** (nếu có `ROLE_EMPLOYEE` thì có thêm Cổng cá nhân). Tuyệt đối **ẨN** Kho cơ sở, Đối soát CukCuk, Giám sát, Quản trị phân quyền, Bảng lương tổng.
      * `ROLE_EMPLOYEE`: Chỉ thấy Cổng cá nhân (Chấm công GPS, Thi nghề, Phiếu lương & Ứng lương cá nhân). Tuyệt đối **ẨN** Bếp, Kho, Đối soát, Bảng lương chuỗi.
      * `ROLE_RESTAURANT_MANAGER`: Thấy Bếp (chế độ duyệt hỏng & chốt ca), Đối soát chi nhánh mình, Nhân sự chi nhánh mình. **ẨN** Kho NCC toàn chuỗi, Khóa bảng lương toàn chuỗi.
      * `ROLE_BRANCH_ACCOUNTANT`: Thấy Phiếu nhập/xuất kho chi nhánh, Đối soát CukCuk chi nhánh, Bảng lương chi nhánh. **ẨN** Cấu hình toàn chuỗi, Khóa bảng lương toàn chuỗi.
      * `ROLE_GENERAL_ACCOUNTANT`: Thấy toàn bộ 7 phân hệ.
  - **Mobile Navigation (`MobileShell.tsx`)**:
    - Lọc các nút dưới thanh Bottom Bar tương ứng theo vai trò người dùng.
  - **App Routing Guard (`App.tsx`)**:
    - Nếu trạng thái `desktopMenu` hoặc `mobileTab` trỏ vào phân hệ mà tài khoản không có quyền, tự động điều hướng (redirect) về phân hệ mặc định hợp lệ đầu tiên của vai trò đó.
  - **Dashboard Cards Filtering (`Dashboard.tsx`)**:
    - Chỉ hiển thị các thẻ phân hệ quản trị mà người dùng có quyền truy cập; ẩn toàn bộ các thẻ phân hệ ngoài thẩm quyền.

- [ ] **Task 12.2: Hệ Thống Cảnh Báo & Thông Báo Nổi Bật (Prominent Visual Alerts & Toast)**
  - Xây dựng Component `<ProminentAlert />` và Context `<NotificationContext />`:
    - Vị trí hiển thị: Nổi bật ở phía trên cùng màn hình (Top-Center / Floating Banner), có bóng đổ sâu và viền tương phản cao.
    - Màu sắc nhận diện rõ nét:
      * 🔴 **Lỗi & Chặn quyền**: Đỏ đậm (`bg-rose-600 text-white`), icon `ShieldAlert` lớn 24px, chữ đậm, giải thích rõ nguyên nhân.
      * 🟡 **Cảnh báo nghiệp vụ**: Vàng cam (`bg-amber-500 text-white`), icon `AlertTriangle`.
      * 🟢 **Thành công**: Xanh ngọc (`bg-emerald-600 text-white`), icon `CheckCircle2`.
    - Tự động đóng sau 5 giây hoặc bấm nút `[Đóng / Thử lại]` tức thì.
  - Thay thế các cảnh báo lỗi nhỏ chữ đỏ trong các form thao tác (Kho, Bếp, Báo hỏng, Ứng lương) bằng thông báo nổi bật này.

- [ ] **Task 12.3: Xây Dựng Bộ Dữ Liệu Demo Chuẩn 5-10 Bản Ghi (Flyway Migration `V11`)**
  - **10 Mặt hàng & Nguyên liệu thực tế**:
    * Hải sản: Cua Cà Mau sống (350k/kg), Ghẹ Phú Quốc (280k/kg), Tôm càng xanh sống (240k/kg), Mực lá tươi (180k/kg).
    * Thịt & Nông sản: Ba chỉ bò Mỹ (195k/kg), Nấm kim châm (45k/kg).
    * Món dùng trong ngày: Salad Nga tươi (55k/kg), Kim chi cải thảo (40k/kg), Bánh bao thịt hấp (35k/kg), Nộm hoa chuối tai heo (65k/kg).
  - **5 Nhà cung cấp uy tín**:
    * Hải Sản Quảng Ninh (`NCC-QN01`), Hải Sản Cà Mau Đặc Sản (`NCC-CM02`), Thực Phẩm Tươi Sống Hà Nội (`NCC-HN03`), Nông Sản & Rau Sạch Đà Lạt (`NCC-DL04`), Gia Vị & Đồ Khô Miền Bắc (`NCC-MB05`).
  - **8 Lô nhập hàng (Import Batches)**:
    * Đầy đủ mã lô `LOT-202611-001` đến `LOT-202611-008`, ngày nhập, hạn dùng, số lượng ban đầu và số lượng tồn thực tế.
  - **6 Phiếu kho (Warehouse Documents)**:
    * 4 phiếu nhập kho, 2 phiếu xuất hủy/chuyển kho phân theo ca sáng/tối cho 2 chi nhánh.
  - **8 Bản ghi Đối soát cuối ngày CukCuk**:
    * 6 bản ghi đối soát khớp chuẩn (tỷ lệ lệch < 2%).
    * 2 bản ghi cố tình bị lệch > 5% và > 300.000 đ (ví dụ Cua Cà Mau thất thoát 6.5 kg = 2.275.000 đ) để **tô đỏ rực rỡ** trên màn hình demo đối soát chống thất thoát cho khách xem.
  - **8 Bản ghi Chấm công selfie + GPS**:
    * Có tọa độ GPS thực tế của Thái Nguyên & Quế Võ, 1 bản ghi cảnh báo ngoài chi nhánh (180m), 1 bản ghi đi muộn 25 phút.
  - **6 Đơn xin ứng lương**:
    * Có đơn `CHO_DUYET`, `DA_CHI` (xin 3tr thực chi 2.5tr), và `TU_CHOI`.
  - **8 Bản ghi Bảng lương tháng**:
    * Tính toán công nhật đầy đủ, 1 trường hợp nhân viên nghỉ việc giữ lương ghi rõ *"Đang giữ — thiếu 1 Tạp dề, 1 Nón"*, và 1 trường hợp bỏ việc lương = 0 đ ghi rõ *"Bỏ việc — không trả theo quy định"*.

- [ ] **Task 12.4: Kiểm Thử Nghiệm Thu Giao Diện & Kịch Bản Demo (End-to-End Walkthrough)**
  - Đăng nhập tài khoản `bep_thainguyen` (`ROLE_KITCHEN_STAFF`): Xác nhận giao diện CHỈ hiện Bếp 4 nút, hoàn toàn không thấy menu Kho, Đối soát, Bảng lương.
  - Đăng nhập tài khoản `quanly_thainguyen` (`ROLE_RESTAURANT_MANAGER`): Thấy Bếp, Duyệt hỏng, Đối soát chi nhánh, Nhân sự chi nhánh. Không thấy menu NCC toàn chuỗi hay Khóa lương.
  - Đăng nhập tài khoản `ketoan_tong` (`ROLE_GENERAL_ACCOUNTANT`): Thấy đầy đủ 7 phân hệ với 5-10 bản ghi dữ liệu mẫu phong phú.
  - Thử nghiệm các thao tác lỗi để kiểm chứng Banner/Toast cảnh báo hiển thị to, rõ, nổi bật.

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. **Phân quyền View**: Tài khoản Bếp khi đăng nhập trên cả Mobile và Desktop chỉ thấy giao diện Bếp 4 Nút (và tab Chấm công/Thi nếu có role Employee), tuyệt đối không xuất hiện các menu Kho cơ sở, Đối soát hay Bảng lương.
2. **Cảnh báo nổi bật**: Mọi thông báo lỗi hoặc cảnh báo nghiệp vụ (như chặn mẻ hỏng, cảnh báo thất thoát đỏ, mất mạng) đều hiển thị nổi bật, rõ ràng bằng tiếng Việt, không còn tình trạng lỗi chữ nhỏ mờ nhạt.
3. **Dữ liệu demo 5-10 bản ghi**: Khi mở màn hình Kho, Đối soát, Nhân sự, Bảng lương đều có sẵn 5-10 bản ghi số liệu thực tế sống động, có các dòng cảnh báo đỏ để demo tính năng chống thất thoát cho khách hàng.
4. **Hệ thống build sạch**: `mvn test` 100% pass và `npm run build` không lỗi.
