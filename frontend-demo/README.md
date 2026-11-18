# Sen Việt Buffet — Frontend-Only Interactive Demo (Embedded Database)

> Phiên bản Web Demo tương tác độc lập (100% Client-side) của hệ thống **Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát** dành riêng cho chuỗi nhà hàng **Sen Việt Buffet**.  
> **Không cần Backend Spring Boot** | **Không cần Database PostgreSQL** | **Lưu trữ nhúng bằng IndexedDB (Dexie.js)** | **Sẵn sàng Deploy 1-Click lên Vercel / Netlify**.

---

## 📖 Tài Liệu Yêu Cầu Chi Tiết Cho AI Agent

Mọi hướng dẫn chi tiết về cấu trúc dữ liệu, schema Dexie, các luồng nghiệp vụ 5 vai trò và checklist nghiệm thu được mô tả đầy đủ tại:  
👉 **[TASK_SPECIFICATION.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/frontend-demo/TASK_SPECIFICATION.md)**

---

## 🚀 Hướng Dẫn Khởi Chạy Nhanh (Quick Start)

### 1. Cài đặt dependencies:
```bash
cd frontend-demo
npm install
npm install dexie dexie-react-hooks xlsx
```

### 2. Khởi chạy môi trường phát triển:
```bash
npm run dev
```
Trình duyệt sẽ mở tại `http://localhost:5173`.

### 3. Kiểm tra và đóng gói bản phát hành (Production Build):
```bash
npm run build
```
Thư mục `dist/` sau khi build có thể kéo thả trực tiếp lên **Vercel**, **Netlify**, **Cloudflare Pages** hoặc bất kỳ máy chủ Web tĩnh nào.

---

## ✨ Điểm Nổi Bật Của Bản Demo

1. **Embedded Database Bền Vững (IndexedDB qua Dexie.js)**:
   * Mọi dữ liệu thao tác (mẻ cân, xuất kho, chấm công, ảnh báo hỏng) được lưu trữ trực tiếp trong trình duyệt, tắt tab hoặc tải lại trang dữ liệu vẫn còn nguyên.
   * Dung lượng lưu trữ không giới hạn (thoải mái lưu ảnh báo hỏng base64).
2. **Thanh Demo Toolbar 1-Click**:
   * Chuyển đổi qua lại giữa **5 vai trò người dùng**: Bếp, Quản lý Bếp, Quản lý Chi nhánh, Kế toán, Chủ chuỗi.
   * Chuyển đổi giữa **2 chi nhánh**: Thái Nguyên & Quế Võ.
   * Nút **Reset Dữ Liệu Mẫu**: Khôi phục toàn bộ database về trạng thái ban đầu trong 1 giây.
3. **Phân Hệ Bếp 4 Nút Lớn (Mobile Friendly)**:
   * Nút lớn tối thiểu 48px, chống bấm đúp ở nút ra line (`+1`), nén ảnh trực tiếp trên trình duyệt, cảnh báo mẻ thứ hai dở dang và cảnh báo hụt mẻ vượt định mức.
4. **Đối Soát Cuối Ngày CukCuk**:
   * Đọc file Excel trực tiếp trên trình duyệt bằng SheetJS hoặc nạp dữ liệu bán hàng mẫu, tự động tính cột Lệch và tô đỏ dòng thất thoát.
5. **Chấm Công GPS & Khóa Lương Đồng Phục**:
   * Có nút giả lập tọa độ GPS trong/ngoài chi nhánh. Khóa không cho chi trả lương nhân viên nghỉ việc khi chưa hoàn trả đồng phục.

---

## 📁 Cấu Trúc Thư Mục

```text
frontend-demo/
├── TASK_SPECIFICATION.md        # Bản đặc tả công việc chi tiết dành cho AI Agent
├── README.md                    # File hướng dẫn này
├── package.json                 # Cấu hình dependencies
├── vite.config.ts               # Cấu hình Vite
├── tailwind.config.js           # Cấu hình Tailwind CSS
├── vercel.json                  # Cấu hình định tuyến SPA cho Vercel
├── netlify.toml                 # Cấu hình định tuyến SPA cho Netlify
├── index.html                   # Entry point HTML
└── src/
    ├── db/                      # Tầng IndexedDB (Dexie Schema & Seed Data)
    ├── api/                     # Tầng API Mock tương tác với Dexie DB
    ├── components/              # Toàn bộ UI Components (Bếp, Kho, Đối soát, HR, Lương)
    │   ├── demo/                # Component thanh công cụ DemoToolbar
    │   ├── auth/                # Đăng nhập
    │   ├── kitchen/             # 4 Nút Bếp & Chế biến
    │   ├── warehouse/           # Quản lý kho & lô hàng
    │   ├── reconciliation/      # Bảng đối soát cuối ngày CukCuk
    │   ├── hr/                  # Chấm công, đề thi, đồng phục
    │   ├── payroll/             # Bảng lương & ứng lương
    │   └── layout/              # Shell Mobile & Desktop
    ├── context/                 # AuthContext & State management
    └── types/                   # Interface TypeScript chuẩn
```
