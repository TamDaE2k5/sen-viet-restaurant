# TÀI LIỆU YÊU CẦU CÔNG VIỆC: BẢN DEMO FRONTEND ĐỘC LẬP (STANDALONE DEMO WITH EMBEDDED DB)

> **Mã công việc**: `TASK-DEMO-FRONTEND-STANDALONE`  
> **Dự án**: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)  
> **Khách hàng**: Công ty TNHH T&T Nguyễn Dương (Đại diện: Chị Thêm)  
> **Thư mục làm việc**: `frontend-demo/`  
> **Mục tiêu tối thượng**: Chuyển đổi mã nguồn Frontend hiện có thành **Bản Web Demo tương tác độc lập (100% Client-side)** sử dụng **Cơ sở dữ liệu nhúng IndexedDB (qua Dexie.js)**, sẵn sàng deploy 1-click lên Vercel/Netlify hoặc chạy trực tiếp mà **không cần dựng Backend Spring Boot hay cài đặt PostgreSQL**.

---

## 1. Bối Cảnh & Lý Do Chuyển Đổi Demo

Hệ thống đã hoàn thiện thiết kế UI/UX và logic nghiệp vụ. Để khách hàng (Chị Thêm) có thể cầm điện thoại/máy tính trải nghiệm tương tác thực tế ngay lập tức với chi phí hạ tầng = 0 và triển khai nhanh nhất, dự án cần một phiên bản **Frontend Demo Độc Lập**:
- Không phụ thuộc vào server Backend hay kết nối PostgreSQL.
- Dữ liệu được lưu trữ trực tiếp và bền vững (Persistent) trong trình duyệt người dùng qua **IndexedDB**.
- Giữ nguyên 100% giao diện, phong cách thẩm mỹ, các luồng tương tác thực tế của 5 vai trò (Bếp, Quản lý Bếp, Quản lý Chi nhánh, Kế toán, Chủ chuỗi).
- Có thanh công cụ Demo để chuyển đổi vai trò và nút Reset dữ liệu mẫu chỉ với 1 click.

---

## 2. Lựa Chọn Công Nghệ: Tại Sao Chọn Dexie.js (IndexedDB)?

| Tiêu chí | LocalStorage | Dexie.js (IndexedDB) *(Lựa chọn chuẩn)* |
| :--- | :--- | :--- |
| **Dung lượng lưu trữ** | Giới hạn 5MB (Không đủ lưu ảnh báo hỏng, lịch sử chấm công) | **Không giới hạn** (hàng trăm MB / GB, lưu trữ thoải mái ảnh Base64) |
| **Kiểu dữ liệu** | Chỉ lưu String thuần | Hỗ trợ lưu trữ Object JSON, Date, Binary, Base64 |
| **Hiệu năng & Tốc độ** | Đồng bộ (Sync) gây giật UI khi dữ liệu lớn | **Bất đồng bộ (Async/Indexed)**, thao tác mượt mà không block UI |
| **Tự động cập nhật UI** | Phải tự phát triển event listener | Tích hợp sẵn hook `useLiveQuery` của React giúp UI tự động đồng bộ khi DB thay đổi |
| **Hỗ trợ truy vấn** | Quét toàn bộ mảng thủ công | Đánh Index theo trường, lọc theo Chi nhánh, Ngày tháng, Vai trò cực nhanh |

---

## 3. Cấu Trúc Thư Mục Cần Mở Rộng Trong `frontend-demo/`

Mã nguồn cơ sở đã được copy sẵn từ `frontend/` sang `frontend-demo/`. Agent cần bổ sung/chỉnh sửa các khu vực sau:

```text
frontend-demo/
├── package.json                   # Cần thêm: dexie, dexie-react-hooks, xlsx
├── src/
│   ├── db/                        # [MỚI] Tầng Cơ sở dữ liệu nhúng IndexedDB
│   │   ├── schema.ts              # Định nghĩa schema database Dexie (SenVietDatabase)
│   │   ├── seedData.ts            # Dữ liệu mẫu khởi tạo phong phú & thực tế
│   │   └── dbService.ts           # Hàm initDb(), resetDatabase(), export/import data
│   ├── api/                       # [CHUYỂN ĐỔI] Chuyển từ gọi Axios sang đọc/ghi Dexie DB
│   │   ├── auth.ts                # Mock login & đổi session người dùng theo vai trò
│   │   ├── kitchen.ts             # Thao tác 4 nút bếp, cân mẻ, báo hỏng, ra line
│   │   ├── warehouse.ts           # Nhập xuất tồn kho, lô hàng, nhà cung cấp
│   │   ├── reconciliation.ts      # Đọc Excel CukCuk qua SheetJS, tính chênh lệch cuối ngày
│   │   ├── hr.ts                  # Chấm công GPS giả lập, thi sát hạch, thu hồi đồng phục
│   │   └── payroll.ts             # Ứng lương, khóa giữ lương đồng phục, tính lương
│   ├── components/
│   │   ├── demo/                  # [MỚI] Thanh công cụ hỗ trợ người dùng Demo
│   │   │   └── DemoToolbar.tsx    # Nút chọn 5 vai trò, chọn chi nhánh, nút Reset DB
│   │   └── ...                    # Các component hiện có (giữ nguyên hoặc tinh chỉnh nhẹ)
│   └── App.tsx                    # Gắn DemoToolbar lên đầu trang để khách hàng dễ test
```

