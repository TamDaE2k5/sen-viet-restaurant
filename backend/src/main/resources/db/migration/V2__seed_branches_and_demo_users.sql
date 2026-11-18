-- ==============================================================================
-- Flyway Migration V2: Nạp dữ liệu 2 chi nhánh mẫu & 5 tài khoản demo tương ứng 5 vai trò
-- Dự án: Sen Việt Buffet
-- Mật khẩu mặc định cho toàn bộ tài khoản demo: Demo@123456
-- ==============================================================================

-- 1. Nạp 2 chi nhánh mẫu: Thái Nguyên & Quế Võ
INSERT INTO branches (branch_code, branch_name, address, phone, latitude, longitude, is_active)
VALUES
    ('CN_THAI_NGUYEN', 'Sen Việt Buffet - Chi nhánh Thái Nguyên', 'Số 123 Đường Hoàng Văn Thụ, TP. Thái Nguyên, Tỉnh Thái Nguyên', '02083888999', 21.5927000, 105.8442000, true),
    ('CN_QUE_VO', 'Sen Việt Buffet - Chi nhánh Quế Võ', 'Khu Đô Thị Mới Nam Sơn, TX. Quế Võ, Tỉnh Bắc Ninh', '02223888777', 21.1485000, 106.1624000, true)
ON CONFLICT (branch_code) DO UPDATE
SET branch_name = EXCLUDED.branch_name,
    address = EXCLUDED.address,
    phone = EXCLUDED.phone;

-- 2. Nạp 5 tài khoản tương ứng 5 vai trò (Mật khẩu hash BCrypt: Demo@123456)
-- Hash: $2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2

INSERT INTO users (username, password, full_name, email, phone, branch_id, status)
VALUES
    (
        'bep_thainguyen',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Nguyễn Văn Bếp (Thái Nguyên)',
        'bep.tn@senvietbuffet.vn',
        '0912345601',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE'
    ),
    (
        'quanly_thainguyen',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Trần Quản Lý (Thái Nguyên)',
        'quanly.tn@senvietbuffet.vn',
        '0912345602',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE'
    ),
    (
        'ketoan_thainguyen',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Lê Kế Toán (Thái Nguyên)',
        'ketoan.tn@senvietbuffet.vn',
        '0912345603',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE'
    ),
    (
        'ketoan_tong',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Phạm Kế Toán Tổng (Admin Chuỗi)',
        'ketoan.tong@senvietbuffet.vn',
        '0912345604',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE'
    ),
    (
        'nhanvien_quevo',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Hoàng Nhân Viên (Quế Võ)',
        'nhanvien.qv@senvietbuffet.vn',
        '0912345605',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        'ACTIVE'
    )
ON CONFLICT (username) DO NOTHING;

-- 3. Gán vai trò cho từng người dùng
-- bep_thainguyen -> ROLE_KITCHEN_STAFF
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'bep_thainguyen' AND r.role_name = 'ROLE_KITCHEN_STAFF'
ON CONFLICT DO NOTHING;

-- quanly_thainguyen -> ROLE_RESTAURANT_MANAGER
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'quanly_thainguyen' AND r.role_name = 'ROLE_RESTAURANT_MANAGER'
ON CONFLICT DO NOTHING;

-- ketoan_thainguyen -> ROLE_BRANCH_ACCOUNTANT
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'ketoan_thainguyen' AND r.role_name = 'ROLE_BRANCH_ACCOUNTANT'
ON CONFLICT DO NOTHING;

-- ketoan_tong -> ROLE_GENERAL_ACCOUNTANT
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'ketoan_tong' AND r.role_name = 'ROLE_GENERAL_ACCOUNTANT'
ON CONFLICT DO NOTHING;

-- nhanvien_quevo -> ROLE_EMPLOYEE
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE u.username = 'nhanvien_quevo' AND r.role_name = 'ROLE_EMPLOYEE'
ON CONFLICT DO NOTHING;
