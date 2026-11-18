-- ==============================================================================
-- Flyway Migration V9: Nâng cấp kiến trúc phân quyền đa vai trò (Multi-Role RBAC)
-- Dự án: Sen Việt Buffet - Quản trị Kho Bếp, Nhân sự & Chống Thất Thoát
-- Căn cứ: Mục 2.2 trong task/phase-9-multi-role-rbac.md
-- ==============================================================================

-- 1. Bổ sung cột role vào bảng users để làm vai trò chính (primary role) tương thích ngược
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- 2. Nâng cấp bảng trung gian user_roles với role_name và assigned_at
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS role_name VARCHAR(50);
ALTER TABLE user_roles ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- Cập nhật role_name từ bảng roles cho các bản ghi hiện hữu
UPDATE user_roles ur
SET role_name = r.role_name
FROM roles r
WHERE ur.role_id = r.id AND ur.role_name IS NULL;

-- Tự động điền role_name từ bảng roles khi Hibernate chỉ insert (user_id, role_id)
CREATE OR REPLACE FUNCTION fill_user_role_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role_name IS NULL AND NEW.role_id IS NOT NULL THEN
        SELECT role_name INTO NEW.role_name FROM roles WHERE id = NEW.role_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_user_role_name ON user_roles;
CREATE TRIGGER trg_fill_user_role_name
BEFORE INSERT OR UPDATE ON user_roles
FOR EACH ROW
EXECUTE FUNCTION fill_user_role_name();

-- Đánh index và ràng buộc duy nhất cho cặp (user_id, role_name)
CREATE INDEX IF NOT EXISTS idx_user_roles_role_name ON user_roles (role_name);
CREATE UNIQUE INDEX IF NOT EXISTS uq_user_roles_user_role_name ON user_roles (user_id, role_name);

-- 3. Cập nhật vai trò mặc định (primary role) cho người dùng hiện tại
UPDATE users u
SET role = (
    SELECT ur.role_name
    FROM user_roles ur
    WHERE ur.user_id = u.id
    ORDER BY ur.role_id ASC
    LIMIT 1
)
WHERE u.role IS NULL;

-- Cập nhật chuẩn vai trò primary cho các tài khoản demo
UPDATE users SET role = 'ROLE_KITCHEN_STAFF' WHERE username = 'bep_thainguyen';
UPDATE users SET role = 'ROLE_RESTAURANT_MANAGER' WHERE username = 'quanly_thainguyen';
UPDATE users SET role = 'ROLE_BRANCH_ACCOUNTANT' WHERE username = 'ketoan_thainguyen';
UPDATE users SET role = 'ROLE_GENERAL_ACCOUNTANT' WHERE username = 'ketoan_tong';
UPDATE users SET role = 'ROLE_EMPLOYEE' WHERE username = 'nhanvien_quevo';

-- 4. Gán thêm vai trò ROLE_EMPLOYEE cho nhân viên bếp và các cấp quản lý chi nhánh
-- Giúp nhân viên bếp vừa thao tác màn hình 4 nút bếp, vừa có thể chấm công selfie, làm bài thi và xem phiếu lương
INSERT INTO user_roles (user_id, role_id, role_name, assigned_at)
SELECT u.id, r.id, r.role_name, CURRENT_TIMESTAMP
FROM users u, roles r
WHERE u.username = 'bep_thainguyen' AND r.role_name = 'ROLE_EMPLOYEE'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, role_name, assigned_at)
SELECT u.id, r.id, r.role_name, CURRENT_TIMESTAMP
FROM users u, roles r
WHERE u.username = 'quanly_thainguyen' AND r.role_name = 'ROLE_EMPLOYEE'
ON CONFLICT DO NOTHING;

INSERT INTO user_roles (user_id, role_id, role_name, assigned_at)
SELECT u.id, r.id, r.role_name, CURRENT_TIMESTAMP
FROM users u, roles r
WHERE u.username = 'ketoan_thainguyen' AND r.role_name = 'ROLE_EMPLOYEE'
ON CONFLICT DO NOTHING;

-- 5. Bảng nhật ký kiểm toán hệ thống (Audit Logs) phục vụ ghi vết thao tác nhạy cảm
CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NOT NULL,
    target_id BIGINT,
    details TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
