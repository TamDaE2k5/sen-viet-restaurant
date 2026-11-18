-- ==============================================================================
-- Flyway Migration V11: Bộ Dữ Liệu Mẫu Thực Tế Chuẩn Doanh Nghiệp (Demo Dataset)
-- Phục vụ trình diễn trực quan cho Khách hàng: Chị Vũ Thêm - Sen Việt Buffet
-- Bao gồm: 10 mặt hàng chuẩn, 5 nhà cung cấp, 8 lô nhập, 6 phiếu kho,
--          8 bản ghi đối soát (2 báo đỏ), 8 chấm công GPS, 6 ứng lương, 8 bảng lương
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. BỔ SUNG TÀI KHOẢN NGƯỜI DÙNG PHỤC VỤ KỊCH BẢN DEMO ĐA CHI NHÁNH
-- ------------------------------------------------------------------------------
-- Mật khẩu mặc định: Demo@123456 (Hash BCrypt)
-- $2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2

INSERT INTO users (username, password, full_name, email, phone, branch_id, status, bank_name, bank_account_number, bank_account_holder, base_salary, role)
VALUES
    (
        'bep_quevo',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Lê Văn Bếp (Quế Võ)',
        'bep.qv@senvietbuffet.vn',
        '0912345606',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        'ACTIVE',
        'Vietcombank',
        '1023456789',
        'LE VAN BEP',
        8500000.00,
        'ROLE_KITCHEN_STAFF'
    ),
    (
        'quanly_quevo',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Đỗ Quản Lý (Quế Võ)',
        'quanly.qv@senvietbuffet.vn',
        '0912345607',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        'ACTIVE',
        'Techcombank',
        '19034567890124',
        'DO QUAN LY',
        12000000.00,
        'ROLE_RESTAURANT_MANAGER'
    ),
    (
        'phucvu_thainguyen',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Đặng Thị Phục Vụ (Thái Nguyên)',
        'phucvu.tn@senvietbuffet.vn',
        '0912345608',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE',
        'MB Bank',
        '0912345608',
        'DANG THI PHUC VU',
        6500000.00,
        'ROLE_EMPLOYEE'
    ),
    (
        'thungan_thainguyen',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Bùi Thu Ngân (Thái Nguyên)',
        'thungan.tn@senvietbuffet.vn',
        '0912345609',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE',
        'VPBank',
        '1567890123',
        'BUI THU NGAN',
        7000000.00,
        'ROLE_EMPLOYEE'
    ),
    (
        'nhanvien_nghiviec',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Nguyễn Văn Nghỉ (Thái Nguyên)',
        'nghiviec.tn@senvietbuffet.vn',
        '0912345610',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ACTIVE',
        'Agribank',
        '3100205123456',
        'NGUYEN VAN NGHI',
        6500000.00,
        'ROLE_EMPLOYEE'
    ),
    (
        'nhanvien_boviec',
        '$2b$10$GBQqLl25zculXvs4ZXd1P.0ekFDqlqiHRifnGJbOH9j23Jujm5jG2',
        'Vũ Trọng Bỏ (Quế Võ)',
        'boviec.qv@senvietbuffet.vn',
        '0912345611',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        'INACTIVE',
        'BIDV',
        '21510009876543',
        'VU TRONG BO',
        6500000.00,
        'ROLE_EMPLOYEE'
    )
ON CONFLICT (username) DO UPDATE
SET bank_name = EXCLUDED.bank_name,
    bank_account_number = EXCLUDED.bank_account_number,
    bank_account_holder = EXCLUDED.bank_account_holder,
    base_salary = EXCLUDED.base_salary,
    role = EXCLUDED.role;

-- Gán vai trò cho người dùng mới
INSERT INTO user_roles (user_id, role_id, role_name, assigned_at)
SELECT u.id, r.id, r.role_name, CURRENT_TIMESTAMP
FROM users u, roles r
WHERE (u.username = 'bep_quevo' AND r.role_name IN ('ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE'))
   OR (u.username = 'quanly_quevo' AND r.role_name IN ('ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE'))
   OR (u.username = 'phucvu_thainguyen' AND r.role_name = 'ROLE_EMPLOYEE')
   OR (u.username = 'thungan_thainguyen' AND r.role_name = 'ROLE_EMPLOYEE')
   OR (u.username = 'nhanvien_nghiviec' AND r.role_name = 'ROLE_EMPLOYEE')
   OR (u.username = 'nhanvien_boviec' AND r.role_name = 'ROLE_EMPLOYEE')
ON CONFLICT DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. DANH MỤC 10 MẶT HÀNG & NGUYÊN LIỆU THỰC TẾ (BARCODE, PHÂN LOẠI & ĐỊNH MỨC HAO HỤT)
-- ------------------------------------------------------------------------------
INSERT INTO items (item_code, barcode, item_name, category, unit, cost_price, is_buffet_line, is_daily_only)
VALUES
    ('CUA_CA_MAU', '893000000001', 'Cua Cà Mau (Tươi sống)', 'HAI_SAN', 'KG', 350000.00, true, false),
    ('GHE_PHU_QUOC', '893000000002', 'Ghẹ Phú Quốc (Loại 1)', 'HAI_SAN', 'KG', 280000.00, true, false),
    ('TOM_CANG_XANH', '893000000009', 'Tôm Càng Xanh Tươi Sống', 'HAI_SAN', 'KG', 240000.00, true, false),
    ('BA_CHI_BO_MY', '893000000010', 'Ba Chỉ Bò Mỹ Nhập Khẩu', 'THIT', 'KG', 195000.00, true, false),
    ('MUC_LA_TUOI', '893000000011', 'Mực Lá Tươi Phú Quốc', 'HAI_SAN', 'KG', 180000.00, true, false),
    ('BANH_BAO_THIT', '893000000008', 'Bánh Bao Nhân Thịt Hấp', 'KHAI_VI', 'CAI', 12000.00, true, true),
    ('SALAD_NGA', '893000000007', 'Salad Nga Tươi Sốt Mayonnaise', 'RAU_CU', 'KG', 55000.00, true, true),
    ('KIM_CHI', '893000000004', 'Kim Chi Cải Thảo Hàn Quốc', 'RAU_CU', 'KG', 45000.00, true, true),
    ('NOM_HOA_CHUOI', '893000000012', 'Nộm Hoa Chuối Tai Heo', 'RAU_CU', 'KG', 65000.00, true, true),
    ('NUOC_LAU_THAI', '893000000013', 'Nước Cốt Lẩu Thái Tomyum', 'LAU_NUONG', 'LIT', 50000.00, true, false)
