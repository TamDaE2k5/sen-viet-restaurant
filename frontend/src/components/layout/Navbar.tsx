import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, MapPin, ShieldCheck, Utensils } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const getRoleDisplayName = (roles: string[]) => {
    if (roles.includes('ROLE_KITCHEN_STAFF')) return 'Nhân viên Bếp / Bar';
    if (roles.includes('ROLE_RESTAURANT_MANAGER')) return 'Quản lý Nhà hàng';
    if (roles.includes('ROLE_BRANCH_ACCOUNTANT')) return 'Kế toán Chi nhánh';
    if (roles.includes('ROLE_GENERAL_ACCOUNTANT')) return 'Kế toán Tổng / Admin';
    if (roles.includes('ROLE_EMPLOYEE')) return 'Nhân viên';
    return 'Người dùng';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-brand-600 to-brand-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
            <Utensils className="h-6 w-6" />
          </div>
          <div>
            <span className="font-bold text-lg text-slate-900 tracking-tight block">
              Sen Việt Buffet
            </span>
            <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
              <MapPin className="h-3 w-3 text-brand-600" />
              {user.branchName || 'Toàn hệ thống'}
            </span>
          </div>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-sm font-semibold text-slate-800 leading-tight">
              {user.fullName}
            </span>
            <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full inline-flex items-center gap-1 mt-0.5 self-end">
              <ShieldCheck className="h-3 w-3" />
              {getRoleDisplayName(user.roles)}
            </span>
          </div>

          <button
            onClick={logout}
            title="Đăng xuất khỏi hệ thống"
            className="btn-touch p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-sm font-medium border border-transparent hover:border-red-100"
          >
            <LogOut className="h-5 w-5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
