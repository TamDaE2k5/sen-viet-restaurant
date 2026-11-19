# KẾ HOẠCH CHI TIẾT PHASE 13: TỐI ƯU TOÀN DIỆN UX/UI ĐA NỀN TẢNG (PC, TABLET, PHONE)
## Căn Cứ & Chuẩn Hóa Theo Skill: `ui-ux-pro-max-skill` (NextLevelBuilder)
> **Dự án**: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)  
> **Mục tiêu**: Tái thiết kế toàn diện tầng giao diện (Presentation Layer) đạt chuẩn UI/UX quốc tế, tương thích mượt mà trên 3 kích thước màn hình (PC Desktop, Tablet Kiosk, Mobile Phone), tích hợp hệ thống Design Tokens và quy tắc thiết kế từ `ui-ux-pro-max-skill`.

---

## 1. Phân Tích Hiện Trạng & Chiến Lược Thực Hiện

### 1.1. Hiện trạng & Lý do cần tối ưu
* **Thiếu bản sắc thương hiệu (Brand Identity)**: Giao diện hiện tại dùng màu mặc định của Tailwind (xanh lam/xám), chưa toát lên vẻ ấm cúng, sang trọng và ngon miệng của ngành F&B / Nhà hàng Buffet Á Đông (Sen Việt: Đỏ thẩm/Burgundy + Vàng kim/Amber ấm + Xám chì hiện đại).
* **Trải nghiệm đa nền tảng chưa liền mạch**:
  * **Mobile (Phone)**: Các bảng dữ liệu (Kho, Đối soát CukCuk) bị tràn ngang; form nhập liệu chưa tối ưu vị trí ngón tay cái (Thumb zone); modal chiếm trọn màn hình thay vì dùng Bottom Sheet.
  * **Tablet (iPad / Kiosk bếp)**: Chưa tận dụng được bố cục 2 cột (Master-Detail) để nhân viên bếp và thủ kho thao tác nhanh mà không phải chuyển trang liên tục.
  * **Desktop (PC)**: Mật độ thông tin (information density) còn thưa, thiếu tính năng ghim cột (sticky column) khi cuộn bảng đối soát lớn và thiếu phím tắt.
* **Nguyên tắc "Tái cấu trúc giao diện — Giữ vững nghiệp vụ" (Refactor Presentation Layer, Preserve Core Logic)**:
  * **Giữ nguyên 100%**: Tầng nghiệp vụ cốt lõi (Business Logic, IndexedDB Dexie Schema 15 bảng, các công thức tính toán hao hụt/đối soát, giải thuật GPS Haversine, quy tắc khóa lương đồng phục, ma trận RBAC 5 vai trò).
  * **Viết mới toàn diện tầng hiển thị (Presentation & Layout)**: Áp dụng hệ thống Design System từ `ui-ux-pro-max-skill` với Tokens, Components tái sử dụng, Micro-interactions và chuẩn tiếp cận WCAG 2.1 AA.

---

## 2. Hệ Thống Design System (Chuẩn Hóa Theo UI/UX Pro Max)

### 2.1. Bảng màu thương hiệu (Brand Color Palette — F&B Restaurant Pro)
Được sinh và tối ưu từ công cụ `ui-ux-pro-max`:
* **Primary (Màu chủ đạo - Đỏ thẩm Sen Việt)**: `#DC2626` (Red-600) / Deep Wine `#991B1B` (Sang trọng, kích thích vị giác).
* **Accent / CTA (Vàng kim / Hổ phách)**: `#D97706` (Amber-600) / `#F59E0B` (Nổi bật cho các nút hành động chính).
* **Surface / Background**: `#F8FAFC` (Slate-50) cho Light Mode, `#FFFFFF` cho Card.
* **Text / Foreground**: `#0F172A` (Slate-900) đạt tỷ lệ tương phản > 7:1 (chuẩn AAA).
* **Semantic States**:
  * **Success (Hợp lệ / Hoàn thành)**: `#059669` (Emerald-600).
  * **Warning (Cảnh báo mẻ dở / GPS lệch)**: `#D97706` (Amber-600).
  * **Destructive / Error (Thất thoát đỏ / Báo hỏng)**: `#DC2626` (Red-600).
  * **Info (Thông tin hệ thống)**: `#2563EB` (Blue-600).

