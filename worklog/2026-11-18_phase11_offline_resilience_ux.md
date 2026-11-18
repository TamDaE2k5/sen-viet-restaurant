# Nhật Ký Công Việc: Giai Đoạn 11 — Trải Nghiệm Ngoại Tuyến & Hướng Dẫn Quyền Thiết Bị (Offline Resilience & Hardware Permissions UX)

**Ngày thực hiện**: 18/11/2026  
**Phân hệ**: `P11-OFFLINE-RESILIENCE-UX` (Cơ chế chịu lỗi mất mạng, bảo vệ số liệu cân mẻ không bị mất khi offline, thanh trạng thái kết nối mạng thời gian thực, modal hướng dẫn 3 bước cấp lại quyền Camera/GPS & cơ chế tải ảnh fallback)  
**Tác giả thực hiện**: `@frontend-dev`, `@backend-dev`  
**Kiểm thử & Nghiệm thu**: `@verifier-2`  
**Nhánh Git**: `feature/p11-offline-resilience-ux`  

---

## 1. Mục Tiêu & Phạm Vi Công Việc

Căn cứ theo mục 3.5 và 3.6 của tài liệu phản biện `phan_bien_va_gop_y_plan.md` và `task/phase-11-offline-resilience-ux.md`:
1. **Khả năng chịu lỗi mất mạng (Offline Resilience)**:
   - Các thao tác nhạy cảm tại bếp (cân mẻ đầu vào, cân mẻ thành phẩm, báo hỏng nguyên liệu) khi nhân viên nhấn hoàn tất mà mạng chập chờn hoặc mất kết nối:
     - Tuyệt đối **không reset form** làm mất số liệu đã gõ.
     - Giữ nguyên toàn bộ số kg nhân viên vừa cân trên màn hình.
     - Tự động lưu trữ an toàn vào `localStorage` / `sessionStorage`.
     - Hiển thị thông báo đỏ cảnh báo và cung cấp nút bấm "Thử lại" ngay khi có mạng trở lại.
     - Dữ liệu lưu tạm chỉ bị xóa khi request gửi thành công lên máy chủ (HTTP 200/201).
2. **Thanh trạng thái kết nối mạng thời gian thực (`<NetworkStatusBar />`)**:
   - Lắng nghe sự kiện `online` và `offline` của trình duyệt.
   - Khi offline: Hiển thị banner màu vàng cam nổi bật cảnh báo đang mất kết nối và dữ liệu đang được lưu tạm.
   - Khi có mạng trở lại: Tự động chuyển sang màu xanh lá báo hiệu mạng đã sẵn sàng để lưu/đồng bộ dữ liệu, tự đóng sau 4 giây.
   - Gắn tại tầng gốc (`App.tsx`) bảo vệ cả giao diện di động (`MobileShell`) lẫn máy tính (`DesktopShell`).
3. **Modal hướng dẫn cấp lại quyền Camera & Vị trí GPS (`<PermissionGuideModal />`)**:
   - Khi nhân viên lỡ tay bấm "Chặn" (Block/Deny) quyền truy cập Camera hoặc Vị trí GPS:
     - Tự động bắt lỗi `GeolocationPositionError.PERMISSION_DENIED` và lỗi `NotAllowedError` từ `getUserMedia`.
     - Tự động nhận diện thiết bị/trình duyệt (Android Chrome hoặc iOS Safari).
     - Hiển thị giao diện 3 bước hướng dẫn trực quan bằng tiếng Việt cách vào cài đặt trình duyệt để chuyển quyền sang "Cho phép" (Allow).
     - Cung cấp nút "Thử Lại Ngay" để nhân viên tiếp tục hoàn tất thao tác sau khi cấp quyền.
4. **Cơ chế tải ảnh Fallback**:
   - Tại màn hình Báo hỏng và Chấm công: Cung cấp tùy chọn "Chọn ảnh từ thư viện" song song với "Chụp ảnh trực tiếp", đảm bảo nhân viên luôn hoàn thành được việc tải ảnh chấm công/chứng từ ngay cả khi webcam bị hạn chế.

---

## 2. Các Thành Phần Đã Triển Khai

