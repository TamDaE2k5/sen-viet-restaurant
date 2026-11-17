import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Flame,
  FileSpreadsheet,
  Users,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardProps {
  onNavigateToKitchen?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigateToKitchen }) => {
  const { user, isKitchen, isManager, isAccountant } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-brand-700 via-brand-600 to-brand-500 rounded-2xl p-6 text-white shadow-lg shadow-brand-700/20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-sm mb-2">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Hệ thống Quản trị Vận hành</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Xin chào, {user.fullName}!
            </h2>
            <p className="text-white/80 text-sm mt-1">
              Chi nhánh: <span className="font-semibold text-white">{user.branchName || 'Toàn hệ thống'}</span> | Trạng thái: <span className="font-semibold text-green-300">Đang hoạt động</span>
            </p>
          </div>
          <div className="flex sm:flex-col items-start sm:items-end gap-1">
            <span className="text-xs text-white/70">Mã chi nhánh</span>
            <span className="px-2.5 py-1 rounded bg-black/20 font-mono text-xs font-semibold">
              {user.branchCode || 'CENTRAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Phân hệ thao tác nhanh cho Bếp */}
      {isKitchen && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
              Khu Vực Bếp & Bar (Thao Tác Nhanh)
            </h3>
            {onNavigateToKitchen && (
              <button
                onClick={onNavigateToKitchen}
                className="text-xs font-bold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>Mở Giao Diện 4 Nút</span>
                <ArrowUpRight className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={onNavigateToKitchen}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-brand-500 transition-all"
            >
              <div className="flex items-center gap-2 text-brand-600 font-bold text-sm">
                <Flame className="h-5 w-5" />
                <span>Mẻ Chế Biến</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Cân mẻ đầu vào, thành phẩm và cảnh báo mẻ 2
              </p>
              <div className="mt-3 text-xs font-semibold text-brand-600 flex items-center gap-1">
                <span>Vào thực hiện</span>
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>

            <div
              onClick={onNavigateToKitchen}
              className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between cursor-pointer hover:border-blue-500 transition-all"
            >
              <div className="flex items-center gap-2 text-blue-600 font-bold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                <span>Ra Line (+1)</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Ghi nhận đĩa ra quầy buffet với chống double-click
              </p>
              <div className="mt-3 text-xs font-semibold text-blue-600 flex items-center gap-1">
                <span>Vào thực hiện</span>
                <ArrowUpRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Thẻ Phân Hệ Quản Trị Hệ Thống */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
          Tổng Quan 5 Phân Hệ Dự Án Sen Việt Buffet
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 1: Hạ Tầng & Auth RBAC</h4>
            <p className="text-xs text-slate-500 mt-1">
              Docker Compose 3 tầng, Spring Security JWT, 5 vai trò phân quyền và App Shell responsive.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-green-700 bg-green-100 rounded">
              ✅ Hoàn Thành
            </span>
          </div>

          <div
            onClick={onNavigateToKitchen}
            className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer hover:border-emerald-500"
          >
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Flame className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 2: Phân Hệ Bếp Di Động</h4>
            <p className="text-xs text-slate-500 mt-1">
              Màn hình 4 nút bấm lớn, cảnh báo mẻ 2, cân hao hụt % loss và nén ảnh báo hỏng.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100 rounded">
              ✅ Hoàn Thành (Phase 2)
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 3: Đối Soát CukCuk POS</h4>
            <p className="text-xs text-slate-500 mt-1">
              Đọc file Excel doanh thu, 6 công thức đối soát kho và cảnh báo đỏ thất thoát &gt; 300k.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-blue-700 bg-blue-100 rounded">
              📊 Phase 3
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center mb-3">
              <Clock className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 4: Chấm Công GPS & Nhân Sự</h4>
            <p className="text-xs text-slate-500 mt-1">
              Geofencing &lt; 50m, thi nghề theo giờ máy chủ, cảnh báo bỏ việc và thu hồi đồng phục.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-purple-700 bg-purple-100 rounded">
              📍 Phase 4
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
              <Wallet className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 5: Bảng Lương & Ứng Lương</h4>
            <p className="text-xs text-slate-500 mt-1">
              Ứng lương duyệt thực chi, tự động tăng lương thi đỗ và xuất file chuyển khoản ngân hàng.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-amber-700 bg-amber-100 rounded">
              💰 Phase 5
            </span>
          </div>

          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <Users className="h-6 w-6" />
            </div>
            <h4 className="font-semibold text-slate-900 text-sm">Giai Đoạn 6: Kiểm Thử Toàn Diện</h4>
            <p className="text-xs text-slate-500 mt-1">
              Seed dữ liệu 2 chi nhánh, unit test TDD và nghiệm thu 10 tiêu chí theo hợp đồng.
            </p>
            <span className="inline-block mt-3 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 bg-emerald-100 rounded">
              🎯 Phase 6
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