ON CONFLICT (item_code) DO UPDATE
SET barcode = EXCLUDED.barcode,
    item_name = EXCLUDED.item_name,
    category = EXCLUDED.category,
    unit = EXCLUDED.unit,
    cost_price = EXCLUDED.cost_price,
    is_buffet_line = EXCLUDED.is_buffet_line,
    is_daily_only = EXCLUDED.is_daily_only;

-- Cập nhật và bổ sung công thức chế biến kèm định mức hao hụt chuẩn cho 10 mặt hàng
INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Cua Cà Mau Hấp Sả / Gừng', 20.00, 'Chuẩn hao hụt hấp chín tối đa 20%'
FROM items WHERE item_code = 'CUA_CA_MAU'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Ghẹ Phú Quốc Hấp Bia', 18.00, 'Chuẩn hao hụt tối đa 18%'
FROM items WHERE item_code = 'GHE_PHU_QUOC'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Tôm Càng Xanh Nướng Muối Ớt', 15.00, 'Chuẩn hao hụt nướng than hoa 15%'
FROM items WHERE item_code = 'TOM_CANG_XANH'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Ba Chỉ Bò Mỹ Nướng Sốt Galbi', 12.00, 'Chuẩn hao hụt sơ chế tẩm sốt 12%'
FROM items WHERE item_code = 'BA_CHI_BO_MY'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Mực Lá Hấp Hành Gừng', 16.00, 'Chuẩn hao hụt làm sạch và hấp 16%'
FROM items WHERE item_code = 'MUC_LA_TUOI'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Bánh Bao Thịt Hấp Nóng', 5.00, 'Hao hụt bay hơi khi hấp tủ giữ nhiệt 5%'
FROM items WHERE item_code = 'BANH_BAO_THIT'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Salad Nga Trộn Tươi Ca Ngày', 8.00, 'Hao hụt gọt vỏ luộc củ quả và ra nước 8%'
FROM items WHERE item_code = 'SALAD_NGA'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Kim Chi Cải Thảo Muối Chua Cay', 5.00, 'Hao hụt ra nước và cắt gọt gốc 5%'
FROM items WHERE item_code = 'KIM_CHI'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Nộm Hoa Chuối Tai Heo Chua Ngọt', 10.00, 'Hao hụt vắt ráo hoa chuối và tai heo 10%'
FROM items WHERE item_code = 'NOM_HOA_CHUOI'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);

INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Nước Cốt Lẩu Thái Chua Cay Chuẩn Vị', 10.00, 'Hao hụt cô đặc khi đun sôi liên tục 10%'
FROM items WHERE item_code = 'NUOC_LAU_THAI'
  AND NOT EXISTS (SELECT 1 FROM recipes WHERE item_id = items.id);


-- ------------------------------------------------------------------------------
-- 3. DANH MỤC 5 NHÀ CUNG CẤP CHUẨN (MÃ NCC, NGƯỜI ĐẠI DIỆN & MÃ SỐ THUẾ)
-- ------------------------------------------------------------------------------
INSERT INTO suppliers (supplier_code, supplier_name, phone, address, contact_person, email, tax_code, status)
VALUES
    ('NCC-QN01', 'Hải Sản Quảng Ninh', '0912345678', 'Cảng Cá Hạ Long, TP. Hạ Long, Tỉnh Quảng Ninh', 'Nguyễn Văn Tuấn', 'tuankd@haisanqn.vn', '0102030405', 'HOAT_DONG'),
    ('NCC-CM02', 'Hải Sản Cà Mau Đặc Sản', '0987654321', 'Thị Trấn Năm Căn, Huyện Năm Căn, Tỉnh Cà Mau', 'Trần Văn Cà', 'info@haisancamau.vn', '0506070809', 'HOAT_DONG'),
    ('NCC-HN03', 'Thực Phẩm Tươi Sống Hà Nội', '0901122334', 'Khu Công Nghiệp Vĩnh Tuy, Quận Hoàng Mai, TP. Hà Nội', 'Lê Thị Thu', 'thucphamhn@gmail.com', '0109988776', 'HOAT_DONG'),
    ('NCC-DL04', 'Nông Sản & Rau Sạch Đà Lạt', '0933445566', 'Xã Hiệp An, Huyện Đức Trọng, Tỉnh Lâm Đồng', 'Phạm Hồng Thái', 'dalatfarm@dalat.vn', '5800112233', 'HOAT_DONG'),
    ('NCC-MB05', 'Gia Vị & Đồ Khô Miền Bắc', '0945678901', 'Cụm Kho Bãi Phúc Đồng, Quận Long Biên, TP. Hà Nội', 'Hoàng Đình Bắc', 'mienbacspices@gmail.com', '0108877665', 'HOAT_DONG')
ON CONFLICT (supplier_code) DO UPDATE
SET supplier_name = EXCLUDED.supplier_name,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    contact_person = EXCLUDED.contact_person,
    email = EXCLUDED.email,
    tax_code = EXCLUDED.tax_code,
    status = EXCLUDED.status;