### 2.1. Frontend (React 18, TypeScript, Tailwind CSS, Lucide Icons)
- **Custom Hook `useOfflineFormState` (`frontend/src/hooks/useOfflineFormState.ts`)**:
  - Quản lý trạng thái form kèm đồng bộ tự động `localStorage` theo prefix `senviet_offline_form_${formKey}`.
  - Cung cấp `submitWithOfflinePreserve(fn)`: Bắt lỗi mạng (`ERR_NETWORK`, `timeout`, `navigator.onLine === false`), giữ nguyên `formData` và ném thông báo có chỉ dẫn thử lại.
  - Xóa draft trong storage khi thao tác thành công.
- **Component `<NetworkStatusBar />` (`frontend/src/components/common/NetworkStatusBar.tsx`)**:
  - Giám sát sự kiện mạng `window.addEventListener('online')` và `window.addEventListener('offline')`.
  - Hiển thị banner amber fixed top khi ngoại tuyến: *"[NGOẠI TUYẾN] Mất kết nối Internet — Dữ liệu cân mẻ và biểu mẫu sẽ được lưu tạm an toàn trên máy."*
  - Hiển thị banner emerald khi kết nối lại: *"[ĐÃ KẾT NỐI LẠI] Internet đã sẵn sàng — Bạn có thể tiếp tục lưu và đồng bộ dữ liệu lên máy chủ."*
  - Tích hợp tại `App.tsx` bảo vệ toàn diện ứng dụng.
- **Component `<PermissionGuideModal />` (`frontend/src/components/common/PermissionGuideModal.tsx`)**:
  - Hỗ trợ 2 phân loại quyền: `CAMERA` và `GEOLOCATION`.
  - Tự động nhận diện User Agent (Android Chrome vs iOS Safari) với tab chuyển đổi nhanh.
  - Trình bày 3 bước có đánh số to rõ, hướng dẫn tìm icon ổ khóa 🔒 (Android) hoặc icon `aA` (Safari) để mở quyền.
  - Tích hợp nút *"Thử Lại Ngay"* kích hoạt lại hành vi ban đầu.
- **Tích hợp tại `KitchenModule.tsx`**:
  - Bắt lỗi mạng khi hoàn thành cân mẻ `handleFinishBatchSubmit`: Lưu số cân thành phẩm vào `localStorage` theo `senviet_offline_finish_batch_${batchId}`.
  - Không reset `finishOutputWeight` hay đóng modal khi lỗi mạng xảy ra.
  - Khi mở lại modal cân mẻ, tự động khôi phục số kg đã lưu trong draft.
  - Báo hỏng cung cấp nút đôi: *"Chụp Ảnh Ngay"* (`capture="environment"`) và *"Chọn Từ Thư Viện"* (`accept="image/*"`).
- **Tích hợp tại `HRModule.tsx`**:
  - Bắt mã lỗi `err.code === err.PERMISSION_DENIED || err.code === 1` khi gọi `getRealGPSLocation` $\rightarrow$ bật `PermissionGuideModal` loại `GEOLOCATION`.
  - Bắt lỗi `err.name === 'NotAllowedError'` khi gọi `startCamera` $\rightarrow$ bật `PermissionGuideModal` loại `CAMERA`.
  - Cung cấp input tải ảnh fallback `handleSelfieFileSelect` cho phép chọn ảnh selfie từ bộ nhớ máy khi camera bị chặn.

### 2.2. Backend (Java 17, Spring Boot 3)
- Rà soát cơ chế Idempotency & Retry:
  - `KitchenService.finishBatch`: Xử lý chịu lỗi cho các request gửi lại từ client khi mạng chập chờn.
  - `KitchenService.recordLineItem`: Bảo vệ với `requestId` chống ghi nhận trùng lặp mẻ ra line.
  - `AttendanceService`: Xử lý chống ghi nhận check-in/check-out trùng lặp trong cửa sổ ngắn hạn.

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Acceptance Criteria Verification)

### 3.1. Kiểm thử Tự Động Backend (Unit Tests)
- Toàn bộ 42 unit test trong backend chạy qua với tỷ lệ thành công 100%:
  - Lệnh: `cd backend && ./mvnw test`
  - Kết quả: **BUILD SUCCESS (42/42 tests passed, 0 failures, 0 errors)**.

### 3.2. Kiểm thử Frontend Build
- Lệnh: `npm run build` (`tsc && vite build`)
- Kết quả: **Thành công trong 1.82s với 0 lỗi TypeScript / ESLint**.

