# Sen Việt Buffet — Hướng Dẫn Mở & Trải Nghiệm Ứng Dụng Demo (Standalone)

> **Phiên bản Demo tương tác độc lập (100% Client-side)** dành cho chuỗi nhà hàng **Sen Việt Buffet**.  
> 🌟 **Không cần cài đặt Docker** | **Không cần Backend Spring Boot hay PostgreSQL**  
> 💾 **Dữ liệu mẫu lưu trực tiếp trên trình duyệt bằng IndexedDB (Dexie.js)** — Tắt tab hay reload không mất dữ liệu.

---

## 🚀 Cách Mở Ứng Dụng (Chỉ với 2 bước cực kỳ đơn giản)

### Yêu cầu duy nhất:
* Máy tính đã cài đặt **Node.js** (khuyến nghị phiên bản 18 hoặc 20 trở lên).

### Bước 1: Mở Terminal và vào thư mục `frontend-demo`
```bash
cd frontend-demo
```

*(Nếu là lần đầu tiên mở dự án, chạy lệnh này một lần để cài thư viện:)*
```bash
npm install
```

### Bước 2: Khởi chạy ứng dụng
```bash
npm run dev
```

Sau khi chạy lệnh trên, màn hình sẽ hiển thị:
```text
  VITE v5.2.0  ready in 180 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

### 👉 Trải nghiệm ngay:
1. **Trên máy tính (Desktop/Laptop)**: Mở trình duyệt (Chrome, Cốc Cốc, Edge, Safari...) và truy cập:  
   👉 **[http://localhost:3000](http://localhost:3000)**
2. **Trên điện thoại hoặc máy tính bảng**: Đảm bảo điện thoại kết nối **cùng mạng Wi-Fi** với máy tính, sau đó mở trình duyệt điện thoại truy cập vào địa chỉ `Network` hiển thị trong terminal (ví dụ: `http://192.168.1.15:3000`).

---

## 🎮 Hướng Dẫn Sử Dụng Các Tính Năng Demo

Ngay trên cùng màn hình sẽ luôn có thanh công cụ **Demo Control Bar**:

### 1. Chuyển đổi 5 Vai trò (Role Switcher)
Click chọn vai trò để hệ thống tự động đổi quyền hạn và điều hướng tới giao diện tương ứng:
* 👨‍🍳 **Bếp / Bar (`ROLE_BEP`)**: Giao diện mobile 4 nút cực lớn (Lấy hàng, Cân mẻ, Báo hỏng kèm camera, Ra line `+1` chống bấm đúp).
* 📋 **Quản lý Bếp (`ROLE_QL_BEP`)**: Quản lý định mức hao hụt, duyệt báo hỏng nguyên liệu, giám sát ra line.
* 🏢 **Quản lý Chi nhánh (`ROLE_QL_CHINHANH`)**: Xem đối soát cuối ngày, duyệt ứng lương, thu hồi đồng phục nhân viên nghỉ việc.
* 📊 **Kế toán (`ROLE_KETOAN`)**: Tải lên/nạp dữ liệu mẫu Excel CukCuk, đối soát chênh lệch đỏ cảnh báo (>5% hoặc >300.000đ), chốt bảng lương.
* 👑 **Chủ chuỗi (`ROLE_CHU_CHUOI`)**: Toàn quyền xem báo cáo tổng thể cả 2 chi nhánh, cấu hình hệ thống.

### 2. Chuyển đổi Chi nhánh
* Chọn nhanh giữa **CN Thái Nguyên** và **CN Quế Võ** để kiểm tra tính năng cách ly dữ liệu giữa các chi nhánh.

### 3. Nút "Reset Data Mẫu" (1-Click)
* Nếu bạn muốn xóa toàn bộ các thao tác đã thử nghiệm và đưa dữ liệu về trạng thái mẫu ban đầu để demo cho người khác, chỉ cần click nút **"🔄 Reset Data Mẫu"** trên thanh công cụ.

---

## 📦 Đóng Gói Triển Khai Lên Web (Tùy chọn)

Nếu bạn muốn gửi link online cho khách hàng truy cập từ xa mà không cần chạy máy tính cá nhân:
```bash
npm run build
```
Toàn bộ mã nguồn web tĩnh sẽ được tạo tại thư mục `dist/`. Bạn có thể kéo thả thư mục này lên các dịch vụ hosting miễn phí như **Vercel**, **Netlify**, hoặc **Cloudflare Pages** (đã có sẵn file cấu hình `vercel.json` và `netlify.toml`).
