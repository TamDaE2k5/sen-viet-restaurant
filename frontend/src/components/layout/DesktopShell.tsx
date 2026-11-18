import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { LayoutDashboard, Flame, FileSpreadsheet, Users, Wallet, Settings, Boxes, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isViewAuthorized } from '../../utils/rbac';

interface DesktopShellProps {
  children: ReactNode;
  activeMenu?: string;
  onMenuChange?: (menu: string) => void;
}

export const DesktopShell: React.FC<DesktopShellProps> = ({
  children,
  activeMenu = 'dashboard',
  onMenuChange,
}) => {
  const { user } = useAuth();

  const allMenuItems = [
    { id: 'dashboard', label: 'Tổng quan Hệ thống', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Bếp 4 Nút & Cân Mẻ', icon: Flame },
    { id: 'warehouse', label: 'Kho Cơ Sở & Lô Hàng (Lots)', icon: Boxes },
    { id: 'reconciliation', label: 'Đối soát Cuối ngày (CukCuk)', icon: FileSpreadsheet },
    { id: 'kitchen-monitor', label: 'Giám sát Toàn Chuỗi', icon: Settings },
    { id: 'hr-attendance', label: 'Nhân sự & Chấm công GPS', icon: Users },
    { id: 'payroll', label: 'Bảng lương & Ứng lương', icon: Wallet },
  ];

  // Lọc chặt chẽ danh sách menu theo vai trò người dùng (Task 12.1: RBAC View Guard)
  const menuItems = allMenuItems.filter((item) => isViewAuthorized(item.id, user));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm sticky top-20">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Phân Hệ Được Phép
              </span>
              <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
                {menuItems.length} mục
              </span>
            </div>

            <nav className="space-y-1 mt-1">
              {menuItems.length === 0 ? (
                <div className="p-3 text-xs text-amber-700 bg-amber-50 rounded-lg flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>Không có quyền truy cập phân hệ nào</span>
                </div>
              ) : (
                menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onMenuChange && onMenuChange(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-bold border-l-4 border-brand-600 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })
              )}
            </nav>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
