-- ====================================================================
-- Flyway Migration V4: Bảng Dữ Liệu Đối Soát Bán Hàng CukCuk, Kiểm Kê
-- Kho Và Động Cơ Chống Thất Thoát Cuối Ngày (6 Công Thức)
-- ====================================================================

-- 1. Bảng lưu trữ lịch sử import dữ liệu bán hàng POS CukCuk
CREATE TABLE IF NOT EXISTS cukcuk_sales_imports (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    import_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'CA_NGAY', -- 'CA_TRUA', 'CA_TOI', 'CA_NGAY'
    file_name VARCHAR(255) NOT NULL,
    total_revenue NUMERIC(15, 2) NOT NULL DEFAULT 0,
    adult_guest_count INT NOT NULL DEFAULT 0,
    child_guest_count INT NOT NULL DEFAULT 0,
    total_guest_count INT NOT NULL DEFAULT 0,
    standard_buffet_count INT NOT NULL DEFAULT 0,
    vip_buffet_count INT NOT NULL DEFAULT 0,
    imported_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cukcuk_sales_branch_date ON cukcuk_sales_imports(branch_id, import_date);

-- 2. Bảng lưu trữ số liệu kiểm kê kho định kỳ (Snapshot Tồn Đầu - Nhập - Tồn Cuối)
CREATE TABLE IF NOT EXISTS inventory_snapshots (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    snapshot_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'CA_NGAY',
    opening_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,  -- Tồn đầu ca
    in_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,       -- Nhập trong ca
    closing_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,  -- Tồn kiểm thực tế cuối ca
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    checked_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_snapshots_lookup ON inventory_snapshots(branch_id, item_id, snapshot_date, shift_type);

-- 3. Bảng kết quả đối soát cuối ngày (6 Công thức & Cờ cảnh báo thất thoát đỏ)
CREATE TABLE IF NOT EXISTS daily_reconciliations (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    recon_date DATE NOT NULL,
    shift_type VARCHAR(20) NOT NULL DEFAULT 'CA_NGAY',
    exported_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,              -- CT 1: Xuất = Tồn đầu + Nhập - Tồn cuối
    guest_consumption_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,     -- CT 2: Khách dùng theo định mức vé POS
    processing_loss_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,       -- CT 3: Hụt chế biến thực tế từ các mẻ
    reported_damage_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,       -- CT 4: Hỏng có báo (đã duyệt hoặc tự động)
    unexplained_loss_qty NUMERIC(12, 3) NOT NULL DEFAULT 0,      -- CT 5: Lệch không rõ = Xuất - Khách dùng - Hụt - Hỏng
    unexplained_loss_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,   -- Quy đổi tiền = Lệch * Giá vốn
    unexplained_loss_rate NUMERIC(5, 2) NOT NULL DEFAULT 0,      -- Tỷ lệ % thất thoát = Lệch / Xuất * 100%
    actual_consumption_per_guest NUMERIC(8, 4) NOT NULL DEFAULT 0, -- CT 6: Tiêu hao thực tế/khách
    is_over_threshold BOOLEAN NOT NULL DEFAULT FALSE,            -- Cờ đỏ: Thất thoát > 5% HOẶC > 300,000 VNĐ
    responsible_user_name VARCHAR(100),                          -- Nhân viên chịu trách nhiệm kiểm kho
    status VARCHAR(50) NOT NULL DEFAULT 'CHUA_CHOT',             -- 'CHUA_CHOT', 'DA_CHOT', 'DA_CANH_BAO_ZALO'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_reconciliations_lookup ON daily_reconciliations(branch_id, recon_date, shift_type);
CREATE INDEX IF NOT EXISTS idx_daily_reconciliations_flag ON daily_reconciliations(is_over_threshold);

-- 4. Bảng nhật ký bắn cảnh báo Webhook Zalo Bot & Notification
CREATE TABLE IF NOT EXISTS notification_logs (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT REFERENCES branches(id) ON DELETE SET NULL,
    channel VARCHAR(50) NOT NULL DEFAULT 'ZALO_WEBHOOK',
    recipient VARCHAR(255),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'SENT', -- 'SENT', 'FAILED', 'SIMULATED'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- ====================================================================
-- SEED DỮ LIỆU ĐỐI SOÁT MẪU CHO NGÀY HIỆN TẠI (CHI NHÁNH THÁI NGUYÊN)
-- ====================================================================

-- 1. Import mẫu CukCuk: 120 khách người lớn + 30 trẻ em = 150 khách, Doanh thu 42,500,000 đ
INSERT INTO cukcuk_sales_imports (
    branch_id, import_date, shift_type, file_name, total_revenue,
    adult_guest_count, child_guest_count, total_guest_count,
    standard_buffet_count, vip_buffet_count, imported_by_user_id, created_at
) VALUES (
    1, CURRENT_DATE, 'CA_NGAY', 'BaoCaoBanHang_CukCuk_20261117.xlsx', 42500000.00,
    120, 30, 150, 90, 60, 3, NOW()
);

-- 2. Dữ liệu kiểm kê kho thực tế hôm nay:
-- Cua Cà Mau (ID 1): Tồn đầu 20kg, Nhập 30kg, Tồn cuối 12kg -> Xuất 38kg
INSERT INTO inventory_snapshots (
    branch_id, item_id, snapshot_date, shift_type, opening_stock, in_stock, closing_stock, unit, checked_by_user_id, note, created_at
) VALUES 
(1, 1, CURRENT_DATE, 'CA_NGAY', 20.000, 30.000, 12.000, 'KG', 1, 'Kiểm kho cuối ca bởi Nguyễn Văn Bếp', NOW()),
(1, 2, CURRENT_DATE, 'CA_NGAY', 15.000, 25.000, 10.000, 'KG', 1, 'Kiểm kho ghẹ cuối ca', NOW()),
(1, 3, CURRENT_DATE, 'CA_NGAY', 50.000, 80.000, 20.000, 'KHAY', 1, 'Kiểm kho ba chỉ bò', NOW()),
(1, 4, CURRENT_DATE, 'CA_NGAY', 10.000, 15.000, 8.000, 'KG', 1, 'Kiểm kho kim chi', NOW());

-- 3. Dữ liệu đối soát mẫu tính toán theo 6 công thức:
-- Món 1 (CUA CÀ MAU):
-- Xuất = 38kg
-- Khách dùng = 150 khách * 0.16kg = 24.0kg
-- Hụt chế biến thực tế = 7.6kg (20% của 38kg)
-- Hỏng có báo = 2.0kg
-- Lệch không rõ = 38 - 24.0 - 7.6 - 2.0 = 4.4kg!
-- Tiền lệch = 4.4kg * 350,000 đ = 1,540,000 đ (> 300k, > 5%) -> BÁO ĐỎ is_over_threshold = TRUE!
INSERT INTO daily_reconciliations (
    branch_id, item_id, recon_date, shift_type,
    exported_qty, guest_consumption_qty, processing_loss_qty, reported_damage_qty,
    unexplained_loss_qty, unexplained_loss_amount, unexplained_loss_rate,
    actual_consumption_per_guest, is_over_threshold, responsible_user_name, status, created_at
) VALUES (
    1, 1, CURRENT_DATE, 'CA_NGAY',
    38.000, 24.000, 7.600, 2.000,
    4.400, 1540000.00, 11.58,
    0.1893, TRUE, 'Nguyễn Văn Bếp (Thái Nguyên)', 'DA_CANH_BAO_ZALO', NOW()
);

-- Món 2 (GHẸ PHÚ QUỐC):
-- Xuất = 30kg, Khách dùng = 22kg, Hụt = 5.4kg, Hỏng = 1.0kg, Lệch = 1.6kg (560,000 đ > 300k) -> BÁO ĐỎ
INSERT INTO daily_reconciliations (
    branch_id, item_id, recon_date, shift_type,
    exported_qty, guest_consumption_qty, processing_loss_qty, reported_damage_qty,
    unexplained_loss_qty, unexplained_loss_amount, unexplained_loss_rate,
    actual_consumption_per_guest, is_over_threshold, responsible_user_name, status, created_at
) VALUES (
    1, 2, CURRENT_DATE, 'CA_NGAY',
    30.000, 22.000, 5.400, 1.000,
    1.600, 448000.00, 5.33,
    0.1573, TRUE, 'Nguyễn Văn Bếp (Thái Nguyên)', 'DA_CANH_BAO_ZALO', NOW()
);

-- Món 3 (BA CHỈ BÒ CUỘN NẤM):
-- Xuất = 110 khay, Khách dùng = 105 khay, Hụt = 0, Hỏng = 2 khay, Lệch = 3 khay
-- Tiền lệch = 3 * 85k = 255,000 đ (< 300k), Tỷ lệ = 2.7% (< 5%) -> CHUẨN XANH is_over_threshold = FALSE
INSERT INTO daily_reconciliations (
    branch_id, item_id, recon_date, shift_type,
    exported_qty, guest_consumption_qty, processing_loss_qty, reported_damage_qty,
    unexplained_loss_qty, unexplained_loss_amount, unexplained_loss_rate,
    actual_consumption_per_guest, is_over_threshold, responsible_user_name, status, created_at
) VALUES (
    1, 3, CURRENT_DATE, 'CA_NGAY',
    110.000, 105.000, 0.000, 2.000,
    3.000, 255000.00, 2.73,
    0.7200, FALSE, 'Nguyễn Văn Bếp (Thái Nguyên)', 'DA_CHOT', NOW()
);

-- Bắn mẫu log cảnh báo Zalo Bot
INSERT INTO notification_logs (
    branch_id, channel, recipient, title, content, status, created_at
) VALUES (
    1, 'ZALO_WEBHOOK', 'Nhóm Quản Trị Sen Việt - Thái Nguyên',
    '🚨 CẢNH BÁO THẤT THOÁT NGUYÊN LIỆU VƯỢT NGƯỠNG',
    'Phát hiện thất thoát ngày hôm nay tại Thái Nguyên: Món [Cua Cà Mau] lệch 4.4 kg (1,540,000 đ - 11.58%), Món [Ghẹ Phú Quốc] lệch 1.6 kg (448,000 đ - 5.33%). Nhân viên kiểm kho: Nguyễn Văn Bếp.',
    'SENT', NOW()
);
