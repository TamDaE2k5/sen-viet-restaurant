import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { isViewAuthorized, userHasRole } from '../../utils/rbac';
import { useBreakpoint } from '../../hooks/useBreakpoint';
import {
  LayoutDashboard,
  Flame,
  FileSpreadsheet,
  Boxes,
  Users,
  Wallet,
  LogOut,
  MapPin,
  ShieldCheck,
  Utensils,
  Clock,
  Award,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Crown,
  ChefHat,
  Briefcase,
  Building2,
} from 'lucide-react';

export interface AdaptiveShellProps {
  children: React.ReactNode;
  activeView: string;
  onViewChange: (view: string) => void;
}

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ElementType;
  section: 'primary-mgmt' | 'kitchen-ops' | 'hr-mgmt';
  badge?: string;
}

const ALL_NAV_ITEMS: NavItem[] = [
  // Nhóm Quản Trị Cấp Cao & Chỉ Huy
  {
    id: 'executive-cockpit',
    label: 'Bảng Chỉ Huy Giám Đốc (10s)',
    shortLabel: 'Chỉ Huy 10s',
    icon: Crown,
    section: 'primary-mgmt',
  },
  {
    id: 'head-chef',
    label: 'Chỉ Huy Bếp Trưởng (Duyệt & Đặt)',
    shortLabel: 'Bếp Trưởng',
    icon: ChefHat,
    section: 'primary-mgmt',
  },
  {
    id: 'branch-manager',
    label: 'Trung Tâm Quản Lý Chi Nhánh',
    shortLabel: 'Điều Hành',
    icon: Briefcase,
    section: 'primary-mgmt',
  },
  {
    id: 'dashboard',
    label: 'Tổng Quan Hệ Thống',
    shortLabel: 'Tổng Quan',
    icon: LayoutDashboard,
    section: 'primary-mgmt',
  },

  // Nhóm Vận Hành & Kho Bếp
  {
    id: 'kitchen',
    label: 'Bếp 4 Nút & Cân Mẻ',
    shortLabel: 'Bếp 4 Nút',
    icon: Flame,
    section: 'kitchen-ops',
  },
  {
    id: 'warehouse',
    label: 'Kho Cơ Sở & Lô Hàng',
    shortLabel: 'Kho Hàng',
    icon: Boxes,
    section: 'kitchen-ops',
  },
  {
    id: 'reconciliation',
    label: 'Đối Soát Cuối Ngày (CukCuk)',
    shortLabel: 'Đối Soát',
    icon: FileSpreadsheet,
    section: 'kitchen-ops',
  },

  // Nhóm Nhân Sự & Bảng Lương
  {
    id: 'hr-attendance',
    label: 'Nhân Sự & Chấm Công GPS',
    shortLabel: 'Nhân Sự',
    icon: Users,
    section: 'hr-mgmt',
  },
  {
    id: 'payroll',
    label: 'Bảng Lương & Ứng Lương',
    shortLabel: 'Bảng Lương',
    icon: Wallet,
    section: 'hr-mgmt',
  },
];

/**
 * AdaptiveShell (Khung bố cục thích ứng đa nền tảng theo chuẩn ui-ux-pro-max).
 * Phân hóa hoàn toàn menu giữa Chủ Chuỗi, Kế Toán Tổng, Bếp Trưởng, Quản Lý Chi Nhánh và Nhân viên.
 */
