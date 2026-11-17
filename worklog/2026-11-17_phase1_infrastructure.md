# Nhật Ký Phát Triển: Giai Đoạn 1 - Kiến Trúc, Hạ Tầng & Phân Quyền (Phase 1)
- **Thời gian bắt đầu**: 2026-11-17 22:10 (UTC+7)
- **Người thực hiện**: Lead Builder (AI Agent) & Lead Verifier (AI Agent)
- **Mã Task liên quan**: P1-INFRA (Tasks 1.1 - 1.6)
- **Nhánh Git**: `dev`
- **Trạng thái**: 🔄 Đang triển khai

---

### 1. Mục Tiêu Giai Đoạn 1
Thiết lập bộ khung dự án full-stack hoàn chỉnh theo kiến trúc độc lập, hiện đại:
- **Hạ tầng**: Docker Compose 3 tầng (PostgreSQL 16, Spring Boot 3.2+ Backend, React 18 Vite Frontend Nginx).
- **Backend**: Spring Boot 3.2+, Java 17 LTS, Flyway Migration, Spring Security 6.x + JWT, BCrypt, RBAC 5 vai trò (`ROLE_KITCHEN_STAFF`, `ROLE_RESTAURANT_MANAGER`, `ROLE_BRANCH_ACCOUNTANT`, `ROLE_GENERAL_ACCOUNTANT`, `ROLE_EMPLOYEE`).
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS + Lucide React, giao diện Responsive thích ứng Mobile (Bếp 4 nút) và Desktop (Dashboard Quản lý/Kế toán).
- **Dữ liệu**: Seed 2 chi nhánh (Thái Nguyên, Quế Võ) và 5 tài khoản demo tương ứng 5 vai trò.

---

### 2. Tiến Độ Thực Hiện Từng Task

#### Task 1.1: Khởi tạo Cấu trúc Dự án & Docker Compose
- **Tập tin**:
  - `docker-compose.yml`: Cấu hình 3 dịch vụ `postgres` (port 5432, volume `postgres_data`, healthcheck `pg_isready`), `backend` (port 8080, healthcheck actuator), `frontend` (port 80, nginx reverse proxy).
  - `.env.example`: Mẫu biến môi trường bảo mật với đầy đủ chú thích tiếng Việt cho cấu hình DB, JWT, Port và Zalo Webhook.
  - `backend/`, `frontend/`: Cấu trúc thư mục mã nguồn.
- **Kiểm tra**:
  - `docker compose config` hợp lệ.
  - Container `senviet-postgres` khởi động thành công và đạt trạng thái `healthy` trên cổng 5432.
  - Gắn volume `postgres_data` bền vững.
- **Trạng thái**: ✅ Hoàn thành.