-- ------------------------------------------------------------------------------
-- 4. DANH SÁCH 8 LÔ NHẬP HÀNG (LOT-202611-001 ĐẾN LOT-202611-008)
-- ------------------------------------------------------------------------------
INSERT INTO import_batches (batch_code, supplier_id, item_id, branch_id, import_date, expiry_date, initial_quantity, current_stock, unit_price, unit, status)
VALUES
    -- Lô 1: Cua Cà Mau - Chi nhánh Thái Nguyên (Nhà cung cấp Quảng Ninh)
    (
        'LOT-202611-001',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-QN01'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '4 days',
        100.000, 85.000, 350000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 2: Ghẹ Phú Quốc - Chi nhánh Thái Nguyên (Nhà cung cấp Cà Mau)
    (
        'LOT-202611-002',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-CM02'),
        (SELECT id FROM items WHERE item_code = 'GHE_PHU_QUOC'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '3 days',
        80.000, 65.000, 280000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 3: Tôm Càng Xanh - Chi nhánh Thái Nguyên (Nhà cung cấp Quảng Ninh)
    (
        'LOT-202611-003',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-QN01'),
        (SELECT id FROM items WHERE item_code = 'TOM_CANG_XANH'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '4 days',
        120.000, 90.000, 240000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 4: Ba Chỉ Bò Mỹ - Chi nhánh Thái Nguyên (Nhà cung cấp Hà Nội)
    (
        'LOT-202611-004',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-HN03'),
        (SELECT id FROM items WHERE item_code = 'BA_CHI_BO_MY'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '4 days',
        CURRENT_DATE + INTERVAL '20 days',
        150.000, 110.000, 195000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 5: Mực Lá Tươi - Chi nhánh Quế Võ (Nhà cung cấp Quảng Ninh)
    (
        'LOT-202611-005',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-QN01'),
        (SELECT id FROM items WHERE item_code = 'MUC_LA_TUOI'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '2 days',
        CURRENT_DATE + INTERVAL '5 days',
        90.000, 75.000, 180000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 6: Cua Cà Mau - Chi nhánh Quế Võ (Nhà cung cấp Cà Mau)
    (
        'LOT-202611-006',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-CM02'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '3 days',
        CURRENT_DATE + INTERVAL '4 days',
        70.000, 50.000, 350000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 7: Salad Nga - Chi nhánh Quế Võ (Nhà cung cấp Đà Lạt Farm)
    (
        'LOT-202611-007',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-DL04'),
        (SELECT id FROM items WHERE item_code = 'SALAD_NGA'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '1 days',
        CURRENT_DATE + INTERVAL '2 days',
        50.000, 40.000, 55000.00, 'KG', 'CON_HANG'
    ),
    -- Lô 8: Nước Lẩu Thái - Chi nhánh Quế Võ (Nhà cung cấp Miền Bắc)
    (
        'LOT-202611-008',
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-MB05'),
        (SELECT id FROM items WHERE item_code = 'NUOC_LAU_THAI'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '5 days',
        CURRENT_DATE + INTERVAL '25 days',
        200.000, 160.000, 50000.00, 'LIT', 'CON_HANG'
    )
ON CONFLICT (batch_code) DO UPDATE
SET current_stock = EXCLUDED.current_stock,
    unit_price = EXCLUDED.unit_price,
    status = EXCLUDED.status;

-- Cập nhật đồng bộ tồn kho inventory_stocks cho cả 8 lô
INSERT INTO inventory_stocks (branch_id, item_id, batch_id, quantity, last_updated_at)
SELECT ib.branch_id, ib.item_id, ib.id, ib.current_stock, NOW()
FROM import_batches ib
WHERE ib.batch_code IN ('LOT-202611-001', 'LOT-202611-002', 'LOT-202611-003', 'LOT-202611-004',
                        'LOT-202611-005', 'LOT-202611-006', 'LOT-202611-007', 'LOT-202611-008')
ON CONFLICT (branch_id, item_id, batch_id) DO UPDATE
SET quantity = EXCLUDED.quantity,
    last_updated_at = NOW();


-- ------------------------------------------------------------------------------
-- 5. DANH MỤC 6 PHIẾU KHO (4 PHIẾU NHẬP, 2 PHIẾU XUẤT CHUYỂN / HỦY) KÈM CHI TIẾT
-- ------------------------------------------------------------------------------
INSERT INTO warehouse_documents (doc_type, doc_code, branch_id, supplier_id, created_by_user_id, status, note, total_amount, created_at)
VALUES
    -- Phiếu 1: Nhập kho Cua Cà Mau - Thái Nguyên (Sáng sớm)
    (
        'NHAP',
        'PN-TN-202611-001',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-QN01'),
        (SELECT id FROM users WHERE username = 'ketoan_thainguyen'),
        'HOAN_THANH',
        'Nhập hải sản tươi sống sáng sớm (Cua Cà Mau loại 1)',
        35000000.00,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    -- Phiếu 2: Nhập kho Ba Chỉ Bò Mỹ - Thái Nguyên
    (
        'NHAP',
        'PN-TN-202611-002',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-HN03'),
        (SELECT id FROM users WHERE username = 'ketoan_thainguyen'),
        'HOAN_THANH',
        'Nhập thịt bò Mỹ đông lạnh nguyên tảng kèm giấy kiểm dịch',
        29250000.00,
        CURRENT_TIMESTAMP - INTERVAL '4 days'
    ),
    -- Phiếu 3: Nhập kho Cua Cà Mau - Quế Võ
    (
        'NHAP',
        'PN-QV-202611-001',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-CM02'),
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        'HOAN_THANH',
        'Nhập hải sản tươi sống chi nhánh Quế Võ (Cua Năm Căn sống)',
        24500000.00,
        CURRENT_TIMESTAMP - INTERVAL '3 days'
    ),
    -- Phiếu 4: Nhập kho Nước Lẩu Thái - Quế Võ
    (
        'NHAP',
        'PN-QV-202611-002',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM suppliers WHERE supplier_code = 'NCC-MB05'),
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        'HOAN_THANH',
        'Nhập nước cốt lẩu Thái Tomyum đóng can 20L nguyên niêm phong',
        10000000.00,
        CURRENT_TIMESTAMP - INTERVAL '5 days'
    ),
    -- Phiếu 5: Xuất điều chuyển Tôm Càng Xanh - Thái Nguyên (Ca tối)
    (
        'XUAT_CHUYEN',
        'PX-TN-202611-001',
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        NULL,
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        'HOAN_THANH',
        'Xuất điều chuyển hỗ trợ bếp chính và quầy line nướng ca tối',
        4800000.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    ),
    -- Phiếu 6: Xuất hủy Mực Lá Tươi do nhiệt độ bảo quản - Quế Võ
    (
        'HUY',
        'PH-QV-202611-001',
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        NULL,
        (SELECT id FROM users WHERE username = 'quanly_quevo'),
        'HOAN_THANH',
        'Xuất hủy nguyên liệu do tủ cấp đông lỗi cảm biến nhiệt độ',
        900000.00,
        CURRENT_TIMESTAMP - INTERVAL '1 day'
    )
ON CONFLICT (doc_code) DO UPDATE
SET status = EXCLUDED.status,
    total_amount = EXCLUDED.total_amount,
    note = EXCLUDED.note;

-- Bổ sung chi tiết phiếu kho warehouse_document_items
DELETE FROM warehouse_document_items
WHERE document_id IN (SELECT id FROM warehouse_documents WHERE doc_code IN (
    'PN-TN-202611-001', 'PN-TN-202611-002', 'PN-QV-202611-001',
    'PN-QV-202611-002', 'PX-TN-202611-001', 'PH-QV-202611-001'
));

INSERT INTO warehouse_document_items (document_id, item_id, batch_id, quantity, unit_price, note)
VALUES
    -- Chi tiết Phiếu 1
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PN-TN-202611-001'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-001'),
        100.000, 350000.00, 'Kiểm tra độ tươi sống đạt 100%, dây buộc nhẹ'
    ),
    -- Chi tiết Phiếu 2
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PN-TN-202611-002'),
        (SELECT id FROM items WHERE item_code = 'BA_CHI_BO_MY'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-004'),
        150.000, 195000.00, 'Thịt nguyên tảng đóng gói chân không, hạn dùng xa'
    ),
    -- Chi tiết Phiếu 3
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PN-QV-202611-001'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-006'),
        70.000, 350000.00, 'Cua Cà Mau loại 1 sống khỏe, đạt quy cách'
    ),
    -- Chi tiết Phiếu 4
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PN-QV-202611-002'),
        (SELECT id FROM items WHERE item_code = 'NUOC_LAU_THAI'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-008'),
        200.000, 50000.00, '10 can loại 20L nguyên tem mác nhà sản xuất'
    ),
    -- Chi tiết Phiếu 5
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PX-TN-202611-001'),
        (SELECT id FROM items WHERE item_code = 'TOM_CANG_XANH'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-003'),
        20.000, 240000.00, 'Xuất phục vụ quầy line hải sản nướng ca tối'
    ),
    -- Chi tiết Phiếu 6
    (
        (SELECT id FROM warehouse_documents WHERE doc_code = 'PH-QV-202611-001'),
        (SELECT id FROM items WHERE item_code = 'MUC_LA_TUOI'),
        (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-005'),
        5.000, 180000.00, 'Mực đổi màu do tụt lạnh; có biên bản kiểm tra'
    );


-- ------------------------------------------------------------------------------
-- 6. DỮ LIỆU ĐỐI SOÁT CUỐI NGÀY: 8 BẢN GHI (6 KHỚP CHUẨN, 2 TÔ ĐỎ BÁO THẤT THOÁT)
-- Phục vụ demo trực quan động cơ chống thất thoát cho Chủ chuỗi & Kế toán
-- ------------------------------------------------------------------------------
-- Làm sạch các bản ghi đối soát ngày hôm nay để đảm bảo danh sách chuẩn xác 8 bản ghi
DELETE FROM daily_reconciliations WHERE recon_date = CURRENT_DATE;

INSERT INTO daily_reconciliations (
    branch_id, item_id, recon_date, shift_type,
    exported_qty, guest_consumption_qty, processing_loss_qty, reported_damage_qty,
    unexplained_loss_qty, unexplained_loss_amount, unexplained_loss_rate,
    actual_consumption_per_guest, is_over_threshold, responsible_user_name, status, created_at
)
VALUES
    -- =================== CHI NHÁNH THÁI NGUYÊN (4 Món) ===================
    -- 1. [BÁO ĐỎ RỰC RỠ] Cua Cà Mau: Thất thoát 6.5 kg = 2.275.000 đ (13.0%) > 5% & > 300.000 đ
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        CURRENT_DATE,
        'CA_NGAY',
        50.000, 30.000, 10.000, 3.500,
        6.500, 2275000.00, 13.00,
        0.2500, TRUE, 'Nguyễn Văn Bếp (Thái Nguyên)', 'DA_CANH_BAO_ZALO', NOW()
    ),
    -- 2. Ghẹ Phú Quốc: Khớp chuẩn (Lệch 0.5 kg = 140.000 đ - 2.0%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM items WHERE item_code = 'GHE_PHU_QUOC'),
        CURRENT_DATE,
        'CA_NGAY',
        25.000, 20.000, 4.500, 0.000,
        0.500, 140000.00, 2.00,
        0.1667, FALSE, 'Lê Kế Toán (Thái Nguyên)', 'DA_CHOT', NOW()
    ),
    -- 3. Tôm Càng Xanh: Khớp chuẩn (Lệch 0.3 kg = 72.000 đ - 1.0%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM items WHERE item_code = 'TOM_CANG_XANH'),
        CURRENT_DATE,
        'CA_NGAY',
        30.000, 25.000, 4.500, 0.200,
        0.300, 72000.00, 1.00,
        0.2000, FALSE, 'Lê Kế Toán (Thái Nguyên)', 'DA_CHOT', NOW()
    ),
    -- 4. Ba Chỉ Bò Mỹ: Khớp chuẩn (Lệch 0.8 kg = 156.000 đ - 2.0%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM items WHERE item_code = 'BA_CHI_BO_MY'),
        CURRENT_DATE,
        'CA_NGAY',
        40.000, 35.000, 4.200, 0.000,
        0.800, 156000.00, 2.00,
        0.2667, FALSE, 'Lê Kế Toán (Thái Nguyên)', 'DA_CHOT', NOW()
    ),

    -- =================== CHI NHÁNH QUẾ VÕ (4 Món) ===================
    -- 5. [BÁO ĐỎ RỰC RỠ] Cua Cà Mau: Thất thoát 4.5 kg = 1.575.000 đ (12.86%) > 5% & > 300.000 đ
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
        CURRENT_DATE,
        'CA_NGAY',
        35.000, 22.000, 7.000, 1.500,
        4.500, 1575000.00, 12.86,
        0.2800, TRUE, 'Lê Văn Bếp (Quế Võ)', 'DA_CANH_BAO_ZALO', NOW()
    ),
    -- 6. Mực Lá Tươi: Khớp chuẩn (Lệch 0.3 kg = 54.000 đ - 1.5%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM items WHERE item_code = 'MUC_LA_TUOI'),
        CURRENT_DATE,
        'CA_NGAY',
        20.000, 16.500, 3.200, 0.000,
        0.300, 54000.00, 1.50,
        0.1800, FALSE, 'Hoàng Nhân Viên (Quế Võ)', 'DA_CHOT', NOW()
    ),
    -- 7. Kim Chi Cải Thảo: Khớp chuẩn (Lệch 0.2 kg = 9.000 đ - 1.33%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM items WHERE item_code = 'KIM_CHI'),
        CURRENT_DATE,
        'CA_NGAY',
        15.000, 14.000, 0.800, 0.000,
        0.200, 9000.00, 1.33,
        0.1500, FALSE, 'Hoàng Nhân Viên (Quế Võ)', 'DA_CHOT', NOW()
    ),
    -- 8. Salad Nga: Khớp chuẩn (Lệch 0.2 kg = 11.000 đ - 1.11%)
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        (SELECT id FROM items WHERE item_code = 'SALAD_NGA'),
        CURRENT_DATE,
        'CA_NGAY',
        18.000, 16.000, 1.500, 0.300,
        0.200, 11000.00, 1.11,
        0.1700, FALSE, 'Hoàng Nhân Viên (Quế Võ)', 'DA_CHOT', NOW()
    );

-- Ghi nhận log cảnh báo Zalo Bot tương ứng 2 mẻ báo đỏ
INSERT INTO notification_logs (branch_id, channel, recipient, title, content, status, created_at)
VALUES
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        'ZALO_WEBHOOK',
        'Nhóm Ban Giám Đốc & Kế Toán Chuỗi',
        '🚨 CẢNH BÁO THẤT THOÁT VƯỢT ĐỊNH MỨC TẠI THÁI NGUYÊN',
        'Phát hiện thất thoát ngày hôm nay: Món [Cua Cà Mau] thất thoát 6.5 kg tương đương 2,275,000 đ (Tỷ lệ lệch 13.00% > 5%). Người kiểm kho: Nguyễn Văn Bếp.',
        'SENT',
        NOW()
    ),
    (
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        'ZALO_WEBHOOK',
        'Nhóm Ban Giám Đốc & Kế Toán Chuỗi',
        '🚨 CẢNH BÁO THẤT THOÁT VƯỢT ĐỊNH MỨC TẠI QUẾ VÕ',
        'Phát hiện thất thoát ngày hôm nay: Món [Cua Cà Mau] thất thoát 4.5 kg tương đương 1,575,000 đ (Tỷ lệ lệch 12.86% > 5%). Người kiểm kho: Lê Văn Bếp.',
        'SENT',
        NOW()
    );