export const AdaptiveShell: React.FC<AdaptiveShellProps> = ({
  children,
  activeView,
  onViewChange,
}) => {
  const { user, logout, activeContext, setActiveContext, availableContexts, isMultiRole } = useAuth();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const [isTabletRailExpanded, setIsTabletRailExpanded] = useState(false);

  if (!user) return null;

  const isChuChuoi = userHasRole(user, 'ROLE_CHU_CHUOI') || user.username === 'admin_chu';
  const isHeadChef = userHasRole(user, 'ROLE_QL_BEP') || user.username === 'ql_bep_tn';
  const isBranchMgr = userHasRole(user, 'ROLE_QL_CHINHANH') || user.username === 'ql_chinhanh_tn';
  const isGenAcc =
    user.username === 'ketoan_tong' ||
    userHasRole(user, 'ROLE_GENERAL_ACCOUNTANT') ||
    userHasRole(user, 'ROLE_KETOAN_TONG') ||
    userHasRole(user, 'ROLE_ACCOUNTANT');
  const isMgr = userHasRole(user, 'ROLE_RESTAURANT_MANAGER');
  const isBrAcc = userHasRole(user, 'ROLE_BRANCH_ACCOUNTANT');
  const isKitchen = userHasRole(user, 'ROLE_KITCHEN_STAFF');

  // Lấy danh sách menu điều hướng riêng biệt theo vai trò người dùng (TASK-S3-01)
  const getRoleNavItems = (): NavItem[] => {
    // 1. CHỦ CHUỖI (admin_chu): Ưu tiên Bảng Chỉ Huy 10s, Báo Cáo Lãi/Lỗ, Đối Soát Chuỗi, Duyệt Lương
    if (isChuChuoi) {
      return [
        {
          id: 'executive-cockpit',
          label: 'Bảng Chỉ Huy Giám Đốc (10s)',
          shortLabel: 'Chỉ Huy',
          icon: Crown,
          section: 'primary-mgmt',
        },
        {
          id: 'reconciliation',
          label: 'Báo Cáo Đối Soát Chuỗi',
          shortLabel: 'Đối Soát',
          icon: FileSpreadsheet,
          section: 'kitchen-ops',
        },
        {
          id: 'payroll',
          label: 'Duyệt Lương & Thưởng Chuỗi',
          shortLabel: 'Quỹ Lương',
          icon: Wallet,
          section: 'hr-mgmt',
        },
        {
          id: 'warehouse',
          label: 'Giám Sát Kho Chuỗi',
          shortLabel: 'Kho Chuỗi',
          icon: Boxes,
          section: 'kitchen-ops',
        },
        {
          id: 'dashboard',
          label: 'Tổng Quan Hệ Thống',
          shortLabel: 'Tổng Quan',
          icon: LayoutDashboard,
          section: 'primary-mgmt',
        },
      ];
    }

    // 2. BẾP TRƯỞNG (ql_bep_tn): Chỉ huy bếp, duyệt báo hỏng, giám sát mẻ, đặt hàng NCC, quản lý kho cơ sở
    if (isHeadChef) {
      return [
        {
          id: 'head-chef',
          label: 'Chỉ Huy Bếp Trưởng (Duyệt & Đặt)',
          shortLabel: 'Bếp Trưởng',
          icon: ChefHat,
          section: 'primary-mgmt',
        },
        {
          id: 'kitchen',
          label: 'Bếp 4 Nút & Cân Mẻ',
          shortLabel: 'Bếp 4 Nút',
          icon: Flame,
          section: 'kitchen-ops',
        },
        {
          id: 'warehouse',
          label: 'Kho Cơ Sở & Lô Hàng',
          shortLabel: 'Kho Hàng',
          icon: Boxes,
          section: 'kitchen-ops',
        },
        {
          id: 'reconciliation',
          label: 'Đối Soát Nguyên Liệu Bếp',
          shortLabel: 'Đối Soát',
          icon: FileSpreadsheet,
          section: 'kitchen-ops',
        },
        {
          id: 'hr-attendance',
          label: 'Quân Số Bếp & Chấm Công',
          shortLabel: 'Chấm Công',
          icon: Users,
          section: 'hr-mgmt',
        },
      ];
    }

    // 3. QUẢN LÝ CHI NHÁNH (ql_chinhanh_tn): Kỷ luật ca, GPS, ra ngoài, ghi phạt, chấm thi tay nghề, quản lý kho cơ sở
    if (isBranchMgr) {
      return [
        {
          id: 'branch-manager',
          label: 'Điều Hành Quản Lý Chi Nhánh',
          shortLabel: 'Điều Hành',
          icon: Briefcase,
          section: 'primary-mgmt',
        },
        {
          id: 'kitchen',
          label: 'Giám Sát Bếp Chi Nhánh',
          shortLabel: 'Bếp & Mẻ',
          icon: Flame,
          section: 'kitchen-ops',
        },
        {
          id: 'warehouse',
          label: 'Kho Cơ Sở & Lô Hàng',
          shortLabel: 'Kho Hàng',
          icon: Boxes,
          section: 'kitchen-ops',
        },
        {
          id: 'reconciliation',
          label: 'Đối Soát Ca Chi Nhánh',
          shortLabel: 'Đối Soát',
          icon: FileSpreadsheet,
          section: 'kitchen-ops',
        },
        {
          id: 'hr-attendance',
          label: 'Nhân Sự & Kỷ Luật Ca',
          shortLabel: 'Nhân Sự',
          icon: Users,
          section: 'hr-mgmt',
        },
        {
          id: 'dashboard',
          label: 'Tổng Quan Chi Nhánh',
          shortLabel: 'Tổng Quan',
          icon: LayoutDashboard,
          section: 'primary-mgmt',
        },
      ];
    }

    // 4. KẾ TOÁN TỔNG (ketoan_tong): Hạch toán kế toán chi tiết, đối soát CukCuk, kho lô hàng, bảng lương
    if (isGenAcc) {
      return [
        {
          id: 'dashboard',
          label: 'Tổng Quan Kế Toán Tổng',
          shortLabel: 'Kế Toán',
          icon: LayoutDashboard,
          section: 'primary-mgmt',
        },
        {
          id: 'warehouse',
          label: 'Kho Cơ Sở & Lô Hàng',
          shortLabel: 'Kho Hàng',
          icon: Boxes,
          section: 'kitchen-ops',
        },
        {
          id: 'reconciliation',
          label: 'Đối Soát Cuối Ngày (CukCuk)',
          shortLabel: 'Đối Soát',
          icon: FileSpreadsheet,
          section: 'kitchen-ops',
        },
        {
          id: 'payroll',
          label: 'Bảng Lương & Ứng Lương',
          shortLabel: 'Bảng Lương',
          icon: Wallet,
          section: 'hr-mgmt',
        },
        {
          id: 'kitchen',
          label: 'Giám Sát Bếp & Mẻ',
          shortLabel: 'Bếp & Mẻ',
          icon: Flame,
          section: 'kitchen-ops',
        },
        {
          id: 'hr-attendance',
          label: 'Nhân Sự Toàn Hệ Thống',
          shortLabel: 'Nhân Sự',
          icon: Users,
          section: 'hr-mgmt',
        },
      ];
    }

    // 5. Fallback vai trò khác (Bếp viên, Nhân viên phục vụ, Kế toán chi nhánh)
    return ALL_NAV_ITEMS.filter((item) => isViewAuthorized(item.id, user));
  };

  const authorizedNavItems = getRoleNavItems();

  // Tên hiển thị vai trò người dùng
  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('ROLE_CHU_CHUOI') || user.username === 'admin_chu') return 'Chủ Chuỗi / Ban Giám Đốc';
    if (roles.includes('ROLE_QL_BEP') || user.username === 'ql_bep_tn') return 'Bếp Trưởng Điều Hành';
    if (roles.includes('ROLE_QL_CHINHANH') || user.username === 'ql_chinhanh_tn') return 'Quản Lý Chi Nhánh';
    if (
      roles.includes('ROLE_GENERAL_ACCOUNTANT') ||
      roles.includes('ROLE_KETOAN_TONG') ||
      roles.includes('ROLE_ACCOUNTANT') ||
      user.username === 'ketoan_tong'
    ) return 'Kế Toán Tổng Chuỗi';
    if (roles.includes('ROLE_BRANCH_ACCOUNTANT')) return 'Kế Toán Chi Nhánh';
    if (roles.includes('ROLE_KITCHEN_STAFF')) return 'Bếp / Bar 4 Nút';
    if (roles.includes('ROLE_RESTAURANT_MANAGER')) return 'Quản Lý Nhà Hàng';
    return 'Nhân Viên Phục Vụ';
  };

  // Avatar chữ cái đầu
  const getInitials = (name: string) => {
    if (!name) return 'SV';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Danh sách các tab Mobile theo vai trò RBAC (tối đa 5 tab chuẩn Thumb-zone)
  const getMobileTabs = () => {
    // 1. CHỦ CHUỖI
    if (isChuChuoi) {
      return [
        { id: 'executive-cockpit', label: 'Chỉ Huy', icon: Crown },
        { id: 'reconciliation', label: 'Đối Soát', icon: FileSpreadsheet },
        { id: 'payroll', label: 'Quỹ Lương', icon: Wallet },
        { id: 'warehouse', label: 'Kho Hàng', icon: Boxes },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 2. BẾP TRƯỞNG
    if (isHeadChef) {
      return [
        { id: 'head-chef', label: 'Bếp Trưởng', icon: ChefHat },
        { id: 'kitchen', label: 'Bếp 4 Nút', icon: Flame },
        { id: 'reconciliation', label: 'Đối Soát', icon: FileSpreadsheet },
        { id: 'attendance', label: 'Chấm Công', icon: Clock },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 3. QUẢN LÝ CHI NHÁNH
    if (isBranchMgr) {
      return [
        { id: 'branch-manager', label: 'Điều Hành', icon: Briefcase },
        { id: 'kitchen', label: 'Bếp & Mẻ', icon: Flame },
        { id: 'reconciliation', label: 'Đối Soát', icon: FileSpreadsheet },
        { id: 'attendance', label: 'Chấm Công', icon: Clock },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 4. KẾ TOÁN TỔNG
    if (isGenAcc) {
      return [
        { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
        { id: 'reconciliation', label: 'Đối Soát', icon: FileSpreadsheet },
        { id: 'payroll', label: 'Lương', icon: Wallet },
        { id: 'warehouse', label: 'Kho Hàng', icon: Boxes },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 5. KẾ TOÁN CHI NHÁNH
    if (isBrAcc) {
      return [
        { id: 'dashboard', label: 'Tổng Quan', icon: LayoutDashboard },
        { id: 'warehouse', label: 'Kho Cơ Sở', icon: Boxes },
        { id: 'reconciliation', label: 'Đối Soát', icon: FileSpreadsheet },
        { id: 'payroll', label: 'Bảng Lương', icon: Wallet },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 6. NHÂN VIÊN BẾP
    if (isKitchen) {
      return [
        { id: 'kitchen', label: 'Bếp 4 Nút', icon: Flame },
        { id: 'attendance', label: 'Chấm Công', icon: Clock },
        { id: 'exam', label: 'Thi Nghề', icon: Award },
        { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
      ];
    }

    // 7. NHÂN VIÊN CHUNG
    return [
      { id: 'attendance', label: 'Chấm Công', icon: Clock },
      { id: 'exam', label: 'Thi Nghề', icon: Award },
      { id: 'profile', label: 'Cá Nhân', icon: UserCheck },
    ];
  };

  const mobileTabs = getMobileTabs();

  // Kiểm tra tab mobile nào đang active
  const isMobileTabActive = (tabId: string) => {
    if (activeView === tabId) return true;
    if (tabId === 'attendance' && (activeView === 'hr-attendance' || activeView === 'attendance')) return true;
    if (tabId === 'profile' && activeView === 'profile') return true;
    if (tabId === 'exam' && activeView === 'exam') return true;
    return false;
  };

  // Tiêu đề nhóm Sidebar động theo vai trò
  const getSidebarHeaderTitle = () => {
    if (isChuChuoi) return 'BAN GIÁM ĐỐC CHỦ CHUỖI';
    if (isHeadChef) return 'ĐIỀU HÀNH BẾP TRƯỞNG';
    if (isBranchMgr) return 'QUẢN LÝ CHI NHÁNH';
    if (isGenAcc) return 'HẠCH TOÁN KẾ TOÁN TỔNG';
    return 'CHỨC NĂNG HỆ THỐNG';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* ─────────────────────────────────────────────────────────
          TOP HEADER / NAVBAR (Cố định ở trên cho mọi màn hình)
      ───────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-card">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 flex-shrink-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 via-brand-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-brand-600/20 flex-shrink-0">
              <Utensils className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight block leading-tight">
                Sen Việt Buffet
              </span>
              <span className="text-[11px] sm:text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                <MapPin className="h-3 w-3 text-brand-600 shrink-0" />
                <span className="truncate max-w-[130px] sm:max-w-none">
                  {user.branchName || 'Toàn hệ thống (Hội sở)'}
                </span>
              </span>
            </div>
          </div>

          {/* MULTI-ROLE CONTEXT SWITCHER (Nút chuyển không gian làm việc) */}
          {isMultiRole && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {availableContexts.map((ctx) => {
                const isSelected = activeContext === ctx.id;
                return (
                  <button
                    key={ctx.id}
                    onClick={() => setActiveContext(ctx.id)}
                    title={ctx.description}
                    className={`btn-touch px-2 sm:px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-extrabold'
                        : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    {ctx.id === 'KITCHEN' && (
                      <Flame className={`h-4 w-4 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />
                    )}
                    {ctx.id === 'EMPLOYEE_PORTAL' && (
                      <UserCheck className={`h-4 w-4 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`} />
                    )}
                    {ctx.id === 'MANAGEMENT' && (
                      <LayoutDashboard className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                    )}
                    <span className="hidden md:inline">{ctx.label}</span>
                    <span className="inline md:hidden">{ctx.badge}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* User Profile Info & Logout */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-sm font-bold text-slate-800 leading-tight">
                {user.fullName}
              </span>
              <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 self-end">
                <ShieldCheck className="h-3 w-3" />
                {getRoleDisplayName(user.roles)}
              </span>
            </div>

            <button
              onClick={logout}
              title="Đăng xuất khỏi hệ thống"
              className="btn-touch p-2 sm:px-3 sm:py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors flex items-center gap-1.5 text-xs sm:text-sm font-semibold border border-transparent hover:border-rose-100"
            >
              <LogOut className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* ─────────────────────────────────────────────────────────
          BODY CONTAINER (3 Chế độ: Mobile, Tablet Rail, Desktop Sidebar)
      ───────────────────────────────────────────────────────── */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* ──────── 1. TABLET SLIM RAIL (640px - 1024px) ──────── */}
        <aside
          className={`hidden sm:flex lg:hidden flex-col bg-white border-r border-slate-200 p-2 transition-all duration-200 flex-shrink-0 ${
            isTabletRailExpanded ? 'w-56' : 'w-20'
          }`}
        >
          {/* Toggle Expand Rail Button */}
          <div className="flex justify-end p-1 mb-2">
            <button
              onClick={() => setIsTabletRailExpanded(!isTabletRailExpanded)}
              title={isTabletRailExpanded ? 'Thu hẹp thanh rail' : 'Mở rộng thanh rail'}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isTabletRailExpanded ? (
                <ChevronLeft className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>

          <nav className="space-y-2 flex-1">
            {authorizedNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onViewChange(item.id)}
                  title={item.label}
                  className={`btn-touch w-full flex items-center rounded-xl transition-all ${
                    isTabletRailExpanded ? 'px-3 py-2.5 gap-3' : 'flex-col justify-center py-2 px-1 gap-1'
                  } ${
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-600 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 shrink-0 ${isActive ? 'text-brand-600' : 'text-slate-400'}`}
                  />
                  <span
                    className={`truncate text-center ${
                      isTabletRailExpanded ? 'text-xs font-semibold' : 'text-[10px] leading-tight font-medium'
                    }`}
                  >
                    {isTabletRailExpanded ? item.label : item.shortLabel || item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ──────── 2. DESKTOP FULL ENTERPRISE SIDEBAR (> 1024px) ──────── */}
        <aside className="hidden lg:block w-72 flex-shrink-0 py-6 pl-4 lg:pl-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card sticky top-24 space-y-5">
            {/* User Profile Card */}
            <div className="p-3 bg-gradient-to-br from-slate-50 to-slate-100/70 rounded-xl border border-slate-200/80 flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-brand-600 via-rose-600 to-amber-600 text-white font-extrabold text-sm flex items-center justify-center shadow-md shadow-brand-600/20 shrink-0">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-bold text-slate-900 truncate">{user.fullName}</div>
                <div className="text-[11px] font-semibold text-brand-700 bg-brand-50 border border-brand-200/60 rounded-full px-2 py-0.5 inline-flex items-center gap-1 mt-0.5 max-w-full truncate">
                  <ShieldCheck className="h-3 w-3 shrink-0" />
                  <span className="truncate">{getRoleDisplayName(user.roles)}</span>
                </div>
              </div>
            </div>

            {/* Navigation Groups */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between px-2.5 py-1 text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">
                  <span>{getSidebarHeaderTitle()}</span>
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.2 rounded">
                    {authorizedNavItems.length}
                  </span>
                </div>
                <nav className="space-y-1 mt-1">
                  {authorizedNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeView === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => onViewChange(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-extrabold border-l-4 border-brand-600 shadow-sm'
                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          className={`h-4.5 w-4.5 shrink-0 ${
                            isActive ? 'text-brand-600' : 'text-slate-400'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {authorizedNavItems.length === 0 && (
                <div className="p-3 text-xs text-amber-700 bg-amber-50 rounded-xl flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Không có quyền truy cập phân hệ nào</span>
                </div>
              )}
            </div>

            {/* Sidebar Footer: System Status */}
            <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>IndexedDB Online</span>
              </span>
              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                Sprint 3 Ready
              </span>
            </div>
          </div>
        </aside>

        {/* ──────── 3. MAIN CONTENT AREA (Đa nền tảng) ──────── */}
        <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-24 sm:pb-8">
          {children}
        </main>
      </div>

      {/* ─────────────────────────────────────────────────────────
          MOBILE BOTTOM NAVIGATION (< 640px)
          Thiết kế chuẩn Thumb-zone, tối đa 5 tab mượt mà, phản hồi rung/chạm
      ───────────────────────────────────────────────────────── */}
      <nav aria-label="Mobile Navigation" className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-drawer pb-safe">
        <div className="flex items-center justify-around h-16 px-1">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = isMobileTabActive(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => onViewChange(tab.id)}
                className={`btn-touch flex-1 flex flex-col items-center justify-center py-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-brand-600 font-extrabold bg-brand-50/70'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <div className="relative">
                  <Icon
                    className={`h-5 w-5 transition-transform ${
                      isActive ? 'scale-110 text-brand-600' : 'text-slate-400'
                    }`}
                  />
                  {isActive && (
                    <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-brand-600" />
                  )}
                </div>
                <span className="text-[10px] mt-1 font-medium tracking-tight">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default AdaptiveShell;
