-- ==============================================================================
-- Flyway Migration V10: Hoàn thiện nghiệp vụ nhân sự, kỷ luật bỏ việc & khóa bảng lương
-- Dự án: Sen Việt Buffet
-- Căn cứ: Mục 2.1, 2.3, 3.2, 3.3 trong task/phase-10-hr-payroll-locks.md
-- ==============================================================================

-- 1. Bổ sung các trường quản lý khóa và loại trừ chi phí cho bảng payrolls
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS excluded_from_cost BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS hold_reason VARCHAR(500);
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS locked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS locked_by BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- Đảm bảo cột branch_id tồn tại và có foreign key
ALTER TABLE payrolls ADD COLUMN IF NOT EXISTS branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_payrolls_excluded ON payrolls(excluded_from_cost);
CREATE INDEX IF NOT EXISTS idx_payrolls_locked ON payrolls(locked_at);

-- 2. Tạo bảng kỳ bảng lương (payroll_periods) để quản lý chốt & khóa kỳ lương
CREATE TABLE IF NOT EXISTS payroll_periods (
    id BIGSERIAL PRIMARY KEY,
    period_month VARCHAR(7) NOT NULL, -- 'YYYY-MM'
    branch_id BIGINT REFERENCES branches(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'LOCKED'
    locked_at TIMESTAMP WITH TIME ZONE,
    locked_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    unlock_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_payroll_period_branch UNIQUE (period_month, branch_id)
);

CREATE INDEX IF NOT EXISTS idx_payroll_periods_lookup ON payroll_periods(period_month, branch_id);
CREATE INDEX IF NOT EXISTS idx_payroll_periods_status ON payroll_periods(status);

-- 3. Bổ sung trường hủy xác nhận bỏ việc cho bảng resignation_requests
ALTER TABLE resignation_requests ADD COLUMN IF NOT EXISTS cancelled_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE resignation_requests ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;
