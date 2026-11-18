-- ==============================================================================
-- Flyway Migration V1: Khởi tạo bảng danh mục chi nhánh, phân quyền & người dùng
-- Dự án: Sen Việt Buffet - Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát
-- ==============================================================================

-- 1. Bảng chi nhánh nhà hàng (Thái Nguyên, Quế Võ, ...)
CREATE TABLE IF NOT EXISTS branches (
    id BIGSERIAL PRIMARY KEY,
    branch_code VARCHAR(50) NOT NULL UNIQUE,
    branch_name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    phone VARCHAR(50),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_branches_branch_code ON branches (branch_code);

-- 2. Bảng vai trò hệ thống (5 vai trò cốt lõi)
CREATE TABLE IF NOT EXISTS roles (
    id BIGSERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Khởi tạo 5 vai trò hệ thống
INSERT INTO roles (role_name, description) VALUES
    ('ROLE_KITCHEN_STAFF', 'Nhân viên Bếp / Bar (Thao tác màn hình 4 nút lớn)'),
    ('ROLE_RESTAURANT_MANAGER', 'Quản lý Nhà hàng / Quản lý Bếp (Duyệt hủy, thiết lập định mức, giám sát)'),
    ('ROLE_BRANCH_ACCOUNTANT', 'Kế toán Chi nhánh (Đối soát kho, kiểm soát NCC)'),
    ('ROLE_GENERAL_ACCOUNTANT', 'Kế toán Tổng chuỗi / Chủ chuỗi (Xem báo cáo đa chi nhánh, chốt lương)'),
    ('ROLE_EMPLOYEE', 'Nhân viên chung (Chấm công GPS, xem lịch ca, đề xuất ứng lương)')
ON CONFLICT (role_name) DO NOTHING;

-- 3. Bảng tài khoản người dùng
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(150),
    phone VARCHAR(50),
    branch_id BIGINT REFERENCES branches (id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_branch_id ON users (branch_id);

-- 4. Bảng liên kết Người dùng - Vai trò (N-N)
CREATE TABLE IF NOT EXISTS user_roles (
    user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles (role_id);
