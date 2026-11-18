-- ====================================================================
-- Flyway Migration V5: Chấm Công GPS Geofencing, Bài Thi Định Kỳ Quý,
-- Tự Động Quét Bỏ Việc & Bàn Giao Đồng Phục Nghỉ Việc
-- ====================================================================

-- 1. Bảng chấm công định vị GPS & Selfie Camera
CREATE TABLE IF NOT EXISTS attendances (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    shift_name VARCHAR(50) NOT NULL DEFAULT 'CA_SANG',
    check_in_time TIMESTAMPTZ NOT NULL,
    check_in_selfie_url TEXT,
    check_in_latitude NUMERIC(10, 7),
    check_in_longitude NUMERIC(10, 7),
    check_in_distance_meters NUMERIC(10, 2) DEFAULT 0,
    is_valid_location BOOLEAN NOT NULL DEFAULT TRUE, -- TRUE nếu khoảng cách <= 100m
    late_minutes INT NOT NULL DEFAULT 0,
    check_out_time TIMESTAMPTZ,
    check_out_selfie_url TEXT,
    check_out_latitude NUMERIC(10, 7),
    check_out_longitude NUMERIC(10, 7),
    check_out_distance_meters NUMERIC(10, 2) DEFAULT 0,
    early_minutes INT NOT NULL DEFAULT 0,
    work_shift_hours NUMERIC(4, 2) DEFAULT 8.00,
    actual_hours NUMERIC(4, 2) DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'DANG_LAM', -- 'DANG_LAM', 'HOAN_THANH', 'VI_PHAM_KHOANG_CACH'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendances_user_date ON attendances(user_id, attendance_date);
CREATE INDEX IF NOT EXISTS idx_attendances_branch_date ON attendances(branch_id, attendance_date);

-- 2. Bảng ngân hàng câu hỏi thi định kỳ theo vị trí chuyên môn
CREATE TABLE IF NOT EXISTS exam_questions (
    id BIGSERIAL PRIMARY KEY,
    position VARCHAR(50) NOT NULL, -- 'BEP', 'PHUC_VU', 'THU_NGAN', 'KHO'
    question_text TEXT NOT NULL,
    option_a TEXT NOT NULL,
    option_b TEXT NOT NULL,
    option_c TEXT NOT NULL,
    option_d TEXT NOT NULL,
    correct_option VARCHAR(5) NOT NULL, -- 'A', 'B', 'C', 'D'
    points INT NOT NULL DEFAULT 10,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_pos ON exam_questions(position, is_active);

-- 3. Bảng kết quả bài thi trắc nghiệm & thực hành
CREATE TABLE IF NOT EXISTS exam_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    exam_quarter VARCHAR(20) NOT NULL DEFAULT 'Q4_2026',
    started_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL DEFAULT 0,
    theory_score NUMERIC(5, 2) NOT NULL DEFAULT 0, -- Thang điểm 100 lý thuyết
    practical_score NUMERIC(5, 2) DEFAULT NULL,    -- Thang điểm 100 thực hành
    total_score NUMERIC(5, 2) DEFAULT 0,
    graded_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    practical_comment TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DA_NOP_LY_THUYET', -- 'DA_NOP_LY_THUYET', 'HOAN_THANH', 'ROT'
    is_passed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_submissions_user ON exam_submissions(user_id, exam_quarter);

-- 4. Bảng danh mục trang thiết bị / đồng phục nhà hàng
CREATE TABLE IF NOT EXISTS uniform_items (
    id BIGSERIAL PRIMARY KEY,
    item_name VARCHAR(100) NOT NULL,
    deposit_value NUMERIC(15, 2) NOT NULL DEFAULT 100000.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Bảng cấp phát và thu hồi đồng phục cho nhân viên
CREATE TABLE IF NOT EXISTS uniform_allocations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    uniform_item_id BIGINT NOT NULL REFERENCES uniform_items(id) ON DELETE CASCADE,
    allocated_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_returned BOOLEAN NOT NULL DEFAULT FALSE,
    returned_date DATE,
    received_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uniform_allocations_user ON uniform_allocations(user_id, is_returned);

-- 6. Bảng đơn xin nghỉ việc & ràng buộc thu hồi đồng phục
CREATE TABLE IF NOT EXISTS resignation_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    is_abandoned BOOLEAN NOT NULL DEFAULT FALSE, -- TRUE nếu tự ý bỏ việc không phép
    status VARCHAR(50) NOT NULL DEFAULT 'CHO_DUYET', -- 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'HOAN_TAT'
    missing_uniform_details VARCHAR(500),
    approved_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    manager_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resignation_user ON resignation_requests(user_id, status);

-- ====================================================================
-- SEED DỮ LIỆU BAN ĐẦU CHO PHÂN HỆ NHÂN SỰ & CHẤM CÔNG
-- ====================================================================

-- 1. Seed danh mục đồng phục
INSERT INTO uniform_items (item_name, deposit_value) VALUES
('Áo Thun Đồng Phục Sen Việt Buffet', 150000.00),
('Tạp Dề Bếp / Phục Vụ Chống Thấm', 80000.00),
('Nón / Mũ Bếp Tiêu Chuẩn Vệ Sinh', 50000.00),
('Thẻ Tên Nhân Viên Từ Tính', 40000.00);

-- 2. Cấp phát đồng phục mẫu cho nhân viên (user_id = 5: nhanvien_quevo, user_id = 1: bep_thainguyen)
INSERT INTO uniform_allocations (user_id, branch_id, uniform_item_id, allocated_date, is_returned) VALUES
(5, 2, 1, CURRENT_DATE - INTERVAL '60 days', FALSE),
(5, 2, 2, CURRENT_DATE - INTERVAL '60 days', FALSE),
(5, 2, 4, CURRENT_DATE - INTERVAL '60 days', FALSE),
(1, 1, 1, CURRENT_DATE - INTERVAL '90 days', FALSE),
(1, 1, 2, CURRENT_DATE - INTERVAL '90 days', FALSE),
(1, 1, 3, CURRENT_DATE - INTERVAL '90 days', FALSE),
(1, 1, 4, CURRENT_DATE - INTERVAL '90 days', FALSE);

-- 3. Seed ngân hàng câu hỏi thi trắc nghiệm (Bếp & Phục vụ)
INSERT INTO exam_questions (position, question_text, option_a, option_b, option_c, option_d, correct_option, points) VALUES
('BEP', 'Định mức hao hụt chuẩn cho phép khi chế biến món Cua Cà Mau hấp là bao nhiêu %?', '10%', '15%', '20%', '30%', 'C', 20),
('BEP', 'Quy tắc an toàn khi phát hiện mẻ chế biến thứ 2 cùng món đang dở dang là gì?', 'Tự ý mở mẻ mới bình thường', 'Cảnh báo đỏ và cần xác nhận để tránh che giấu hao hụt', 'Đổ chung 2 mẻ vào nhau', 'Không cần ghi chép', 'B', 20),
('BEP', 'Nhiệt độ bảo quản tiêu chuẩn của tủ đông chứa hải sản tươi sống là bao nhiêu?', 'Từ 0°C đến 5°C', 'Từ -18°C đến -22°C', 'Từ 10°C đến 15°C', 'Nhiệt độ phòng', 'B', 20),
('BEP', 'Thao tác cần làm ngay khi bấm nút Ra Line (+1) trên điện thoại di động là gì?', 'Bấm liên tục 5 lần', 'Chờ nút phản hồi xong và quan sát đèn trạng thái', 'Tắt kết nối wifi', 'Chụp ảnh gửi kế toán', 'B', 20),
('BEP', 'Ngưỡng giá trị báo hỏng nguyên liệu tự động duyệt không cần Quản lý phê duyệt là bao nhiêu?', '100,000 VNĐ', '200,000 VNĐ', '500,000 VNĐ', '1,000,000 VNĐ', 'C', 20),
('PHUC_VU', 'Khi khách hàng có trẻ em dưới 1m3, hệ thống Sen Việt Buffet áp dụng mức tính nào?', 'Miễn phí hoàn toàn', 'Áp dụng hệ số 50% suất người lớn', 'Tính 100% như người lớn', 'Không phục vụ', 'B', 25),
('PHUC_VU', 'Thời gian tối đa để nhân viên phục vụ dọn đĩa trống tại bàn khách là bao lâu?', 'Trong vòng 3 phút', 'Trong vòng 15 phút', 'Khi khách rời khỏi nhà hàng', 'Không cần dọn', 'A', 25),
('PHUC_VU', 'Khoảng cách GPS tối đa cho phép để ghi nhận chấm công hợp lệ tại nhà hàng là bao nhiêu?', '20 mét', '50 mét', '100 mét', '1000 mét', 'C', 25),
('PHUC_VU', 'Điều kiện bắt buộc để nhân viên nghỉ việc được thanh toán khoản lương giữ lại là gì?', 'Chỉ cần xin phép bằng miệng', 'Đã hoàn tất bàn giao đầy đủ 100% đồng phục đã cấp', 'Bỏ việc tự ý sau 3 ngày', 'Không cần điều kiện', 'B', 25);

-- 4. Seed mẫu bản ghi chấm công hôm nay cho Nguyễn Văn Bếp (Thái Nguyên)
INSERT INTO attendances (
    user_id, branch_id, attendance_date, shift_name, check_in_time,
    check_in_latitude, check_in_longitude, check_in_distance_meters,
    is_valid_location, late_minutes, status, created_at
) VALUES (
    1, 1, CURRENT_DATE, 'CA_SANG', NOW() - INTERVAL '4 hours',
    21.5927000, 105.8442000, 15.50, TRUE, 0, 'DANG_LAM', NOW()
);

-- 5. Seed đơn xin nghỉ việc mẫu cho nhân viên Quế Võ (user_id = 5) đang bị GIỮ LƯƠNG do thiếu áo đồng phục
INSERT INTO resignation_requests (
    user_id, branch_id, request_date, reason, is_abandoned, status,
    missing_uniform_details, manager_note, created_at
) VALUES (
    5, 2, CURRENT_DATE - INTERVAL '2 days',
    'Chuyển nơi cư trú về quê sinh sống cùng gia đình', FALSE, 'DANG_GIU_LUONG',
    'Thiếu 01 Áo Thun Đồng Phục Sen Việt Buffet',
    'Đã bàn giao tạp dề và thẻ tên, hẹn trả áo vào ngày 20/11', NOW()
);
