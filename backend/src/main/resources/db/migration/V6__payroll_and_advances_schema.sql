-- ==============================================================================
-- Flyway Migration V6: Phân hệ Ứng Lương, Xét Tăng Lương & Bảng Lương Tự Động
-- Dự án: Sen Việt Buffet
-- ==============================================================================

-- 1. Bổ sung thông tin tài khoản ngân hàng và mức lương cơ bản vào bảng users
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(150);
ALTER TABLE users ADD COLUMN IF NOT EXISTS base_salary NUMERIC(15, 2) DEFAULT 7500000.00;

-- Cập nhật thông tin ngân hàng và lương cơ bản cho các tài khoản demo
UPDATE users SET 
    bank_name = 'Vietcombank',
    bank_account_number = '1012345678',
    bank_account_holder = 'NGUYEN VAN BEP',
    base_salary = 8500000.00
WHERE username = 'bep_thainguyen';

UPDATE users SET 
    bank_name = 'Techcombank',
    bank_account_number = '19034567890123',
    bank_account_holder = 'TRAN QUAN LY',
    base_salary = 12000000.00
WHERE username = 'quanly_thainguyen';

UPDATE users SET 
    bank_name = 'MB Bank',
    bank_account_number = '0912345603',
    bank_account_holder = 'LE KE TOAN',
    base_salary = 9000000.00
WHERE username = 'ketoan_thainguyen';

UPDATE users SET 
    bank_name = 'VietinBank',
    bank_account_number = '10887654321',
    bank_account_holder = 'PHAM KE TOAN TONG',
    base_salary = 15000000.00
WHERE username = 'ketoan_tong';

UPDATE users SET 
    bank_name = 'BIDV',
    bank_account_number = '21510001234567',
    bank_account_holder = 'HOANG NHAN VIEN',
    base_salary = 6500000.00
WHERE username = 'nhanvien_quevo';

-- 2. Bảng cấu hình quy tắc tính lương (salary_rules)
CREATE TABLE IF NOT EXISTS salary_rules (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT REFERENCES branches (id) ON DELETE CASCADE,
    standard_work_days NUMERIC(4, 1) NOT NULL DEFAULT 26.0,
    exam_raise_amount NUMERIC(15, 2) NOT NULL DEFAULT 500000.00,
    max_advance_ratio NUMERIC(5, 2) NOT NULL DEFAULT 0.50,
    late_penalty_per_minute NUMERIC(15, 2) NOT NULL DEFAULT 5000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo quy tắc tính lương mẫu cho 2 chi nhánh
INSERT INTO salary_rules (branch_id, standard_work_days, exam_raise_amount, max_advance_ratio, late_penalty_per_minute)
VALUES
    ((SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'), 26.0, 500000.00, 0.50, 5000.00),
    ((SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'), 26.0, 500000.00, 0.50, 5000.00)
ON CONFLICT DO NOTHING;

-- 3. Bảng đơn xin ứng lương (salary_advances)
CREATE TABLE IF NOT EXISTS salary_advances (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    request_date DATE NOT NULL DEFAULT CURRENT_DATE,
    requested_amount NUMERIC(15, 2) NOT NULL CHECK (requested_amount > 0),
    reason TEXT NOT NULL,
    disbursed_amount NUMERIC(15, 2) DEFAULT 0.00,
    deduction_month VARCHAR(7), -- Định dạng 'YYYY-MM'
    status VARCHAR(50) NOT NULL DEFAULT 'CHO_DUYET', -- 'CHO_DUYET', 'DA_DUYET', 'DA_CHI', 'TU_CHOI'
    approved_by_user_id BIGINT REFERENCES users (id),
    approved_at TIMESTAMP WITH TIME ZONE,
    manager_note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_advances_user_id ON salary_advances(user_id);
CREATE INDEX IF NOT EXISTS idx_advances_deduction_month ON salary_advances(deduction_month);
CREATE INDEX IF NOT EXISTS idx_advances_status ON salary_advances(status);

-- 4. Bảng đề xuất xét tăng lương định kỳ (salary_increase_proposals)
CREATE TABLE IF NOT EXISTS salary_increase_proposals (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    exam_quarter VARCHAR(50) NOT NULL,
    exam_score NUMERIC(5, 2) NOT NULL,
    late_count INT NOT NULL DEFAULT 0,
    unexcused_absence_count INT NOT NULL DEFAULT 0,
    is_eligible BOOLEAN NOT NULL DEFAULT FALSE,
    raise_amount NUMERIC(15, 2) NOT NULL DEFAULT 500000.00,
    status VARCHAR(50) NOT NULL DEFAULT 'CHO_DUYET', -- 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI'
    evaluation_details TEXT,
    approved_by_user_id BIGINT REFERENCES users (id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_raise_user_id ON salary_increase_proposals(user_id);

-- 5. Bảng tổng hợp lương tháng (payrolls)
CREATE TABLE IF NOT EXISTS payrolls (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    payroll_month VARCHAR(7) NOT NULL, -- Định dạng 'YYYY-MM'
    base_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    standard_work_days NUMERIC(4, 1) NOT NULL DEFAULT 26.0,
    actual_work_days NUMERIC(4, 1) NOT NULL DEFAULT 0.0,
    salary_raise NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    allowance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    gross_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    advance_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    penalty_deduction NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'CHO_DUYET', -- 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'BO_VIEC', 'DA_THANH_TOAN'
    is_abandoned BOOLEAN NOT NULL DEFAULT FALSE,
    is_uniform_retained BOOLEAN NOT NULL DEFAULT FALSE,
    bank_name VARCHAR(100),
    bank_account_number VARCHAR(50),
    bank_account_holder VARCHAR(150),
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payroll_user_month UNIQUE (user_id, payroll_month)
);

CREATE INDEX IF NOT EXISTS idx_payrolls_month_branch ON payrolls(payroll_month, branch_id);
CREATE INDEX IF NOT EXISTS idx_payrolls_status ON payrolls(status);

-- 6. Nạp dữ liệu tạm ứng mẫu & bảng lương mẫu tháng 2026-11
INSERT INTO salary_advances (user_id, branch_id, request_date, requested_amount, reason, disbursed_amount, deduction_month, status, manager_note)
VALUES
    (
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11-05',
        2000000.00,
        'Gia đình có việc gấp ở quê',
        2000000.00,
        '2026-11',
        'DA_CHI',
        'Đã chuyển khoản thực chi 2.000.000 đ'
    ),
    (
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        '2026-11-10',
        1500000.00,
        'Đóng tiền nhà trọ đầu tháng',
        1500000.00,
        '2026-11',
        'DA_CHI',
        'Đã duyệt chi và khấu trừ vào lương tháng 11/2026'
    )
ON CONFLICT DO NOTHING;

-- Nạp 1 đề xuất tăng lương mẫu cho nhân viên bếp (thi đạt 85 điểm, không vi phạm)
INSERT INTO salary_increase_proposals (user_id, branch_id, exam_quarter, exam_score, late_count, unexcused_absence_count, is_eligible, raise_amount, status, evaluation_details)
VALUES
    (
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'Q4-2026',
        85.00,
        1,
        0,
        true,
        500000.00,
        'CHO_DUYET',
        'Đủ điều kiện: Điểm thi 85/100 (>=80), Đi muộn 1 lần (<=3), Nghỉ không phép 0 ngày'
    )
ON CONFLICT DO NOTHING;