---

## 4. Đặc Tả Dữ Liệu & Schema Database Nhúng (Dexie Schema)

Tạo file `src/db/schema.ts` kế thừa `Dexie`:

```typescript
import Dexie, { Table } from 'dexie';

export class SenVietDemoDatabase extends Dexie {
  users!: Table<any, string>;
  branches!: Table<any, string>;
  items!: Table<any, string>;
  batches!: Table<any, string>;
  damageReports!: Table<any, string>;
  lineLogs!: Table<any, string>;
  inventoryLots!: Table<any, string>;
  suppliers!: Table<any, string>;
  attendances!: Table<any, string>;
  examQuestions!: Table<any, string>;
  examSubmissions!: Table<any, string>;
  salaryAdvances!: Table<any, string>;
  payrollRecords!: Table<any, string>;
  uniformAllocations!: Table<any, string>;
  reconciliations!: Table<any, string>;

  constructor() {
    super('SenVietBuffetDemoDB');
    this.version(1).stores({
      users: 'id, username, role, branchId',
      branches: 'id, code, name',
      items: 'id, code, name, category, branchId',
      batches: 'id, branchId, itemId, status, createdAt',
      damageReports: 'id, branchId, itemId, approvalStatus, createdAt',
      lineLogs: 'id, branchId, itemId, createdAt',
      inventoryLots: 'id, branchId, itemId, supplierId, expiryDate',
      suppliers: 'id, code, name',
      attendances: 'id, userId, branchId, date, warningLocation',
      examQuestions: 'id, position, type',
      examSubmissions: 'id, userId, examId, status',
      salaryAdvances: 'id, userId, status, month',
      payrollRecords: 'id, userId, month, isLocked',
      uniformAllocations: 'id, userId, status, isReturned',
      reconciliations: 'id, branchId, date, hasWarning'
    });
  }
}

export const db = new SenVietDemoDatabase();
```

---

## 5. Dữ Liệu Mẫu Phong Phú (Seed Data Requirements)

File `src/db/seedData.ts` phải chứa đầy đủ dữ liệu thực tế của chuỗi **Sen Việt Buffet**:

1. **Chi nhánh (2 chi nhánh)**:
   * `BR01`: Sen Việt Buffet - Chi nhánh Thái Nguyên (Tọa độ: $21.5928, 105.8442$)
   * `BR02`: Sen Việt Buffet - Chi nhánh Quế Võ (Tọa độ: $21.1465, 106.1632$)
2. **5 Tài khoản mẫu đại diện cho 5 Vai trò**:
   * `bep_tn`: Nguyễn Văn Bếp (Vai trò `ROLE_BEP` - Chi nhánh Thái Nguyên)
   * `ql_bep_tn`: Trần Thị Bếp Trưởng (Vai trò `ROLE_QL_BEP` - Thái Nguyên)
   * `ql_chinhanh_tn`: Lê Hoàng Quản Lý (Vai trò `ROLE_QL_CHINHANH` - Thái Nguyên)
   * `ketoan_tong`: Phạm Thu Kế Toán (Vai trò `ROLE_KETOAN` - Toàn hệ thống)
   * `admin_chu`: Đặng Tổng Giám Đốc (Vai trò `ROLE_CHU_CHUOI` - Toàn quyền)
3. **Danh mục Nguyên vật liệu thực tế (Items)**:
   * *Hàng tươi/hải sản*: Cá hồi phi lê (Chuẩn hụt 8%), Tôm càng xanh (Chuẩn hụt 5%), Mực trứng (Chuẩn hụt 7%), Bò Mỹ ba chỉ cuộn (Chuẩn hụt 4%).
   * *Hàng rau/củ*: Nấm kim châm, Rau cải thảo, Ngô ngọt.
   * *Hàng đồ uống/bar*: Bia Tiger lon, Nước ngọt Coca lon, Trà sữa thái xanh.
