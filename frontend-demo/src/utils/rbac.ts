import { User, RoleName } from '../types/auth';

export type ViewId =
  | 'dashboard'
  | 'kitchen'
  | 'warehouse'
  | 'reconciliation'
  | 'kitchen-monitor'
  | 'hr-attendance'
  | 'payroll'
  | 'attendance'
  | 'exam'
  | 'profile';

/**
 * Kiểm tra người dùng có một vai trò cụ thể hay không (chuẩn hóa tiền tố ROLE_)
 */
export function userHasRole(user: User | null | undefined, role: string): boolean {
  if (!user || !user.roles || !Array.isArray(user.roles)) return false;
  const normalized = role.startsWith('ROLE_') ? role : `ROLE_${role}`;
  return user.roles.some((r) => r === role || r === normalized);
}

/**
 * Kiểm tra xem một phân hệ / màn hình (View) có được phép hiển thị cho người dùng hay không.
 * Tuân thủ nghiêm ngặt ma trận phân quyền Giai đoạn 12:
 * - ROLE_KITCHEN_STAFF: CHỈ thấy Bếp ('kitchen') và Cổng cá nhân nếu có ROLE_EMPLOYEE. Tuyệt đối ẨN Kho, Đối soát, Bảng lương, Admin, Dashboard.
 * - ROLE_EMPLOYEE: CHỈ thấy Cổng cá nhân (Attendance, Exams, Personal Payslip, Advance). Tuyệt đối ẨN Bếp, Kho, Đối soát, Bảng lương chuỗi, Dashboard.
 * - ROLE_RESTAURANT_MANAGER: Thấy Dashboard, Kitchen (duyệt hỏng & giám sát), Reconciliation chi nhánh, HR chi nhánh. ẨN Kho NCC chuỗi & Khóa lương.
 * - ROLE_BRANCH_ACCOUNTANT: Thấy Dashboard, Warehouse chi nhánh, Reconciliation chi nhánh, Payroll chi nhánh. ẨN Bếp, Cấu hình hệ thống.
 * - ROLE_GENERAL_ACCOUNTANT: Thấy toàn bộ tất cả phân hệ.
 */
export function isViewAuthorized(viewId: string, user: User | null | undefined): boolean {
  if (!user) return false;

  const isGenAcc = userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT');
  const isMgr = userHasRole(user, 'ROLE_RESTAURANT_MANAGER');
  const isBrAcc = userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT');
  const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');
  const isEmp = userHasRole(user, 'ROLE_EMPLOYEE');

  // Kế toán tổng chuỗi / Admin có toàn quyền truy cập tất cả phân hệ
  if (isGenAcc) return true;

  switch (viewId) {
    case 'dashboard':
      // Bếp và Nhân viên thuần túy không có quyền truy cập Dashboard quản trị
      return isMgr || isBrAcc;

    case 'kitchen':
      // Bếp viên và Quản lý nhà hàng có quyền thao tác / giám sát mẻ bếp
      return isKitchen || isMgr;

    case 'warehouse':
      // Kế toán chi nhánh quản lý kho cơ sở & lô hàng; Quản lý nhà hàng & Bếp không quản lý kho NCC
      return isBrAcc;

    case 'reconciliation':
      // Quản lý nhà hàng và Kế toán chi nhánh xem đối soát cuối ngày CukCuk
      return isMgr || isBrAcc;

    case 'hr-attendance':
    case 'attendance':
    case 'exam':
    case 'profile':
      // Cổng cá nhân dành cho mọi nhân viên, hoặc Quản lý chi nhánh quản trị nhân sự
      return isEmp || isKitchen || isMgr || isBrAcc;

    case 'payroll':
      // Kế toán chi nhánh quản lý bảng lương & duyệt chi ứng lương
      return isBrAcc;

    case 'kitchen-monitor':
      // Giám sát toàn chuỗi chỉ mở cho Kế toán tổng chuỗi
      return false;

    default:
      return false;
  }
}

/**
 * Trả về màn hình mặc định hợp lệ cho người dùng khi đăng nhập hoặc khi truy cập sai quyền
 */
export function getDefaultAuthorizedView(
  user: User | null | undefined,
  isMobile = false
): string {
  if (!user) return isMobile ? 'attendance' : 'kitchen';

  const isGenAcc = userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT');
  const isMgr = userHasRole(user, 'ROLE_RESTAURANT_MANAGER');
  const isBrAcc = userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT');
  const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');
  const isEmp = userHasRole(user, 'ROLE_EMPLOYEE');

  if (isGenAcc) {
    return isMobile ? 'dashboard' : 'dashboard';
  }
  if (isMgr) {
    return isMobile ? 'dashboard' : 'dashboard';
  }
  if (isBrAcc) {
    return isMobile ? 'dashboard' : 'dashboard';
  }
  if (isKitchen) {
    return isMobile ? 'kitchen' : 'kitchen';
  }
  if (isEmp) {
    return isMobile ? 'attendance' : 'hr-attendance';
  }

  return isMobile ? 'attendance' : 'kitchen';
}

/**
 * Danh sách vai trò hiển thị thân thiện tiếng Việt
 */
export function getRoleDisplayBadges(roles: RoleName[] = []): string[] {
  const badges: string[] = [];
  if (roles.includes('ROLE_KITCHEN_STAFF')) badges.push('Bếp / Bar 4 Nút');
  if (roles.includes('ROLE_RESTAURANT_MANAGER')) badges.push('Quản Lý Nhà Hàng');
  if (roles.includes('ROLE_BRANCH_ACCOUNTANT')) badges.push('Kế Toán Chi Nhánh');
  if (roles.includes('ROLE_GENERAL_ACCOUNTANT')) badges.push('Kế Toán Tổng Chuỗi');
  if (roles.includes('ROLE_EMPLOYEE')) badges.push('Nhân Viên Phục Vụ');
  return badges.length > 0 ? badges : ['Nhân Viên'];
}
