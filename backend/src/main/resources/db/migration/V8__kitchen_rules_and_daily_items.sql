-- ==============================================================================
-- Flyway Migration V8: Quy Tắc Chặt Chẽ Bếp, Món Dùng Trong Ngày & Thêm Nhanh Ra Line
-- Dự án: Sen Việt Buffet
-- ==============================================================================

-- 1. Bổ sung trường đánh dấu món chỉ dùng trong ngày vào bảng items
ALTER TABLE items ADD COLUMN IF NOT EXISTS is_daily_only BOOLEAN NOT NULL DEFAULT FALSE;

-- Cập nhật cờ is_daily_only cho các món tươi dùng trong ngày
UPDATE items SET is_daily_only = TRUE WHERE item_code = 'KIM_CHI';

-- Thêm các món tươi mẫu chỉ dùng trong ngày (Salad, Bánh bao)
INSERT INTO items (item_code, barcode, item_name, category, unit, cost_price, is_buffet_line, is_daily_only)
VALUES 
    ('SALAD_NGA', '893000000007', 'Salad Nga Tươi Sốt Mayonnaise', 'RAU_CU', 'KG', 40000.00, true, true),
    ('BANH_BAO_THIT', '893000000008', 'Bánh Bao Nhân Thịt Hấp', 'KHAI_VI', 'CAI', 12000.00, true, true)
ON CONFLICT (item_code) DO UPDATE
SET is_daily_only = TRUE,
    is_buffet_line = TRUE;

-- 2. Bảng Xác Nhận Hủy Bỏ Món Dùng Trong Ngày Cuối Ca (Daily Waste Confirmations)
CREATE TABLE IF NOT EXISTS daily_waste_confirmations (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    waste_date DATE NOT NULL,
    shift VARCHAR(20) NOT NULL DEFAULT 'CA_NGAY',
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    confirmed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'DA_XAC_NHAN',
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_waste_branch_date ON daily_waste_confirmations(branch_id, waste_date);
CREATE INDEX IF NOT EXISTS idx_daily_waste_item ON daily_waste_confirmations(item_id);