### 2.2. Kiểu chữ (Typography Hierarchy)
* **Heading & Display**: `Plus Jakarta Sans` hoặc `Outfit` (Hiện đại, hình khối rõ ràng, thẩm mỹ cao).
* **Body & UI**: `Inter` hoặc `Be Vietnam Pro` (Tối ưu khả năng đọc tiếng Việt trên màn hình nhỏ).
* **Data & Số liệu / Tiền tệ / Định lượng**: `Fira Code` hoặc `JetBrains Mono` (Font số cố định - Tabular figures, thẳng hàng tuyệt đối khi hiển thị số lượng và giá trị tiền).

### 2.3. Quy chuẩn kích thước tương tác (Touch & Accessibility Standards)
* **Kích thước nút bấm**:
  * **Mobile / Kitchen Tablet**: Tối thiểu `48x48px` (riêng 4 nút thao tác bếp đạt `56px - 64px` để đầu bếp đeo găng tay bấm dễ dàng).
  * **Khoảng cách giữa các nút (Spacing)**: Tối thiểu `8px - 12px` để tránh bấm nhầm.
  * **Hiệu ứng chạm (Touch Feedback)**: Co nhẹ khi nhấn (`active:scale-[0.98]`) kết hợp đổi màu viền, phản hồi trong 150ms.
* **100% Biểu tượng chuẩn SVG**: Dùng đồng nhất thư viện **Lucide Icons** với `strokeWidth={1.75}`, tuyệt đối không dùng Emoji làm icon giao diện.

---

## 3. Kiến Trúc Giao Diện Đa Nền Tảng (Responsive Matrix)

| Phân hệ / Màn hình | Phone (< 640px) | Tablet (640px - 1024px) | Desktop / PC (> 1024px) |
| :--- | :--- | :--- | :--- |
| **Shell & Điều hướng** | Bottom Navigation Bar cố định + Top Header rút gọn | Collapsible Rail + Drawer mở rộng | Full Sidebar đa cấp + Breadcrumb + User Profile Card |
| **Bếp 4 Nút & KDS** | Grid 2x2 nút siêu lớn, toàn màn hình, thanh tiến độ mẻ | Bento Grid: 4 Nút thao tác bên trái + Bảng giám sát ra line bên phải | Dashboard bếp tổng thể, hiển thị đồng thời cả 4 trạm chế biến |
| **Kho & Lô Hàng** | **Card List**: Thẻ lô hàng trực quan, cuộn mượt, tìm kiếm nhanh | **Split-Pane**: Danh sách lô bên trái (35%), chi tiết & xuất kho bên phải (65%) | **DataGrid**: Bảng đa cột, ghim tiêu đề, lọc đa tiêu chí, xuất Excel |
| **Đối Soát CukCuk** | **Metric Summary**: Card tổng lệch + Danh sách hóa đơn có cờ đỏ | Bảng đối soát rút gọn, ghim cột "Chênh lệch" | Bảng kế toán chi tiết 10 cột, ghim cố định cột Tên món & Cột Lệch |
| **Chấm Công GPS** | Giao diện Camera toàn màn hình + Vòng radar GPS xanh/đỏ | Khung Camera chuẩn tỉ lệ + Bản đồ tọa độ trực quan | Chế độ quản trị xem lịch sử chấm công và vị trí nhân viên |
| **Lương & Ứng Lương** | Phiếu lương dạng biên lai (Receipt style), nút ứng lương nhanh | Bảng lương 2 cột: Danh sách nhân viên + Chi tiết phiếu lương | Bảng lương Excel-like, ghim trạng thái khóa lương, duyệt hàng loạt |
| **Hộp Thoại (Modals)** | **Bottom Sheet (Drawer)** vuốt xuống để đóng | Dialog căn giữa màn hình hoặc Side-panel trượt | Centered Modal cao cấp kèm hỗ trợ phím `Esc` và phím tắt |

---

## 4. Danh Sách Nhiệm Vụ Chi Tiết (Phase 13 Tasks)

