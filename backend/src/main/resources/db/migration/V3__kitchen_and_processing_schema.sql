-- ==============================================================================
-- Flyway Migration V3: Khởi tạo bảng Phân hệ Kho Bếp & Quản trị Chế biến mẻ
-- Dự án: Sen Việt Buffet
-- ==============================================================================

-- 1. Bảng danh mục Nguyên liệu & Món ăn
CREATE TABLE IF NOT EXISTS items (
    id BIGSERIAL PRIMARY KEY,
    item_code VARCHAR(50) NOT NULL UNIQUE,
    barcode VARCHAR(100) UNIQUE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    cost_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    is_buffet_line BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_items_barcode ON items (barcode);
CREATE INDEX IF NOT EXISTS idx_items_item_code ON items (item_code);

-- 2. Bảng Công thức & Tỷ lệ hao hụt chuẩn
CREATE TABLE IF NOT EXISTS recipes (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    recipe_name VARCHAR(255) NOT NULL,
    standard_loss_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    description VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipes_item_id ON recipes (item_id);

-- 3. Bảng Nhật ký Lấy hàng (Take-out từ kho ra bếp)
CREATE TABLE IF NOT EXISTS take_out_logs (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_take_out_branch_date ON take_out_logs (branch_id, created_at);

-- 4. Bảng Mẻ Chế Biến (Processing Batches)
CREATE TABLE IF NOT EXISTS processing_batches (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    recipe_id BIGINT REFERENCES recipes (id) ON DELETE SET NULL,
    batch_code VARCHAR(100) NOT NULL,
    input_weight NUMERIC(12, 3) NOT NULL,
    output_weight NUMERIC(12, 3),
    loss_rate NUMERIC(5, 2),
    standard_loss_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    is_over_standard BOOLEAN NOT NULL DEFAULT FALSE,
    is_second_batch BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(50) NOT NULL DEFAULT 'DANG_LAM',
    started_by_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    finished_by_user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_batches_branch_item_status ON processing_batches (branch_id, item_id, status);
CREATE INDEX IF NOT EXISTS idx_batches_branch_date ON processing_batches (branch_id, created_at);

-- 5. Bảng Báo Hỏng Nguyên Liệu (Damage Reports)
CREATE TABLE IF NOT EXISTS damage_reports (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    supplier_code VARCHAR(100),
    batch_number VARCHAR(100),
    quantity NUMERIC(12, 3) NOT NULL,
    estimated_value NUMERIC(15, 2) NOT NULL DEFAULT 0,
    reason VARCHAR(100) NOT NULL,
    image_urls TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'TU_DONG_DUYET',
    reported_by_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    approved_by_user_id BIGINT REFERENCES users (id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    note VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_damage_branch_date ON damage_reports (branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_damage_status ON damage_reports (status);

-- 6. Bảng Ghi nhận Ra Line (+1) với Chống Double-Click (Idempotency Key)
CREATE TABLE IF NOT EXISTS line_item_logs (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches (id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items (id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    request_id VARCHAR(100) UNIQUE,
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_line_branch_date ON line_item_logs (branch_id, created_at);

-- ==============================================================================
-- NẠP MASTER DATA MẪU (Nguyên liệu buffet, barcode và công thức chuẩn)
-- ==============================================================================
INSERT INTO items (item_code, barcode, item_name, category, unit, cost_price, is_buffet_line)
VALUES
    ('CUA_CA_MAU', '893000000001', 'Cua Cà Mau (Tươi sống)', 'HAI_SAN', 'KG', 350000.00, true),
    ('GHE_PHU_QUOC', '893000000002', 'Ghẹ Phú Quốc (Loại 1)', 'HAI_SAN', 'KG', 280000.00, true),
    ('BO_CUON_NAM', '893000000003', 'Ba Chỉ Bò Cuộn Nấm Kim Châm', 'THIT', 'KHAY', 85000.00, true),
    ('KIM_CHI', '893000000004', 'Kim Chi Cải Thảo Hàn Quốc', 'RAU_CU', 'KG', 45000.00, true),
    ('HAI_SAN_NUONG', '893000000005', 'Hải Sản Tổng Hợp Sốt Cay', 'HAI_SAN', 'KG', 220000.00, true),
    ('BIA_HA_NOI', '893000000006', 'Bia Hà Nội Lon 330ml', 'DO_UONG', 'LON', 15000.00, false)
ON CONFLICT (item_code) DO NOTHING;

-- Nạp công thức & tỷ lệ hao hụt chuẩn
-- Cua Cà Mau hấp sả: Hao hụt tiêu chuẩn cho phép là 20.00%
INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Cua Cà Mau Hấp Sả / Gừng', 20.00, 'Chuẩn hao hụt hấp chín tối đa 20%'
FROM items WHERE item_code = 'CUA_CA_MAU'
ON CONFLICT DO NOTHING;

-- Ghẹ Phú Quốc hấp bia: Hao hụt tiêu chuẩn cho phép là 18.00%
INSERT INTO recipes (item_id, recipe_name, standard_loss_rate, description)
SELECT id, 'Ghẹ Phú Quốc Hấp Bia', 18.00, 'Chuẩn hao hụt tối đa 18%'
FROM items WHERE item_code = 'GHE_PHU_QUOC'
ON CONFLICT DO NOTHING;
