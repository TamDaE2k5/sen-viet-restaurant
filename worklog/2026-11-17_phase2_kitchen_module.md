# Nhật Ký Phát Triển: Giai Đoạn 2 - Phân Hệ Bếp 4 Nút Mobile & Quản Trị Chế Biến Mẻ
- **Thời gian**: 2026-11-17 22:40 - 22:55 (UTC+7)
- **Người thực hiện**: Lead Builder (AI Agent)
- **Mã Task liên quan**: P2-KITCHEN (Tasks 2.1 - 2.6)
- **Nhánh Git**: `dev`
- **Trạng thái**: ✅ Hoàn thành 100%

---

### 1. Mục Tiêu Giai Đoạn 2
Xây dựng giao diện di động 4 nút cỡ lớn cho Bếp, kiểm soát chặt chẽ quy trình cân mẻ, tính tỷ lệ hao hụt tự động, cảnh báo mẻ thứ hai chưa xong, cơ chế chống double-click khi ra line và nén ảnh báo hỏng trực tiếp trên trình duyệt.

---

### 2. Tiến Độ Thực Hiện Từng Task

#### Task 2.1: Database Schema Migration cho Phân hệ Bếp (V3)
- **Tập tin**: `backend/src/main/resources/db/migration/V3__kitchen_and_processing_schema.sql`
- **Nội dung**: Các bảng `items`, `recipes`, `take_out_logs`, `processing_batches`, `damage_reports`, `line_item_logs` cùng seed các món buffet mẫu (Cua Cà Mau, Ghẹ Phú Quốc, Kim chi, Bò cuộn nấm...).
- **Đánh index**: `idx_take_out_logs_branch`, `idx_processing_batches_branch`, `idx_damage_reports_branch`, `idx_line_item_logs_branch`.
- **Trạng thái**: ✅ Đã hoàn thành và Flyway áp dụng thành công trên PostgreSQL 16.

#### Task 2.2: Backend API "Lấy Hàng" (Take-out)
- **Tập tin**:
  - `backend/src/main/java/com/senviet/domain/entity/TakeOutLog.java`
  - `backend/src/main/java/com/senviet/domain/dto/request/TakeOutRequest.java`
  - `backend/src/main/java/com/senviet/service/KitchenService.java`
  - `backend/src/main/java/com/senviet/controller/KitchenController.java` (`POST /api/v1/kitchen/take-out`)
- **Trạng thái**: ✅ Hoàn thành, kiểm tra curl trả về 200 OK và lưu vết ca làm việc.

#### Task 2.3: Backend API "Chế Biến Mẻ" & Logic Cảnh Báo Hao Hụt
- **Tập tin**:
  - `ProcessingBatch.java`, `StartBatchRequest.java`, `FinishBatchRequest.java`, `BatchResponse.java`, `BatchLossResult.java`
  - `KitchenService.java`:
    - `startBatch`: Kiểm tra nếu cùng món đang có mẻ `DANG_LAM` mà không có `forceSecondBatch=true` thì throw `ConflictException` (HTTP 409).
    - `finishBatch`: Tính $\text{LossRate} = \frac{\text{Input} - \text{Output}}{\text{Input}} \times 100\%$. Nếu $>$ standardLossRate thì đánh cờ `is_over_standard = true` kèm warning.
  - `KitchenServiceTest.java`: 3 Unit tests kiểm tra đúng tỷ lệ hao hụt, cờ vượt định mức và ngoại lệ khi khối lượng ra > khối lượng vào.
- **Trạng thái**: ✅ Hoàn thành, test pass 100%.

#### Task 2.4: Backend API "Ra Line" (+1) & Chống Double-Click
- **Tập tin**:
  - `LineItemLog.java`, `LineItemIncRequest.java`
  - `KitchenService.java`: Nhận diện `requestId` duy nhất (Idempotency Key). Nếu request ID đã tồn tại thì trả về log cũ mà không tăng thêm số lượng.
- **Trạng thái**: ✅ Hoàn thành, test curl gửi 2 lần cùng `requestId` không hề nhân đôi số lượng.

#### Task 2.5: Backend API "Báo Hỏng" & Tự Động Duyệt
- **Tập tin**:
  - `DamageReport.java`, `DamageReportRequest.java`
  - `KitchenService.java`: Tự động tính giá trị ước lượng = `quantity * costPrice`. Nếu $\le 500.000$ đ $\rightarrow$ `TU_DONG_DUYET`; nếu $> 500.000$ đ $\rightarrow$ `CHO_DUYET`. Endpoint `PUT /damage-reports/{id}/approve` cho quản lý.
- **Trạng thái**: ✅ Hoàn thành.

#### Task 2.6: Frontend Mobile 4 Nút Bếp & Trải Nghiệm Thao Tác Nhanh
- **Tập tin**:
  - `frontend/src/utils/imageCompressor.ts`: Nén ảnh HTML5 Canvas API về max 1280x720, quality 0.75, dung lượng $\le 200$KB.
  - `frontend/src/api/kitchen.ts`: Định nghĩa TypeScript interfaces và API client cho toàn bộ phân hệ bếp.
  - `frontend/src/components/kitchen/KitchenModule.tsx`:
    - 4 Nút bấm siêu lớn ($\ge 64$px touch targets): 🟦 Lấy hàng, 🟩 Chế biến mẻ, 🟨 Ra line (+1), 🟥 Báo hỏng.
    - Modal 1: Lấy hàng ra bếp với bộ tăng nhanh số lượng (+5, +10, +20).
    - Modal 2: Chế biến mẻ & Cân thành phẩm, tích hợp popup cảnh báo đỏ mẻ thứ hai và realtime preview hao hụt.
    - Modal 3: Ra line (+1) với nút bấm lập tức disable, hiệu ứng xoay spinner và chống double-click.
    - Modal 4: Báo hỏng kèm camera upload, nén ảnh tự động và tính giá trị dự toán.
  - `frontend/src/App.tsx` & `Dashboard.tsx`: Tích hợp responsive vào cả MobileShell và DesktopShell.
- **Trạng thái**: ✅ Hoàn thành, Vite build thành công trong 1.50s, Docker Nginx container phục vụ mượt mà.

---

### 3. Kết Quả Kiểm Thử (Verification Summary)
- Backend Unit Tests: 4/4 Tests Passed (`KitchenServiceTest`: 3, `RestaurantApplicationTests`: 1).
- Frontend Build: `npm run build` không có bất kỳ warning/lỗi TypeScript nào.
- End-to-End API Test: Đăng nhập bằng `bep_thainguyen` (`ROLE_KITCHEN_STAFF`), thực hiện thành công đầy đủ 4 luồng nghiệp vụ.
