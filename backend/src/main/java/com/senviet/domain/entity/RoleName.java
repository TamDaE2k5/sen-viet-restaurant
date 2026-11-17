package com.senviet.domain.entity;

/**
 * Danh sách 5 vai trò phân quyền cốt lõi của hệ thống Sen Việt Buffet.
 */
public enum RoleName {
    ROLE_KITCHEN_STAFF,       // Nhân viên Bếp / Bar (4 Nút bấm lớn)
    ROLE_RESTAURANT_MANAGER,    // Quản lý Chi nhánh / Quản lý Bếp
    ROLE_BRANCH_ACCOUNTANT,     // Kế toán Chi nhánh
    ROLE_GENERAL_ACCOUNTANT,    // Kế toán Tổng chuỗi
    ROLE_EMPLOYEE               // Nhân viên thông thường (Chấm công, Xem ca, Đề xuất ứng lương)
}
