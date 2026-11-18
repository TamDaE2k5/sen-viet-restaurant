import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { resetToSeedData } from '../../db/dbService';
import { db } from '../../db/schema';
import {
  RotateCcw,
  Sparkles,
  Users,
  Building2,
  Check,
  ChevronDown,
  Flame,
  ChefHat,
  Briefcase,
  Calculator,
  Crown,
} from 'lucide-react';

interface RoleOption {
  username: string;
  label: string;
  roleBadge: string;
  icon: React.ReactNode;
  color: string;
}

const DEMO_ROLES: RoleOption[] = [
  {
    username: 'bep_tn',
    label: 'Nguyễn Văn Bếp',
    roleBadge: 'Bếp / Bar',
    icon: <Flame className="w-4 h-4 text-orange-500" />,
    color: 'hover:bg-orange-50 text-orange-700',
  },
  {
    username: 'ql_bep_tn',
    label: 'Trần Thị Bếp Trưởng',
    roleBadge: 'Quản lý Bếp',
    icon: <ChefHat className="w-4 h-4 text-amber-500" />,
    color: 'hover:bg-amber-50 text-amber-700',
  },
  {
    username: 'ql_chinhanh_tn',
    label: 'Lê Hoàng Quản Lý',
    roleBadge: 'QL Chi nhánh',
    icon: <Briefcase className="w-4 h-4 text-blue-500" />,
    color: 'hover:bg-blue-50 text-blue-700',
  },
  {
    username: 'ketoan_tong',
    label: 'Phạm Thu Kế Toán',
    roleBadge: 'Kế toán Tổng',
    icon: <Calculator className="w-4 h-4 text-emerald-500" />,
    color: 'hover:bg-emerald-50 text-emerald-700',
  },
  {
    username: 'admin_chu',
    label: 'Đặng Tổng Giám Đốc',
    roleBadge: 'Chủ chuỗi / Admin',
    icon: <Crown className="w-4 h-4 text-purple-500" />,
    color: 'hover:bg-purple-50 text-purple-700',
  },
];

