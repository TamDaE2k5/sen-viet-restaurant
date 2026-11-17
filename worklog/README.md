# QUY CHUẨN GHI NHẬN NHẬT KÝ PHÁT TRIỂN (WORKLOG)
## Dự án: Hệ thống Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát (Sen Việt Buffet)

---

## 1. Mục Đích & Ý Nghĩa Của Worklog

Thư mục `worklog/` là nơi lưu trữ toàn bộ lịch sử tiến trình phát triển dự án theo thời gian thực. Mỗi khi hoàn thành một phần việc, một task hoặc một phiên làm việc quan trọng, Agent hoặc Lập trình viên sẽ ghi lại một bản ghi nhật ký nhằm:
1. **Minh bạch tiến độ**: Ghi nhận chính xác ai đã làm gì, vào thời điểm nào, mã task nào đã hoàn thành.
2. **Theo dõi quyết định kỹ thuật**: Ghi lại lý do tại sao chọn giải pháp kỹ thuật đó, các lỗi phát sinh (nếu có) và cách thức khắc phục.
3. **Chuyển giao mượt mà**: Bất kỳ thành viên nào hoặc phiên làm việc tiếp theo của AI Agent đều có thể nắm bắt ngay trạng thái hiện tại để tiếp tục công việc mà không bị đứt đoạn.

---

## 2. Quy Ước Đặt Tên File Nhật Ký

File nhật ký được đặt theo định dạng chuẩn:
```text
worklog/YYYY-MM-DD_<tên_ngắn_gọn_nội_dung>.md
```

*Ví dụ*:
- `worklog/2026-11-17_init_setup.md`: Khởi tạo dự án, phân tích đặc tả & thiết lập hệ thống task.
- `worklog/2026-11-17_phase1_docker_and_auth.md`: Hoàn thành bộ khung Docker & Spring Security JWT.
- `worklog/2026-11-17_phase2_kitchen_mobile_ui.md`: Hoàn thành màn hình bếp 4 nút & API cân mẻ.

---

## 3. Cấu Trúc Chuẩn Của Một Bản Ghi Nhật Ký

Mỗi file nhật ký nên tuân thủ cấu trúc sau:

```markdown
# Nhật Ký Phát Triển: [Tiêu đề công việc]
- **Thời gian**: YYYY-MM-DD HH:mm (Giờ địa phương)
- **Người thực hiện**: [Tên / AI Agent]
- **Mã Task liên quan**: [Task X.Y trong task/phase-X.md]
- **Trạng thái**: [Hoàn thành / Đang thực hiện / Gặp vướng mắc]

---

### 1. Mục tiêu công việc
Mô tả tóm tắt những gì cần đạt được trong phiên làm việc này.

### 2. Các công việc đã thực hiện
- Liệt kê cụ thể từng file tạo mới hoặc sửa đổi.
- Các tính năng / API / UI components đã hoàn thành.

### 3. Vấn đề phát sinh & Cách giải quyết (nếu có)
- Mô tả lỗi (nếu gặp phải) và giải pháp kỹ thuật đã áp dụng để vượt qua.

### 4. Kết quả kiểm thử & Nghiệm thu
- Kết quả test tự động hoặc manual verification.

### 5. Bước tiếp theo (Next Steps)
- Kế hoạch cho phiên làm việc tiếp theo.
```

---

## 4. Danh Sách Nhật Ký Hiện Có

| Ngày | File nhật ký | Nội dung chính | Trạng thái |
| :---: | :--- | :--- | :---: |
| 2026-11-17 | [2026-11-17_init_setup.md](file:///run/media/tamdae/Data/Source%20code/restaurant_project/worklog/2026-11-17_init_setup.md) | Khởi tạo dự án, phân tích đặc tả, thiết lập gitignore bảo mật & cấu trúc Task/Worklog | ✅ Hoàn thành |