### Task 13.1: Xây Dựng Nền Tảng Design System & Theme Tokens (`MASTER.md`)
* **Mục tiêu**: Tích hợp các bộ quy chuẩn của `ui-ux-pro-max-skill`, cấu hình CSS Variables và Tailwind Theme.
* **Công việc cụ thể**:
  1. Chạy generator của `ui-ux-pro-max` để xuất bản tài liệu thiết kế chuẩn `design-system/MASTER.md`.
  2. Cấu hình màu ngữ nghĩa (semantic colors), font chữ, radius và shadows trong `tailwind.config.js` và `index.css`.
  3. Xây dựng bộ UI Atoms cơ bản: `Button`, `Input`, `Badge`, `Card`, `Drawer`, `Dialog`, `StatusPill`, `ProminentAlert`.
* **Tiêu chí nghiệm thu**: 100% component tuân thủ token, kiểm tra độ tương phản văn bản đạt tối thiểu 4.5:1.

---

### Task 13.2: Tái Thiết Kế Khung Bố Cục Đa Nền Tảng (Adaptive Shell Engine)
* **Mục tiêu**: Một bộ vỏ layout tự động thích ứng thông minh trên Mobile, Tablet và Desktop PC.
* **Công việc cụ thể**:
  1. Viết hook `useDeviceType()` (`isMobile`, `isTablet`, `isDesktop`) dựa trên chuẩn Tailwind breakpoints (`sm`, `md`, `lg`, `xl`).
  2. Xây dựng `AdaptiveShell`:
     * **Mobile**: Bottom Navigation 5 mục chính, header nhẹ có chuông thông báo và chuyển chi nhánh nhanh.
     * **Tablet**: Left Rail thu gọn có thể mở rộng khi chạm, hỗ trợ xoay ngang/dọc.
     * **Desktop**: Sidebar chuyên nghiệp với phân nhóm rõ ràng, ghim góc trên tài khoản & vai trò.
  3. Tích hợp thanh công cụ Demo (`DemoToolbar`) theo dạng floating badge tinh tế, không che khuất nội dung làm việc.
* **Tiêu chí nghiệm thu**: Thử nghiệm resize trình duyệt từ 360px đến 1920px mượt mà, không giật lag, CLS < 0.1.

---

### Task 13.3: Viết Lại Giao Diện Bếp & KDS (Kitchen Display System Pro)
* **Mục tiêu**: Nâng cấp phân hệ Bếp đạt chuẩn POS/KDS công nghiệp nhà hàng Buffet.
* **Công việc cụ thể**:
  1. Thiết kế lại 4 nút bấm lớn (`Lấy hàng`, `Cân mẻ`, `Báo hỏng`, `Ra line +1`):
     * Kích thước nút: 56px - 64px, icon 28px, chữ đậm dễ đọc từ khoảng cách 1 mét.
     * Nút "Ra line +1": Hiệu ứng số nhảy mượt mà, chống bấm đúp (debounce 1500ms) kèm animation tăng chỉ số.
     * Cảnh báo mẻ dở dang: Banner nhấp nháy mềm ở đầu màn hình với nút "Tiếp tục mẻ trước".
  2. Modal Cân mẻ: Input số lượng với bàn phím số cảm ứng lớn (Numpad ảo) tích hợp sẵn phím nhanh (+1kg, +5kg, +10kg).
  3. Modal Báo hỏng: Giao diện chụp ảnh trực tiếp, xem trước và gắn cờ nguyên nhân hỏng rõ ràng.
* **Tiêu chí nghiệm thu**: Đầu bếp thao tác một tay trên điện thoại hoặc máy tính bảng gắn tường cực nhanh và chính xác.

---

### Task 13.4: Tái Cấu Trúc Phân Hệ Kho & Lô Hàng Thích Ứng (Card View vs DataGrid)
* **Mục tiêu**: Quản lý xuất nhập tồn thuận tiện trên điện thoại của thủ kho lẫn màn hình lớn của quản lý.
* **Công việc cụ thể**:
  1. Xây dựng component `AdaptiveDataTable`:
     * Trên Desktop: Bảng lưới dữ liệu cao cấp, ghim tiêu đề (sticky header), phân trang, lọc nhanh theo NCC và Hạn sử dụng.
     * Trên Mobile/Tablet: Tự động chuyển đổi thành danh sách Card sản phẩm với thanh trạng thái tồn kho trực quan (Xanh: Còn an toàn; Vàng: Sắp hết; Đỏ: Quá hạn).
  2. Form tạo Phiếu Nhập / Xuất kho:
     * Mobile: Dạng wizard từng bước (Chọn NCC -> Chọn nguyên liệu -> Nhập số lượng -> Ký nhận).
     * Desktop: Bảng nhập nhiều dòng nhanh (Batch entry).