4. **Lô hàng & Nhà cung cấp**:
   * NCC Hải Sản Biển Đông, NCC Thịt Bò Vissan, NCC Rau Củ Sạch Đà Lạt.
5. **Dữ liệu mẻ chế biến mẫu**:
   * 1 mẻ đã hoàn tất chuẩn định mức (màu xanh).
   * 1 mẻ bị hụt vượt chuẩn (tô đỏ cảnh báo `is_over_standard = true`).
   * 1 mẻ đang làm dở dang (`DANG_LAM`) để sẵn sàng test popup cảnh báo mẻ thứ hai.
6. **Dữ liệu đối soát CukCuk mẫu**:
   * Dữ liệu bán hàng cuối ngày của 1 ca có dòng thất thoát vượt ngưỡng (> 300.000 đ) để hiển thị dòng màu đỏ nổi bật.
7. **Dữ liệu nhân sự, đề thi & đồng phục**:
   * 10 nhân viên mẫu, 1 nhân viên nghỉ việc chưa trả đủ đồng phục (áo + tạp dề) để test chức năng khóa giữ lương.

---

## 6. Các Luồng Tương Tác Nghiệp Vụ Bắt Buộc Phải Hoạt Động

### 6.1. Thanh Demo Toolbar Nổi (Bắt buộc)
* Đặt cố định ở góc trên màn hình hoặc tích hợp gọn gàng vào Navbar:
  * Dropdown: **"Đổi Vai Trò Demo"** (chọn nhanh 1 trong 5 vai trò $\rightarrow$ tự động switch tài khoản & cập nhật giao diện phân quyền ngay lập tức).
  * Dropdown: **"Đổi Chi Nhánh"** (Thái Nguyên $\leftrightarrow$ Quế Võ).
  * Nút bấm: **"🔄 Reset Dữ Liệu Mẫu"** (Reset toàn bộ IndexedDB về seed ban đầu và hiện thông báo thành công).

### 6.2. Phân Hệ Bếp 4 Nút (Mobile Kitchen View)
* **Nút 1 — Lấy hàng**: Chọn nguyên liệu từ kho, nhập khối lượng $\rightarrow$ trừ tồn kho trong Dexie DB.
* **Nút 2 — Chế biến mẻ**:
  * Chọn món $\rightarrow$ Kiểm tra nếu món đang có mẻ `DANG_LAM` thì bật Popup cảnh báo đỏ *"Món này đang có mẻ chưa hoàn tất cân thành phẩm. Bạn có chắc muốn mở thêm mẻ mới?"*.
  * Cân thành phẩm ra $\rightarrow$ Tính: $\text{Hao hụt} = \frac{\text{Kg vào} - \text{Kg ra}}{\text{Kg vào}} \times 100\%$. Nếu vượt định mức chuẩn thì tự động đánh dấu cờ đỏ.
* **Nút 3 — Báo hỏng**:
  * Nhập số kg hỏng, nguyên nhân $\rightarrow$ Chọn ảnh từ máy $\rightarrow$ Tự động nén qua HTML5 Canvas về $\le 200\text{KB} \rightarrow$ Lưu chuỗi Base64 vào DB $\rightarrow$ Quản lý Bếp có thể bấm duyệt/từ chối.
* **Nút 4 — Ra line (`+1`)**:
  * Mỗi lần bấm, nút lập tức disabled trong 1.5 giây, hiển thị spinner chống double-click, tăng số lượng khay ra line trong ngày và lưu lịch sử có timestamp.

### 6.3. Phân Hệ Đối Soát Cuối Ngày (CukCuk Reconciliation)
* Có nút **"Nạp dữ liệu mẫu bán hàng CukCuk"** (1-click) HOẶC cho phép upload file Excel CukCuk (đọc bằng thư viện `xlsx` trực tiếp ở client).
* Hiển thị Bảng đối soát cuối ngày:
  $$\text{Lệch} = (\text{Tồn đầu} + \text{Nhập}) - (\text{Xuất chế biến} + \text{Hỏng có báo} + \text{Tồn thực tế}) - \text{Khách dùng (CukCuk)}$$
* Nếu dòng nào lệch $> 5\%$ hoặc tiền thất thoát $> 300.000$ đ $\rightarrow$ Tô đỏ toàn bộ dòng, bật thông báo mô phỏng: *"⚠️ Đã gửi Webhook cảnh báo thất thoát đến nhóm Zalo Chủ chuỗi & Kế toán!"*.

