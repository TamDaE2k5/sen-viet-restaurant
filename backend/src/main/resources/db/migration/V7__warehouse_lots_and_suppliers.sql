-- ==============================================================================
-- Flyway Migration V7: Phân Hệ Kho Cơ Sở, Lô Nhập & Nhà Cung Cấp
-- Dự án: Sen Việt Buffet
-- ==============================================================================

-- 1. Bảng Nhà Cung Cấp (Suppliers)
CREATE TABLE IF NOT EXISTS suppliers (
    id BIGSERIAL PRIMARY KEY,
    supplier_code VARCHAR(50) NOT NULL UNIQUE,
    supplier_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address VARCHAR(255),
    contact_person VARCHAR(100),
    email VARCHAR(100),
    tax_code VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'HOAT_DONG',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_suppliers_code ON suppliers(supplier_code);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON suppliers(status);

-- 2. Bảng Lô Nhập Hàng (Import Batches / Lots)
CREATE TABLE IF NOT EXISTS import_batches (
    id BIGSERIAL PRIMARY KEY,
    batch_code VARCHAR(100) NOT NULL UNIQUE,
    supplier_id BIGINT NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    import_date DATE NOT NULL,
    expiry_date DATE,
    initial_quantity NUMERIC(12, 3) NOT NULL,
    current_stock NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    status VARCHAR(50) NOT NULL DEFAULT 'CON_HANG',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_lookup ON import_batches(branch_id, item_id, current_stock);
CREATE INDEX IF NOT EXISTS idx_batches_supplier ON import_batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_code ON import_batches(batch_code);

-- 3. Bảng Phiếu Kho: Nhập, Xuất chuyển, Huỷ, Kiểm kê (Warehouse Documents)
CREATE TABLE IF NOT EXISTS warehouse_documents (
    id BIGSERIAL PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL, -- 'NHAP', 'XUAT_CHUYEN', 'HUY', 'KIEM_KE'
    doc_code VARCHAR(100) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    created_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'HOAN_THANH',
    note VARCHAR(500),
    total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    image_urls TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wh_doc_branch_date ON warehouse_documents(branch_id, created_at);
CREATE INDEX IF NOT EXISTS idx_wh_doc_type ON warehouse_documents(doc_type);
CREATE INDEX IF NOT EXISTS idx_wh_doc_code ON warehouse_documents(doc_code);

-- 4. Bảng Chi Tiết Phiếu Kho (Warehouse Document Items)
CREATE TABLE IF NOT EXISTS warehouse_document_items (
    id BIGSERIAL PRIMARY KEY,
    document_id BIGINT NOT NULL REFERENCES warehouse_documents(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,
    quantity NUMERIC(12, 3) NOT NULL,
    unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    note VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_wh_doc_items_doc ON warehouse_document_items(document_id);

-- 5. Bảng Quản Lý Tồn Kho Theo Chi Nhánh, Mặt Hàng & Lô (Inventory Stocks)
CREATE TABLE IF NOT EXISTS inventory_stocks (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES import_batches(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_branch_item_batch UNIQUE (branch_id, item_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_stocks_branch ON inventory_stocks(branch_id, item_id);

-- 6. Bảng Biên Bản Kiểm Kê Kho Đầu Ca / Cuối Ca (Inventory Checks)
CREATE TABLE IF NOT EXISTS inventory_checks (
    id BIGSERIAL PRIMARY KEY,
    check_code VARCHAR(100) NOT NULL UNIQUE,
    branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    shift VARCHAR(20) NOT NULL DEFAULT 'CA_NGAY',
    check_date DATE NOT NULL,
    checked_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'HOAN_THANH',
    note VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inv_checks_branch_date ON inventory_checks(branch_id, check_date);

-- 7. Bảng Chi Tiết Biên Bản Kiểm Kê (Inventory Check Items)
CREATE TABLE IF NOT EXISTS inventory_check_items (
    id BIGSERIAL PRIMARY KEY,
    check_id BIGINT NOT NULL REFERENCES inventory_checks(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    batch_id BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,
    system_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    actual_stock NUMERIC(12, 3) NOT NULL DEFAULT 0,
    difference NUMERIC(12, 3) NOT NULL DEFAULT 0,
    reason VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_inv_check_items_check ON inventory_check_items(check_id);

-- 8. Bảng Định Nghĩa Tỷ Lệ Nhiều Nguyên Liệu Cấu Thành Món (Recipe Ingredients)
CREATE TABLE IF NOT EXISTS recipe_ingredients (
    id BIGSERIAL PRIMARY KEY,
    recipe_id BIGINT NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
    ingredient_item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(12, 3) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'KG',
    note VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe ON recipe_ingredients(recipe_id);

-- 9. Bổ sung trường liên kết Lô hàng và Nhà cung cấp vào bảng damage_reports
ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS batch_id BIGINT REFERENCES import_batches(id) ON DELETE SET NULL;
ALTER TABLE damage_reports ADD COLUMN IF NOT EXISTS supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_damage_reports_batch ON damage_reports(batch_id);
CREATE INDEX IF NOT EXISTS idx_damage_reports_supplier ON damage_reports(supplier_id);

-- 10. Dữ liệu mẫu (Seed Data) cho Nhà Cung Cấp
INSERT INTO suppliers (supplier_code, supplier_name, phone, address, contact_person, email, tax_code, status)
VALUES
    ('NCC-QN01', 'Hải Sản Quảng Ninh', '0912345678', 'Hạ Long, Quảng Ninh', 'Nguyễn Văn Tuấn', 'tuankd@haisanqn.vn', '0102030405', 'HOAT_DONG'),
    ('NCC-CM02', 'Hải Sản Cà Mau Đặc Sản', '0987654321', 'Năm Căn, Cà Mau', 'Trần Văn Cà', 'info@haisancamau.vn', '0506070809', 'HOAT_DONG'),
    ('NCC-HN03', 'Thực Phẩm Tươi Sống Hà Nội', '0901122334', 'Hoàng Mai, Hà Nội', 'Lê Thị Thu', 'thucphamhn@gmail.com', '0109988776', 'HOAT_DONG'),
    ('NCC-DL04', 'Rau Củ Quả Đà Lạt Farm', '0933445566', 'Đức Trọng, Lâm Đồng', 'Phạm Hồng Thái', 'dalatfarm@dalat.vn', '5800112233', 'HOAT_DONG')
ON CONFLICT (supplier_code) DO NOTHING;

-- Nạp lô hàng mẫu cho Cua Cà Mau tại Chi nhánh Thái Nguyên
INSERT INTO import_batches (batch_code, supplier_id, item_id, branch_id, import_date, expiry_date, initial_quantity, current_stock, unit_price, unit, status)
SELECT 
    'LOT-202611-001',
    s.id,
    i.id,
    b.id,
    CURRENT_DATE - INTERVAL '2 days',
    CURRENT_DATE + INTERVAL '5 days',
    100.000,
    95.000,
    350000.00,
    'KG',
    'CON_HANG'
FROM suppliers s, items i, branches b
WHERE s.supplier_code = 'NCC-QN01' AND i.item_code = 'CUA_CA_MAU' AND b.branch_code = 'CN_THAI_NGUYEN'
ON CONFLICT (batch_code) DO NOTHING;

-- Nạp lô hàng mẫu cho Ghẹ Phú Quốc tại Chi nhánh Thái Nguyên
INSERT INTO import_batches (batch_code, supplier_id, item_id, branch_id, import_date, expiry_date, initial_quantity, current_stock, unit_price, unit, status)
SELECT 
    'LOT-202611-002',
    s.id,
    i.id,
    b.id,
    CURRENT_DATE - INTERVAL '1 days',
    CURRENT_DATE + INTERVAL '4 days',
    80.000,
    80.000,
    280000.00,
    'KG',
    'CON_HANG'
FROM suppliers s, items i, branches b
WHERE s.supplier_code = 'NCC-CM02' AND i.item_code = 'GHE_PHU_QUOC' AND b.branch_code = 'CN_THAI_NGUYEN'
ON CONFLICT (batch_code) DO NOTHING;

-- Khởi tạo tồn kho ban đầu cho các lô mẫu
INSERT INTO inventory_stocks (branch_id, item_id, batch_id, quantity, last_updated_at)
SELECT ib.branch_id, ib.item_id, ib.id, ib.current_stock, NOW()
FROM import_batches ib
ON CONFLICT (branch_id, item_id, batch_id) DO UPDATE
SET quantity = EXCLUDED.quantity,
    last_updated_at = NOW();