* **Tiêu chí nghiệm thu**: Xem và xuất nhập kho trên điện thoại không cần cuộn ngang màn hình.

---

### Task 13.5: Nâng Cấp Bảng Đối Soát CukCuk & Chống Thất Thoát (Financial Clarity)
* **Mục tiêu**: Làm nổi bật ngay lập tức các dòng lệch nguyên liệu và thất thoát tài chính.
* **Công việc cụ thể**:
  1. Thẻ KPI tổng quan trên cùng: Doanh thu bán hàng POS, Giá trị nguyên liệu xuất bếp, Mức thất thoát ròng, Tỷ lệ hao hụt trung bình.
  2. Bảng đối soát chi tiết:
     * Cột "Chênh lệch" và "Cảnh báo" được ghim cố định ở vị trí dễ nhìn nhất.
     * Các dòng có sai lệch vượt ngưỡng (>5% hoặc >300.000đ) được đánh dấu bằng nền đỏ nhạt (`bg-red-50 border-red-200`) kèm icon cảnh báo nguy hiểm màu đỏ đậm.
  3. Trên Mobile: Hiển thị bộ lọc nhanh "Chỉ xem các món bị lệch", chạm vào món để mở Bottom Sheet xem phân tích nguyên nhân.
* **Tiêu chí nghiệm thu**: Kế toán và Chủ chuỗi phát hiện điểm bất thường trong vòng 3 giây ngay khi mở trang.

---

### Task 13.6: Nâng Cấp UX Chấm Công GPS & Bảng Lương Minh Bạch
* **Mục tiêu**: Chấm công cảm ứng chuẩn xác, bảng lương rõ ràng, giải quyết triệt để vấn đề thu hồi đồng phục.
* **Công việc cụ thể**:
  1. Giao diện Chấm công:
     * Vòng radar hiển thị khoảng cách GPS theo thời gian thực (Xanh lá: Hợp lệ trong 50m; Đỏ: Ngoài phạm vi).
     * Khung camera selfie có đường dẫn khung tròn hỗ trợ nhân viên canh khuôn mặt chuẩn xác.
  2. Bảng lương & Ứng lương:
     * Thiết kế phiếu lương dạng thẻ (Digital Payslip Card) liệt kê minh bạch: Lương cơ bản, Số công, Thưởng/Phạt, Tiền ứng và Thực lĩnh.
     * Modal khóa lương đồng phục: Thông báo nổi bật với nút tác vụ nhanh "Đã nhận lại đồng phục -> Mở khóa chi lương".
* **Tiêu chí nghiệm thu**: Nhân viên theo dõi ngày công và ứng lương dễ dàng trên điện thoại; Quản trị viên duyệt lương nhanh trên máy tính.

---

### Task 13.7: Kiểm Thử Toàn Diện Accessibility (WCAG 2.1 AA) & Tối Ưu Hiệu Năng
* **Mục tiêu**: Đảm bảo sản phẩm đạt chất lượng UI/UX cao cấp, không lỗi hiển thị trên mọi thiết bị.
* **Công việc cụ thể**:
  1. Rà soát danh mục kiểm tra (Pre-delivery Checklist) từ `ui-ux-pro-max-skill`:
     * [ ] 100% nút bấm và liên kết có `cursor-pointer` và trạng thái `hover` / `active` mượt mà (150-200ms).
     * [ ] Kiểm tra độ tương phản màu sắc chữ đạt tối thiểu 4.5:1.
     * [ ] Hỗ trợ điều hướng bằng bàn phím (`Tab`, `Enter`, `Esc` trên modal).
     * [ ] Kiểm tra độ mượt trên thiết bị di động thật (iOS Safari, Android Chrome).
  2. Đóng gói kiểm tra `npm run build` không phát sinh cảnh báo kích thước chunk quá mức, tải trang ban đầu dưới 1.5 giây.
* **Tiêu chí nghiệm thu**: Giao diện đạt chuẩn chuyên nghiệp, sẵn sàng để khách hàng tự tin trình diễn và triển khai thực tế.