### 6.4. Phân Hệ Nhân Sự & Chấm Công GPS
* Giao diện Chấm công có 2 nút tiện ích giả lập GPS:
  * Nút **"📍 Giả lập GPS tại nhà hàng"** (Khoảng cách $= 5\text{m} \le 50\text{m} \rightarrow$ Hợp lệ).
  * Nút **"📍 Giả lập GPS ngoài chi nhánh"** (Khoảng cách $= 450\text{m} > 50\text{m} \rightarrow$ Bật cảnh báo vàng `warning_location = true`).
* Thi sát hạch: Chọn bài thi, làm bài trắc nghiệm có đồng hồ đếm ngược, nộp bài tính điểm tự động.
* Khóa giữ lương: Nhân viên nghỉ việc chỉ mở trạng thái cho phép thanh toán lương khi Quản lý chi nhánh tick chọn `da_thu_hoi_dong_phuc = true`.

---

## 7. Các Bước Triển Khai Chi Tiết Cho Agent Được Giao Việc

AI Agent nhận việc cần làm theo trình tự 6 bước sau:

### Bước 1: Cài đặt thư viện bổ sung
Tại thư mục `frontend-demo/`:
```bash
npm install dexie dexie-react-hooks xlsx
```

### Bước 2: Xây dựng Module Database Nhúng (`src/db/`)
* Tạo `src/db/schema.ts` với đầy đủ các bảng đã mô tả ở Mục 4.
* Tạo `src/db/seedData.ts` nạp sẵn bộ dữ liệu phong phú theo Mục 5.
* Tạo `src/db/dbService.ts` chứa hàm `initializeDatabaseIfEmpty()` và `resetToSeedData()`.
* Đảm bảo khi khởi chạy ứng dụng lần đầu, dữ liệu mẫu tự động được nạp nếu DB trống.

### Bước 3: Chuyển đổi tầng API Service sang Dexie DB
* Sửa các file trong `src/api/` (hoặc tạo `src/services/`):
  * Thay thế các lệnh gọi `apiClient.get(...)`, `apiClient.post(...)` bằng thao tác với `db.table(...)`.
  * Thêm hàm delay giả lập 100-150ms: `await new Promise(res => setTimeout(res, 120))` để giữ trọn vẹn cảm giác loading/spinner chân thực cho người dùng.

### Bước 4: Tạo Component `DemoToolbar` và tích hợp vào App
* Tạo component `src/components/demo/DemoToolbar.tsx` hỗ trợ:
  * Quick Role Switcher (5 roles).
  * Branch Switcher (2 branches).
  * Nút Reset Demo Data.
* Nhúng `DemoToolbar` vào `src/App.tsx` hoặc `src/components/layout/Navbar.tsx`.

### Bước 5: Kiểm tra toàn diện & Tối ưu hóa Build
* Chạy `npm run dev` kiểm tra đầy đủ cả trên màn hình Desktop và kích thước Mobile (responsive bếp).
* Chạy `npm run build` để đảm bảo TypeScript không có lỗi cú pháp và thư mục `dist/` được sinh ra sạch sẽ.

### Bước 6: Cấu hình Deploy Tĩnh (Vercel / Netlify / Static Host)
* Tạo file `frontend-demo/vercel.json`:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
* Tạo file `frontend-demo/netlify.toml`:
```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

---

## 8. Tiêu Chuẩn Nghiệm Thu Bản Demo (Acceptance Criteria)

Bản demo được coi là đạt yêu cầu khi thỏa mãn 7 tiêu chí:
1. ✅ **Zero Backend**: Không cần chạy Spring Boot hay PostgreSQL, toàn bộ tính năng chạy mượt mà ngay trên trình duyệt.
2. ✅ **Persistent Data**: Khi F5 hoặc tắt trình duyệt mở lại, dữ liệu đã thao tác (mẻ cân, chấm công, báo hỏng) vẫn còn nguyên trong IndexedDB.
3. ✅ **1-Click Reset**: Nút "Reset Dữ Liệu Mẫu" đưa toàn bộ DB về trạng thái mặc định trong $< 1$ giây.
4. ✅ **Mobile Bếp 4 Nút**: Đủ 4 thao tác, có chống double-click nút ra line, có cảnh báo mẻ thứ hai và vượt định mức.
5. ✅ **CukCuk Đối Soát**: Đọc được file Excel hoặc nạp mẫu bán hàng, tính đúng công thức cột Lệch và tô đỏ dòng thất thoát.
6. ✅ **GPS & Giữ Lương**: Giả lập chấm công vị trí và khóa giữ lương theo tình trạng đồng phục hoạt động đúng logic.
7. ✅ **Build Thành Công**: `npm run build` không phát sinh bất kỳ lỗi TypeScript nào.
