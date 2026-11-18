# KẾ HOẠCH PHÁT TRIỂN: GIAI ĐOẠN 11 (PHASE 11)
## Trải Nghiệm Ngoại Tuyến & Hướng Dẫn Quyền Thiết Bị (Offline Resilience & Hardware UX)

> **Căn cứ**: Mục 3.5, 3.6 trong [phan_bien_va_gop_y_plan.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/phan_bien_va_gop_y_plan.md)  
> **Mục tiêu**: Xây dựng khả năng chịu lỗi mạng (Offline Resilience) cho các thao tác nhạy cảm tại bếp (cân mẻ, báo hỏng, lấy hàng) và xây dựng modal hướng dẫn cấp lại quyền Camera/GPS khi nhân viên lỡ bấm từ chối.

---

### Danh Sách Nhiệm Vụ (Task Checklist)

- [x] **Task 11.1: Cơ Chế Lưu Trữ Tạm Dữ Liệu Form Khi Mất Mạng (Offline Resilience)**
  - **Đặc tả gốc**: *"Không dùng được khi mất mạng $\rightarrow$ Báo lỗi rõ, giữ số đã gõ trên màn hình để lưu lại."*
  - Phát triển Custom Hook `useOfflineFormState(formKey, initialData)`:
    - Tự động đồng bộ các giá trị đang nhập (kg xuất, kg thành phẩm, số lượng, ghi chú) vào `sessionStorage` / `localStorage`.
    - Khi nhân viên submit form mà mạng bị ngắt (Network Error / Timeout / 503):
      - Tuyệt đối **KHÔNG reset form** làm mất số liệu đã gõ.
      - Giữ nguyên toàn bộ số kg nhân viên vừa cân xong.
      - Hiển thị Toast thông báo màu đỏ nổi bật: *"Mất kết nối mạng! Dữ liệu cân mẻ đã được lưu tạm trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại."*

- [x] **Task 11.2: Thành Phần Lắng Nghe Trạng Thái Mạng (Online/Offline Network Banner)**
  - Tạo Component `<NetworkStatusBar />` hiển thị trên đầu ứng dụng di động:
    - Lắng nghe sự kiện trình duyệt: `window.addEventListener('online')` và `window.addEventListener('offline')`.
    - Khi offline: Xuất hiện thanh màu cam cảnh báo: *"Đang ngoại tuyến — Mọi thay đổi sẽ được lưu tạm tại máy"*.
    - Khi có mạng trở lại: Tự động đổi sang màu xanh: *"Đã kết nối lại Internet — Bạn có thể tiếp tục lưu dữ liệu"*.

- [x] **Task 11.3: Thành Phần Hướng Dẫn Cấp Quyền Camera & Vị Trí (Permission Guide Modal)**
  - **Đặc tả gốc**: *"Xin quyền lần đầu, hướng dẫn khi nhân viên lỡ bấm từ chối."*
  - Xây dựng Component `<PermissionGuideModal isOpen={isOpen} type={'CAMERA' | 'GEOLOCATION'} onClose={...} />`.
  - Nhận diện hệ điều hành và trình duyệt của người dùng (iOS Safari, Android Chrome, Zalo In-App Browser).
  - Hiển thị hình ảnh minh họa và 3 bước hướng dẫn bằng tiếng Việt cực kỳ trực quan:
    - **Đối với Android Chrome**:
      1. Bấm vào biểu tượng Cài đặt trang web (biểu tượng ổ khóa hoặc icon gạt) cạnh thanh URL.
      2. Chọn mục "Quyền" (Permissions) -> Bấm vào "Máy ảnh" / "Vị trí".
      3. Chọn "Cho phép" (Allow) -> Bấm nút "Tải lại trang" (Reload).
    - **Đối với iOS Safari**:
      1. Bấm vào biểu tượng `aA` ở thanh địa chỉ URL.
      2. Chọn "Cài đặt trang web" (Website Settings).
      3. Chuyển quyền Camera / Vị trí thành "Cho phép" (Allow) -> Tải lại trang.

- [x] **Task 11.4: Tích Hợp Bắt Lỗi Quyền Trên Các Màn Hình Chấm Công & Báo Hỏng**
  - Tại màn hình Chấm công selfie + GPS:
    - Bắt mã lỗi `GeolocationPositionError.PERMISSION_DENIED` (code 1) -> Tự động bật Modal hướng dẫn cấp quyền Vị trí GPS.
    - Bắt lỗi `NotAllowedError` từ `navigator.mediaDevices.getUserMedia` -> Tự động bật Modal hướng dẫn cấp quyền Camera.
  - Tại màn hình Báo hỏng và đính kèm ảnh phiếu nhập:
    - Cung cấp 2 lựa chọn: "Chụp ảnh trực tiếp" hoặc "Chọn ảnh từ thư viện" (đảm bảo nhân viên vẫn hoàn tất được việc gửi ảnh nếu camera trình duyệt gặp hạn chế quyền).

---

### Tiêu Chí Nghiệm Thu (Acceptance Criteria)

1. Bếp đang nhập cân mẻ 15.5 kg cua hấp, rút cáp mạng/tắt Wi-Fi rồi bấm "Hoàn tất mẻ" -> Hệ thống không bị mất số 15.5 kg, hiện thông báo đỏ rõ ràng giữ nguyên giao diện. Bật lại Wi-Fi bấm lưu lại -> Thành công.
2. Nhân viên mới lần đầu vào chấm công bấm "Chặn" quyền vị trí GPS -> Xuất hiện ngay Modal hướng dẫn 3 bước trực quan cách mở lại quyền trên Chrome/Safari.
3. Nhân viên làm theo hướng dẫn cấp lại quyền -> Bấm "Thử lại" -> Hệ thống lấy được tọa độ GPS và chấm công thành công.
