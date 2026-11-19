# Sen Việt Buffet — Web Demo (Standalone)

> Ứng dụng Web Demo tương tác độc lập (100% Client-side) dành cho chuỗi nhà hàng **Sen Việt Buffet**.  
> **Không cần cài Docker hay Backend Spring Boot**. Toàn bộ dữ liệu được lưu trực tiếp trên trình duyệt (IndexedDB qua Dexie.js).

---

## 🚀 Hướng Dẫn Chạy (Quick Start)

### 1. Cài đặt thư viện:
```bash
npm install
```

### 2. Khởi chạy ứng dụng:
```bash
npm run dev
```

### 3. Mở trên trình duyệt:
* **Trên máy tính**: Mở trình duyệt truy cập: 👉 **[http://localhost:3000](http://localhost:3000)**
* **Trên điện thoại / máy tính bảng**: Truy cập theo địa chỉ Network hiển thị trên terminal (ví dụ: `http://192.168.1.x:3000` — chung mạng Wi-Fi).

---

## 🎮 Tính Năng Trải Nghiệm Demo

Ngay trên cùng màn hình có sẵn thanh công cụ **Demo Control Bar**:
* **Chuyển đổi 5 vai trò (1-click)**: Bếp (`ROLE_BEP`), Quản lý Bếp (`ROLE_QL_BEP`), Quản lý Chi nhánh (`ROLE_QL_CHINHANH`), Kế toán (`ROLE_KETOAN`), Chủ chuỗi (`ROLE_CHU_CHUOI`).
* **Chuyển đổi chi nhánh**: Thái Nguyên & Quế Võ.
* **Nút 🔄 Reset Data Mẫu**: 1-click đưa toàn bộ dữ liệu về trạng thái mẫu ban đầu bất cứ lúc nào.

---

## 🌐 Đóng Gói Triển Khai (Build)

```bash
npm run build
```
Toàn bộ mã nguồn web tĩnh sẽ được tạo tại thư mục `dist/` sẵn sàng kéo thả hoặc đẩy lên Vercel / Netlify.
