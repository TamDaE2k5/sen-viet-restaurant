# Giai Đoạn 5: Ứng Lương, Xét Tăng Lương & Bảng Lương Tự Động
> **Mã giai đoạn**: `P5-PAYROLL`  
> **Căn cứ kế hoạch**: [implement_demo_plan.md#2-xét-duyệt-tăng-lương-tự-động-ii2](file:///run/media/tamdae/Data/Source%20code/restaurant_project/implement_demo_plan.md)  
> **Mục tiêu**: Tự động hóa tính toán tiền lương cuối tháng: Xử lý quy trình ứng lương và khấu trừ tự động, tự động xét tăng lương theo kết quả thi quý & kỷ luật chấm công, khóa lương bỏ việc = 0, giữ lương thiếu đồng phục và xuất file chuyển khoản ngân hàng.

---

## Danh Sách Công Việc (Tasks)

- [ ] **Task 5.1: Database Schema Migration cho Ứng Lương & Bảng Lương (V5)**
  - **Mô tả**: Viết script migration `V5__payroll_and_advances_schema.sql` tạo các bảng:
    - `salary_advances` (Số tiền xin ứng, lý do, số tiền thực chi, tháng trừ lương `YYYY-MM`, trạng thái duyệt)
    - `payrolls` (Bảng lương tổng hợp: lương cơ bản, ngày công thực tế, phụ cấp, tăng lương thi đỗ, trừ tạm ứng, giữ lương đồng phục, lương thực lĩnh, cờ bỏ việc)
    - `salary_rules` (Cấu hình công thức lương, định mức phạt đi muộn/nghỉ không phép)
  - **Tiêu chí nghiệm thu**: Tạo bảng thành công trên PostgreSQL, ràng buộc số tiền không âm.
  - **Độ ưu tiên**: P0

- [ ] **Task 5.2: Backend API Đơn Xin Ứng Lương & Quy Trình Duyệt Chi**
  - **Mô tả**: Xây dựng các endpoints:
    - `POST /api/v1/hr/advances`: Nhân viên gửi đơn ứng lương (giới hạn tối đa 1 đơn đang chờ duyệt tại một thời điểm).
    - `PUT /api/v1/hr/advances/{id}/disburse`: Kế toán tổng duyệt chi, nhập **Số tiền thực chi** ($\le$ số tiền xin ứng) và chọn tháng trừ lương.
  - **Tiêu chí nghiệm thu**: Số tiền thực chi được đẩy tự động vào cột tạm ứng của bảng lương tháng được chọn.
  - **Độ ưu tiên**: P0

- [ ] **Task 5.3: Thuật Toán Tự Động Quét Xét Tăng Lương Theo Quý**
  - **Mô tả**: Xây dựng `SalaryIncreaseService`:
    - Quét tự động 3 điều kiện: Tổng điểm thi $\ge 80$ + Số lần đi muộn/về sớm $\le 3$ lần/quý + Không có ngày nghỉ không phép.
    - Trình diện danh sách phân loại **Đủ điều kiện** / **Chưa đủ điều kiện** kèm lý do chi tiết cho Kế toán tổng duyệt.
    - Khi duyệt: Tự động cộng mức tăng vào lương cơ bản từ tháng áp dụng.
  - **Tiêu chí nghiệm thu**: Unit test kiểm tra logic điều kiện tăng lương đúng 100% các tình huống biên.
  - **Độ ưu tiên**: P1

- [ ] **Task 5.4: Động Cơ Tổng Hợp Bảng Lương Tự Động Cuối Tháng**
  - **Mô tả**: Xây dựng service tổng hợp bảng lương chi nhánh:
    - Tổng hợp công thực tế từ bảng `attendances`.
    - Tính: $\text{Thực lĩnh} = (\text{Lương cơ bản} + \text{Tăng lương}) \times \frac{\text{Ngày công}}{26} - \text{Tạm ứng thực chi} - \text{Khấu trừ khác}$.
    - Ràng buộc nhân viên bỏ việc: Ghi nhận lương = 0, loại khỏi chi phí hoạt động.
    - Ràng buộc đồng phục: Chuyển trạng thái `ĐANG_GIỮ_LƯƠNG` nếu nhân viên nghỉ việc chưa hoàn tất bàn giao.
  - **Tiêu chí nghiệm thu**: Bảng lương phản ánh chính xác mọi trường hợp: người làm bình thường, người có tạm ứng, người bỏ việc, người bị giữ lương.
  - **Độ ưu tiên**: P0

- [ ] **Task 5.5: Backend API Xuất Danh Sách Chuyển Khoản Ngân Hàng**
  - **Mô tả**: Xây dựng endpoint `GET /api/v1/hr/payroll/{month}/export-bank`:
    - Tạo file danh sách lệnh chi chuyển khoản ngân hàng (Excel/CSV).
    - Tự động loại trừ toàn bộ nhân viên có trạng thái `ĐANG_GIỮ_LƯƠNG` hoặc `Bỏ việc`.
  - **Tiêu chí nghiệm thu**: File xuất ra có định dạng chuẩn STK, Tên chủ TK, Số tiền thực chi sẵn sàng gửi ngân hàng.
  - **Độ ưu tiên**: P1

- [ ] **Task 5.6: Frontend Dashboard Bảng Lương & Giao Diện Ứng Lương**
  - **Mô tả**: Phát triển giao diện:
    - Mobile UI cho nhân viên: Form xin ứng lương, tra cứu phiếu lương cá nhân chi tiết.
    - Desktop UI cho Kế toán: Bảng lương tháng tổng hợp với đầy đủ cột chi tiết, modal duyệt chi ứng lương nhanh, và nút xuất Excel chuyển khoản.
  - **Tiêu chí nghiệm thu**: Giao diện hiển thị rõ ràng, thao tác duyệt chi cập nhật số liệu tức thì.
  - **Độ ưu tiên**: P0
