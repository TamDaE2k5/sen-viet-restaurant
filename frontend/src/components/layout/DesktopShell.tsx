import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { LayoutDashboard, Flame, FileSpreadsheet, Users, Wallet, Settings } from 'lucide-react';

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
  const menuItems = [
    { id: 'dashboard', label: 'Tổng quan Hệ thống', icon: LayoutDashboard },
    { id: 'kitchen', label: 'Bếp 4 Nút & Cân Mẻ', icon: Flame },
    { id: 'reconciliation', label: 'Đối soát Cuối ngày (CukCuk)', icon: FileSpreadsheet },
    { id: 'kitchen-monitor', label: 'Giám sát Kho Bếp', icon: Settings },
    { id: 'hr-attendance', label: 'Nhân sự & Chấm công GPS', icon: Users },
    { id: 'payroll', label: 'Bảng lương & Ứng lương', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 flex max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">
        {/* Sidebar Navigation */}
        <aside className="w-64 flex-shrink-0">
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm sticky top-20">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 py-2">
              Phân Hệ Quản Trị
            </div>
            <nav className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onMenuChange && onMenuChange(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                      isActive
                        ? 'bg-brand-50 text-brand-700 font-semibold border-l-4 border-brand-600'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
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