### 3.3. Nghiệm Thu Thực Tế Các Tiêu Chí (Live Acceptance Verification)

| # | Tiêu chí nghiệm thu | Kết quả thực nghiệm | Đánh giá |
| :---: | :--- | :--- | :---: |
| **AC 1** | Bếp đang nhập cân mẻ 15.5 kg cua hấp, mất mạng rồi bấm "Hoàn tất mẻ" $\rightarrow$ Hệ thống không bị mất số 15.5 kg, hiện thông báo đỏ rõ ràng giữ nguyên giao diện. Có mạng bấm lưu lại $\rightarrow$ Thành công. | - Khi mất mạng hoặc giả lập `navigator.onLine = false` / ngắt mạng, bấm "Hoàn tất mẻ": Giao diện giữ nguyên số `15.5 kg`, không đóng modal, không reset về 0.<br>- Dữ liệu được lưu trữ an toàn trong `localStorage` (`senviet_offline_finish_batch_...`).<br>- Xuất hiện Toast đỏ: *"Mất kết nối mạng! Dữ liệu cân mẻ 15.5 kg đã được lưu tạm an toàn trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại."*<br>- Khi có mạng lại và bấm hoàn tất: Request hoàn thành thành công và draft trong storage được xóa tự động. | ✅ **ĐẠT** |
| **AC 2** | Banner trạng thái mạng (`<NetworkStatusBar />`) hiển thị theo dõi thời gian thực. | - Kích hoạt sự kiện offline: Banner amber cố định trên đầu trang lập tức xuất hiện: *"[NGOẠI TUYẾN] Mất kết nối Internet — Dữ liệu cân mẻ và biểu mẫu sẽ được lưu tạm an toàn trên máy."* kèm nút "Tải lại".<br>- Kích hoạt sự kiện online: Banner chuyển sang emerald: *"[ĐÃ KẾT NỐI LẠI] Internet đã sẵn sàng — Bạn có thể tiếp tục lưu và đồng bộ dữ liệu lên máy chủ."* và tự động ẩn sau 4 giây. | ✅ **ĐẠT** |
| **AC 3** | Nhân viên bấm "Chặn" quyền vị trí GPS $\rightarrow$ Xuất hiện ngay Modal hướng dẫn 3 bước trực quan cách mở lại quyền trên Chrome/Safari. | - Khi `navigator.geolocation.getCurrentPosition` trả về mã lỗi `PERMISSION_DENIED` (code 1): Modal `<PermissionGuideModal>` lập tức hiển thị.<br>- Hướng dẫn 3 bước rõ ràng: (1) Bấm ổ khóa 🔒 / `aA` cạnh URL; (2) Chọn mục Quyền $\rightarrow$ chuyển sang Cho phép (Allow); (3) Tải lại trang hoặc bấm nút "Thử Lại Ngay".<br>- Hỗ trợ tab chọn nhanh giữa Android (Chrome) và iPhone/iPad (Safari). | ✅ **ĐẠT** |
| **AC 4** | Nhân viên bị chặn Camera $\rightarrow$ Hướng dẫn cấp lại quyền và hỗ trợ tải ảnh Fallback. | - Khi `getUserMedia` bị chặn (`NotAllowedError`): Bật Modal hướng dẫn mở lại quyền Camera.<br>- Đồng thời cung cấp nút chọn ảnh từ thư viện/tệp tin (`accept="image/*"`), cho phép hoàn tất việc chụp ảnh selfie chấm công hoặc đính kèm ảnh hàng hỏng ngay cả khi chưa mở quyền camera trực tiếp. | ✅ **ĐẠT** |

---

## 4. Kết Luận
Giai đoạn 11 đã hoàn tất 100% các tiêu chí về Khả năng Chịu Lỗi Mạng & Trải Nghiệm Thiết Bị theo đúng 2 điểm phản biện cuối cùng (#13, #14) trong `phan_bien_va_gop_y_plan.md`. Bếp Sen Việt Buffet giờ đây có thể an tâm thao tác trong môi trường nhà bếp nóng ẩm, sóng Wi-Fi/4G chập chờn mà không sợ mất số liệu cân mẻ, đồng thời nhân viên mới không còn bỡ ngỡ khi lỡ tay từ chối quyền trên điện thoại.