-- ------------------------------------------------------------------------------
-- 7. CHẤM CÔNG GPS: 8 BẢN GHI (1 CẢNH BÁO KHOẢNG CÁCH >100M, 1 ĐI MUỘN 25 PHÚT)
-- ------------------------------------------------------------------------------
DELETE FROM attendances WHERE attendance_date = CURRENT_DATE;

INSERT INTO attendances (
    user_id, branch_id, attendance_date, shift_name,
    check_in_time, check_in_latitude, check_in_longitude, check_in_distance_meters,
    is_valid_location, late_minutes, check_out_time, actual_hours, status, created_at
)
VALUES
    -- 1. Bếp Thái Nguyên: Đúng giờ, vị trí hợp lệ (18.5m)
    (
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 55 minutes'), 21.5927500, 105.8442800, 18.50,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 2. Quản lý Thái Nguyên: Đúng giờ, vị trí hợp lệ (12.0m)
    (
        (SELECT id FROM users WHERE username = 'quanly_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 50 minutes'), 21.5927200, 105.8442400, 12.00,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours 5 minutes'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 3. Kế toán Thái Nguyên: Đúng giờ, vị trí hợp lệ (25.0m)
    (
        (SELECT id FROM users WHERE username = 'ketoan_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 58 minutes'), 21.5928100, 105.8443500, 25.00,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 4. Phục vụ Thái Nguyên: [ĐI MUỘN 25 PHÚT] Ca tối 17:00, check-in lúc 17:25
    (
        (SELECT id FROM users WHERE username = 'phucvu_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE, 'CA_TOI',
        (CURRENT_DATE + INTERVAL '17 hours 25 minutes'), 21.5927400, 105.8442600, 22.00,
        TRUE, 25, NULL, 0.00, 'DANG_LAM', NOW()
    ),
    -- 5. Nhân viên Quế Võ: Đúng giờ, vị trí hợp lệ (15.0m)
    (
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 52 minutes'), 21.1485600, 106.1624500, 15.00,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 6. Bếp Quế Võ: Đúng giờ, vị trí hợp lệ (30.0m)
    (
        (SELECT id FROM users WHERE username = 'bep_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 45 minutes'), 21.1486500, 106.1625800, 30.00,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 7. Quản lý Quế Võ: Đúng giờ, vị trí hợp lệ (10.5m)
    (
        (SELECT id FROM users WHERE username = 'quanly_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '7 hours 50 minutes'), 21.1485200, 106.1624300, 10.50,
        TRUE, 0, (CURRENT_DATE + INTERVAL '16 hours 10 minutes'), 8.00, 'HOAN_THANH', NOW()
    ),
    -- 8. [CẢNH BÁO NGOÀI CHI NHÁNH 185M] Check-in vi phạm khoảng cách GPS > 100m
    (
        (SELECT id FROM users WHERE username = 'nhanvien_boviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE, 'CA_SANG',
        (CURRENT_DATE + INTERVAL '8 hours 5 minutes'), 21.1501000, 106.1639000, 185.00,
        FALSE, 0, NULL, 0.00, 'VI_PHAM_KHOANG_CACH', NOW()
    );


-- ------------------------------------------------------------------------------
-- 8. ĐƠN XIN ỨNG LƯƠNG: 6 BẢN GHI (CHO_DUYET, DA_CHI VỚI THỰC CHI <= XIN, TU_CHOI)
-- ------------------------------------------------------------------------------
DELETE FROM salary_advances WHERE deduction_month = '2026-11';

INSERT INTO salary_advances (
    user_id, branch_id, request_date, requested_amount, reason,
    disbursed_amount, deduction_month, status, manager_note, created_at
)
VALUES
    -- 1. [DA_CHI]: Xin 2.000.000 đ, thực chi 2.000.000 đ
    (
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '10 days',
        2000000.00,
        'Gia đình có việc gấp ở quê',
        2000000.00,
        '2026-11',
        'DA_CHI',
        'Đã chuyển khoản thực chi 2.000.000 đ qua Vietcombank',
        NOW() - INTERVAL '10 days'
    ),
    -- 2. [DA_CHI]: Xin 3.000.000 đ, thực chi 2.500.000 đ (thực chi <= yêu cầu theo hạn mức công)
    (
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '8 days',
        3000000.00,
        'Đóng tiền học phí đầu năm cho con',
        2500000.00,
        '2026-11',
        'DA_CHI',
        'Hạn mức công thực tế cho phép chi tối đa 2.500.000 đ; đã giải ngân thực chi 2.500.000 đ',
        NOW() - INTERVAL '8 days'
    ),
    -- 3. [CHO_DUYET]: Đơn mới gửi ca sáng
    (
        (SELECT id FROM users WHERE username = 'phucvu_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '2 days',
        1500000.00,
        'Chi phí khám chữa bệnh phát sinh',
        0.00,
        '2026-11',
        'CHO_DUYET',
        NULL,
        NOW() - INTERVAL '2 days'
    ),
    -- 4. [CHO_DUYET]: Đơn mới gửi từ Bếp Quế Võ
    (
        (SELECT id FROM users WHERE username = 'bep_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '3 days',
        2000000.00,
        'Sửa chữa xe máy hỏng trên đường đi làm',
        0.00,
        '2026-11',
        'CHO_DUYET',
        NULL,
        NOW() - INTERVAL '3 days'
    ),
    -- 5. [TU_CHOI]: Chưa đủ ngày công tối thiểu
    (
        (SELECT id FROM users WHERE username = 'thungan_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '5 days',
        4000000.00,
        'Mua sắm thiết bị điện thoại cá nhân',
        0.00,
        '2026-11',
        'TU_CHOI',
        'Từ chối: Chưa tích lũy đủ 15 ngày công trong tháng và lý do không thuộc diện khẩn cấp',
        NOW() - INTERVAL '5 days'
    ),
    -- 6. [TU_CHOI]: Nhân viên có dấu hiệu bỏ việc
    (
        (SELECT id FROM users WHERE username = 'nhanvien_boviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '12 days',
        5000000.00,
        'Chi tiêu việc riêng gia đình',
        0.00,
        '2026-11',
        'TU_CHOI',
        'Từ chối: Nhân viên có biểu hiện nghỉ không phép nhiều ngày, đang trong diện xem xét kỷ luật',
        NOW() - INTERVAL '12 days'
    );


-- ------------------------------------------------------------------------------
-- 9. TỔNG HỢP BẢNG LƯƠNG THÁNG: 8 BẢN GHI (1 GIỮ LƯƠNG ĐỒNG PHỤC, 1 BỎ VIỆC = 0 Đ)
-- ------------------------------------------------------------------------------
DELETE FROM payrolls WHERE payroll_month = '2026-11';

INSERT INTO payrolls (
    user_id, branch_id, payroll_month,
    base_salary, standard_work_days, actual_work_days,
    salary_raise, allowance, gross_salary,
    advance_deduction, penalty_deduction, net_salary,
    status, is_abandoned, is_uniform_retained, excluded_from_cost,
    hold_reason, bank_name, bank_account_number, bank_account_holder, note, created_at
)
VALUES
    -- 1. Bếp Thái Nguyên: Làm đủ công 26 ngày, tăng lương thi nghề 500k, phụ cấp 500k, trừ ứng 2tr -> Thực lĩnh 7.5tr
    (
        (SELECT id FROM users WHERE username = 'bep_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        8500000.00, 26.0, 26.0,
        500000.00, 500000.00, 9500000.00,
        2000000.00, 0.00, 7500000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'Vietcombank', '1012345678', 'NGUYEN VAN BEP', 'Đạt điểm thi tay nghề Quý 4 (85 điểm)', NOW()
    ),
    -- 2. Quản lý Thái Nguyên: Lương 12tr, phụ cấp trách nhiệm 1tr -> Thực lĩnh 13tr
    (
        (SELECT id FROM users WHERE username = 'quanly_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        12000000.00, 26.0, 26.0,
        0.00, 1000000.00, 13000000.00,
        0.00, 0.00, 13000000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'Techcombank', '19034567890123', 'TRAN QUAN LY', 'Hoàn thành tốt chỉ tiêu quản trị kho bếp', NOW()
    ),
    -- 3. Kế toán Thái Nguyên: Lương 9tr, phụ cấp 500k -> Thực lĩnh 9.5tr
    (
        (SELECT id FROM users WHERE username = 'ketoan_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        9000000.00, 26.0, 26.0,
        0.00, 500000.00, 9500000.00,
        0.00, 0.00, 9500000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'MB Bank', '0912345603', 'LE KE TOAN', 'Đối soát CukCuk đầy đủ', NOW()
    ),
    -- 4. Phục vụ Thái Nguyên: Làm 25 công, phụ cấp 300k, phạt đi muộn 25p (125k) -> Thực lĩnh 6.425.000 đ
    (
        (SELECT id FROM users WHERE username = 'phucvu_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        6500000.00, 26.0, 25.0,
        0.00, 300000.00, 6550000.00,
        0.00, 125000.00, 6425000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'MB Bank', '0912345608', 'DANG THI PHUC VU', 'Trừ phạt 25 phút đi muộn (5.000 đ/phút)', NOW()
    ),
    -- 5. Thu ngân Thái Nguyên: Làm 26 công, phụ cấp 300k -> Thực lĩnh 7.300.000 đ
    (
        (SELECT id FROM users WHERE username = 'thungan_thainguyen'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        7000000.00, 26.0, 26.0,
        0.00, 300000.00, 7300000.00,
        0.00, 0.00, 7300000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'VPBank', '1567890123', 'BUI THU NGAN', 'Khớp đúng doanh thu tiền mặt ca trực', NOW()
    ),
    -- 6. Nhân viên Quế Võ: Làm 25 công, phụ cấp 300k, trừ ứng lương 2.5tr -> Thực lĩnh 4.050.000 đ
    (
        (SELECT id FROM users WHERE username = 'nhanvien_quevo'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        '2026-11',
        6500000.00, 26.0, 25.0,
        0.00, 300000.00, 6550000.00,
        2500000.00, 0.00, 4050000.00,
        'CHO_DUYET', FALSE, FALSE, FALSE,
        NULL, 'BIDV', '21510001234567', 'HOANG NHAN VIEN', 'Khấu trừ ứng lương tháng 11/2026', NOW()
    ),
    -- 7. [GIỮ LƯƠNG DO THIẾU ĐỒNG PHỤC]: Nhân viên nghỉ việc chưa bàn giao đủ
    (
        (SELECT id FROM users WHERE username = 'nhanvien_nghiviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        '2026-11',
        6500000.00, 26.0, 24.0,
        0.00, 300000.00, 6300000.00,
        0.00, 0.00, 6300000.00,
        'DANG_GIU_LUONG', FALSE, TRUE, FALSE,
        'Đang giữ — thiếu 1 Tạp dề, 1 Nón',
        'Agribank', '3100205123456', 'NGUYEN VAN NGHI',
        'Nhân viên nghỉ việc chưa hoàn tất bàn giao đồng phục theo quy định', NOW()
    ),
    -- 8. [BỎ VIỆC KHÔNG TRẢ LƯƠNG - EXCLUDED FROM COST]: Lương = 0 đ, tách khỏi chi phí
    (
        (SELECT id FROM users WHERE username = 'nhanvien_boviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        '2026-11',
        6500000.00, 26.0, 18.0,
        0.00, 0.00, 4500000.00,
        0.00, 0.00, 0.00,
        'BO_VIEC', TRUE, FALSE, TRUE,
        NULL,
        'BIDV', '21510009876543', 'VU TRONG BO',
        'Bỏ việc — không trả theo quy định', NOW()
    );

-- Đồng bộ bảng đơn nghỉ việc resignation_requests để khớp lý do giữ lương và bỏ việc
INSERT INTO resignation_requests (user_id, branch_id, request_date, reason, is_abandoned, status, missing_uniform_details, manager_note, created_at)
VALUES
    (
        (SELECT id FROM users WHERE username = 'nhanvien_nghiviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        CURRENT_DATE - INTERVAL '5 days',
        'Nghỉ việc chuyển về quê chăm sóc bố mẹ già',
        FALSE,
        'DANG_GIU_LUONG',
        '1 Tạp dề, 1 Nón',
        'Đã trả áo thun, còn thiếu 1 tạp dề và 1 nón bảo hộ',
        NOW() - INTERVAL '5 days'
    ),
    (
        (SELECT id FROM users WHERE username = 'nhanvien_boviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'),
        CURRENT_DATE - INTERVAL '15 days',
        'Tự ý bỏ việc không thông báo trước',
        TRUE,
        'BO_VIEC',
        'Áo đồng phục, Tạp dề, Thẻ tên',
        'Bỏ việc — không trả theo quy định',
        NOW() - INTERVAL '15 days'
    )
ON CONFLICT DO NOTHING;

-- Đồng bộ cấp phát đồng phục uniform_allocations cho nhân viên nghỉ việc: Đã trả áo, thiếu tạp dề và nón
INSERT INTO uniform_allocations (user_id, branch_id, uniform_item_id, allocated_date, is_returned, returned_date, note)
VALUES
    (
        (SELECT id FROM users WHERE username = 'nhanvien_nghiviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM uniform_items WHERE item_name LIKE 'Áo Thun%'),
        CURRENT_DATE - INTERVAL '90 days',
        TRUE, CURRENT_DATE - INTERVAL '5 days', 'Đã trả áo thun nguyên vẹn'
    ),
    (
        (SELECT id FROM users WHERE username = 'nhanvien_nghiviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM uniform_items WHERE item_name LIKE 'Tạp Dề%'),
        CURRENT_DATE - INTERVAL '90 days',
        FALSE, NULL, 'Chưa bàn giao lại tạp dề'
    ),
    (
        (SELECT id FROM users WHERE username = 'nhanvien_nghiviec'),
        (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
        (SELECT id FROM uniform_items WHERE item_name LIKE 'Nón%'),
        CURRENT_DATE - INTERVAL '90 days',
        FALSE, NULL, 'Chưa bàn giao lại nón bảo hộ'
    )
ON CONFLICT DO NOTHING;

-- Mở kỳ bảng lương tháng 2026-11 cho 2 chi nhánh ở trạng thái OPEN
INSERT INTO payroll_periods (period_month, branch_id, status, created_at, updated_at)
VALUES
    ('2026-11', (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'), 'OPEN', NOW(), NOW()),
    ('2026-11', (SELECT id FROM branches WHERE branch_code = 'CN_QUE_VO'), 'OPEN', NOW(), NOW())
ON CONFLICT (period_month, branch_id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 10. DỮ LIỆU KHO BẾP: 2 MẺ CHẾ BIẾN & 2 ĐƠN BÁO HỎNG PHỤC VỤ DEMO CẢNH BÁO
-- ------------------------------------------------------------------------------
-- Mẻ 1: Mẻ Cua Cà Mau đang làm dở -> Kích hoạt cảnh báo vàng/đỏ khi nhân viên mở mẻ thứ 2
INSERT INTO processing_batches (
    branch_id, item_id, recipe_id, batch_code, input_weight, output_weight,
    loss_rate, standard_loss_rate, is_over_standard, is_second_batch, status,
    started_by_user_id, started_at, created_at
)
SELECT
    (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
    (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
    (SELECT id FROM recipes WHERE item_id = (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU') LIMIT 1),
    'BATCH-202611-001',
    20.000, NULL, NULL, 20.00, FALSE, FALSE, 'DANG_LAM',
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    NOW() - INTERVAL '30 minutes', NOW() - INTERVAL '30 minutes'
WHERE NOT EXISTS (SELECT 1 FROM processing_batches WHERE batch_code = 'BATCH-202611-001');

-- Mẻ 2: Mẻ Ghẹ Phú Quốc đã hoàn thành nhưng VƯỢT ĐỊNH MỨC HAO HỤT (24.0% > 18.0%) -> Cờ đỏ is_over_standard
INSERT INTO processing_batches (
    branch_id, item_id, recipe_id, batch_code, input_weight, output_weight,
    loss_rate, standard_loss_rate, is_over_standard, is_second_batch, status,
    started_by_user_id, finished_by_user_id, started_at, finished_at, created_at
)
SELECT
    (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
    (SELECT id FROM items WHERE item_code = 'GHE_PHU_QUOC'),
    (SELECT id FROM recipes WHERE item_id = (SELECT id FROM items WHERE item_code = 'GHE_PHU_QUOC') LIMIT 1),
    'BATCH-202611-002',
    25.000, 19.000, 24.00, 18.00, TRUE, FALSE, 'HOAN_THANH',
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'
WHERE NOT EXISTS (SELECT 1 FROM processing_batches WHERE batch_code = 'BATCH-202611-002');

-- Đơn báo hỏng 1: Cua Cà Mau chết ngợp, giá trị 1.225.000 đ > 500k -> Trạng thái CHO_DUYET (Quản lý duyệt)
INSERT INTO damage_reports (
    branch_id, item_id, supplier_id, batch_id, supplier_code, batch_number,
    quantity, estimated_value, reason, status, reported_by_user_id, note, created_at
)
SELECT
    (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
    (SELECT id FROM items WHERE item_code = 'CUA_CA_MAU'),
    (SELECT id FROM suppliers WHERE supplier_code = 'NCC-QN01'),
    (SELECT id FROM import_batches WHERE batch_code = 'LOT-202611-001'),
    'NCC-QN01', 'LOT-202611-001',
    3.500, 1225000.00, 'HẢI SẢN CHẾT / NGỢP', 'CHO_DUYET',
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    'Cua chết do sục oxy bể hải sản gặp sự cố lúc rạng sáng; chờ Quản lý kiểm tra xác nhận',
    NOW() - INTERVAL '2 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM damage_reports
    WHERE branch_id = (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN')
      AND batch_number = 'LOT-202611-001'
      AND status = 'CHO_DUYET'
);

-- Đơn báo hỏng 2: Kim chi hỏng bao bì, giá trị 90.000 đ <= 500k -> Tự động duyệt (TU_DONG_DUYET)
INSERT INTO damage_reports (
    branch_id, item_id, supplier_id, batch_id, supplier_code, batch_number,
    quantity, estimated_value, reason, status, reported_by_user_id, approved_by_user_id, approved_at, note, created_at
)
SELECT
    (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN'),
    (SELECT id FROM items WHERE item_code = 'KIM_CHI'),
    NULL, NULL, 'KHO_NOI_BO', 'KHO-KIMCHI',
    2.000, 90000.00, 'RÁCH BAO BÌ / HƯ HỎNG BẢO QUẢN', 'TU_DONG_DUYET',
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    (SELECT id FROM users WHERE username = 'bep_thainguyen'),
    NOW() - INTERVAL '4 hours',
    'Thùng kim chi bị va đập góc khi bốc xếp, tự động duyệt do giá trị dưới ngưỡng 500.000 đ',
    NOW() - INTERVAL '4 hours'
WHERE NOT EXISTS (
    SELECT 1 FROM damage_reports
    WHERE branch_id = (SELECT id FROM branches WHERE branch_code = 'CN_THAI_NGUYEN')
      AND batch_number = 'KHO-KIMCHI'
);