export const DemoToolbar: React.FC = () => {
  const { user, login } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [isResetting, setIsResetting] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);
  const [isBranchOpen, setIsBranchOpen] = useState(false);

  // Switch Role
  const handleSelectRole = async (username: string) => {
    setIsRoleOpen(false);
    try {
      await login({ username, password: 'any' });
      showSuccess(`Đã chuyển sang vai trò: ${username}`, 'CHUYỂN VAI TRÒ THÀNH CÔNG');
    } catch (err: any) {
      showError(err.message || 'Lỗi chuyển vai trò', 'LỖI');
    }
  };

  // Switch Branch
  const handleSelectBranch = async (branchId: number, branchName: string, branchCode: string) => {
    setIsBranchOpen(false);
    if (!user) return;
    try {
      await db.users.update(user.id, { branchId, branchName, branchCode });
      await login({ username: user.username, password: 'any' });
      showSuccess(`Đã chuyển làm việc tại: ${branchName}`, 'ĐỔI CHI NHÁNH THÀNH CÔNG');
    } catch (err: any) {
      showError(err.message || 'Lỗi đổi chi nhánh', 'LỖI');
    }
  };

  // Reset 1-Click Database
  const handleResetData = async () => {
    if (!window.confirm('Khôi phục toàn bộ cơ sở dữ liệu IndexedDB về dữ liệu mẫu ban đầu?')) {
      return;
    }
    try {
      setIsResetting(true);
      await resetToSeedData();
      // Giữ đăng nhập tài khoản hiện tại hoặc mặc định
      const currentUsername = user?.username || 'bep_tn';
      await login({ username: currentUsername, password: 'any' });
      showSuccess(
        'Đã khôi phục 100% dữ liệu mẫu ban đầu (Mẻ nấu, Báo hỏng, Đối soát CukCuk, Chấm công, Bảng lương)',
        'RESET DỮ LIỆU THÀNH CÔNG'
      );
      // F5 hoặc reload trang để đảm bảo các component refresh state
      setTimeout(() => {
        window.location.reload();
      }, 600);
    } catch (err: any) {
      showError('Lỗi khi khôi phục dữ liệu mẫu: ' + err.message, 'LỖI RESET');
    } finally {
      setIsResetting(false);
    }
  };

  const currentRoleOption = DEMO_ROLES.find((r) => r.username === user?.username) || DEMO_ROLES[0];
  const isThaiNguyen = !user?.branchId || user.branchId === 1;

  return (
    <div className="bg-slate-900 border-b border-slate-800 text-white text-xs py-2 px-3 sm:px-6 relative z-40 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 sm:gap-4">
        {/* Logo / Badge Standalone Demo */}
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <div className="flex items-center gap-1.5 font-bold tracking-wide text-slate-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">DEMO FRONTEND ĐỘC LẬP (IndexedDB)</span>
            <span className="sm:hidden">DEMO ĐỘC LẬP</span>
          </div>
        </div>

        {/* Controls: Quick Role Switcher + Branch Switcher + 1-Click Reset */}
        <div className="flex items-center flex-wrap gap-2">
          {/* 1. Quick Role Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsRoleOpen(!isRoleOpen);
                setIsBranchOpen(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Đổi vai trò người dùng trải nghiệm"
            >
              <Users className="w-3.5 h-3.5 text-brand-400" />
              <span className="font-semibold text-brand-300">
                {currentRoleOption.roleBadge}
              </span>
              <span className="hidden md:inline text-slate-300">
                ({currentRoleOption.label.split(' ').slice(-1)[0]})
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isRoleOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  Chọn 1 trong 5 vai trò trải nghiệm:
                </div>
                {DEMO_ROLES.map((r) => {
                  const isSelected = r.username === user?.username;
                  return (
                    <button
                      key={r.username}
                      onClick={() => handleSelectRole(r.username)}
                      className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                        isSelected ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {r.icon}
                        <div>
                          <div className="font-semibold">{r.label}</div>
                          <div className="text-[10px] text-slate-500">{r.roleBadge}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-brand-600" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Branch Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setIsBranchOpen(!isBranchOpen);
                setIsRoleOpen(false);
              }}
              className="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition-colors shadow-sm"
              title="Đổi chi nhánh nhà hàng"
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>{isThaiNguyen ? 'CN Thái Nguyên' : 'CN Quế Võ'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isBranchOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                  Chọn Chi nhánh làm việc:
                </div>
                <button
                  onClick={() =>
                    handleSelectBranch(1, 'Sen Việt Buffet - Chi nhánh Thái Nguyên', 'TN')
                  }
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                    isThaiNguyen ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Chi nhánh Thái Nguyên</div>
                    <div className="text-[10px] text-slate-500">188 Lương Ngọc Quyến</div>
                  </div>
                  {isThaiNguyen && <Check className="w-4 h-4 text-brand-600" />}
                </button>
                <button
                  onClick={() =>
                    handleSelectBranch(2, 'Sen Việt Buffet - Chi nhánh Quế Võ', 'QV')
                  }
                  className={`w-full text-left px-3 py-2 flex items-center justify-between text-xs transition-colors ${
                    !isThaiNguyen ? 'bg-brand-50 text-brand-700 font-bold' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="font-semibold">Chi nhánh Quế Võ</div>
                    <div className="text-[10px] text-slate-500">TX. Quế Võ, Bắc Ninh</div>
                  </div>
                  {!isThaiNguyen && <Check className="w-4 h-4 text-brand-600" />}
                </button>
              </div>
            )}
          </div>

          {/* 3. 1-Click "Reset Dữ Liệu Mẫu" */}
          <button
            onClick={handleResetData}
            disabled={isResetting}
            className="bg-rose-600 hover:bg-rose-700 disabled:bg-rose-800 text-white font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
            title="Khôi phục toàn bộ dữ liệu mẫu trong IndexedDB"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            <span>{isResetting ? 'Đang reset...' : '🔄 Reset Dữ Liệu Mẫu'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
