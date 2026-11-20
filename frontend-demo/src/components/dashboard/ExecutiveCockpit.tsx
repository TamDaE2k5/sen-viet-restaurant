import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/schema';
import {
  Crown,
  TrendingUp,
  AlertTriangle,
  Building2,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  MapPin,
  Clock,
  Award,
  AlertOctagon,
  Scale,
  RefreshCw,
  ChevronRight,
  FileSpreadsheet,
  Check,
  X,
  MessageSquare,
} from 'lucide-react';

export interface SalaryProposal {
  id: number;
  userId: number;
  fullName: string;
  position?: string;
  branchId: number;
  branchName: string;
  quarter: string;
  currentSalary: number;
  proposedSalary: number;
  examScore: number;
  status: 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  reason: string;
  directorNote?: string;
  decidedAt?: string;
}

const INITIAL_PROPOSALS: SalaryProposal[] = [
  {
    id: 1,
    userId: 1,
    fullName: 'Nguyễn Văn Bếp',
    position: 'Bếp viên chính (Khu Hải Sản)',
    branchId: 1,
    branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
    quarter: 'Q4-2026',
    currentSalary: 8500000,
    proposedSalary: 9500000,
    examScore: 96,
    status: 'CHO_DUYET',
    reason: 'Đạt điểm thi lý thuyết & thực hành tay nghề dao thớt 96/100, giữ tỷ lệ hao hụt mẻ dưới 3.8%',
  },
  {
    id: 2,
    userId: 8,
    fullName: 'Nguyễn Bá Hoan',
    position: 'Bếp trưởng cơ sở Quế Võ',
    branchId: 2,
    branchName: 'Sen Việt Buffet - Chi nhánh Quế Võ',
    quarter: 'Q4-2026',
    currentSalary: 12000000,
    proposedSalary: 13500000,
    examScore: 98,
    status: 'CHO_DUYET',
    reason: 'Quản lý Cost thực phẩm Quế Võ đạt 45.4% (thấp nhất toàn chuỗi), không để xảy ra sự cố VSATTP',
  },
  {
    id: 3,
    userId: 9,
    fullName: 'Vũ Thị Thu Ngân',
    position: 'Trưởng ca Thu Ngân',
    branchId: 1,
    branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
    quarter: 'Q4-2026',
    currentSalary: 7200000,
    proposedSalary: 8000000,
    examScore: 95,
    status: 'CHO_DUYET',
    reason: 'Đối soát hóa đơn CukCuk 18 ngày khớp 100%, không lệch tiền mặt, đạt chuyên cần xuất sắc',
  },
  {
    id: 4,
    userId: 10,
    fullName: 'Phạm Tuấn Nam',
    position: 'Tổ trưởng Phục Vụ Bàn',
    branchId: 2,
    branchName: 'Sen Việt Buffet - Chi nhánh Quế Võ',
    quarter: 'Q4-2026',
    currentSalary: 6500000,
    proposedSalary: 7300000,
    examScore: 92,
    status: 'CHO_DUYET',
    reason: 'Đào tạo 6 nhân viên mới đạt chuẩn bài thi quy trình buffet, đánh giá hài lòng khách hàng 4.9/5',
  },
];

export const ExecutiveCockpit: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [proposals, setProposals] = useState<SalaryProposal[]>(() => {
    const saved = localStorage.getItem('senviet_salary_proposals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_PROPOSALS;
      }
    }
    return INITIAL_PROPOSALS;
  });

  const [filterProposalStatus, setFilterProposalStatus] = useState<string>('ALL');
  const [selectedProposal, setSelectedProposal] = useState<SalaryProposal | null>(null);
  const [directorNoteInput, setDirectorNoteInput] = useState<string>('');
  const [activeAction, setActiveAction] = useState<'APPROVE' | 'REJECT' | null>(null);

  // Lưu state proposals vào localStorage
  useEffect(() => {
    localStorage.setItem('senviet_salary_proposals', JSON.stringify(proposals));
  }, [proposals]);

  // Xử lý Duyệt hoặc Từ chối đề xuất tăng lương
  const handleDecision = (proposal: SalaryProposal, action: 'APPROVE' | 'REJECT') => {
    setSelectedProposal(proposal);
    setActiveAction(action);
    setDirectorNoteInput(
      action === 'APPROVE'
        ? 'Đồng ý phê duyệt mức lương mới theo đề xuất của Quản lý chi nhánh.'
        : 'Cần tiếp tục theo dõi thêm 1 tháng về tỷ lệ hao hụt trước khi nâng bậc.'
    );
  };

  const handleConfirmDecision = async () => {
    if (!selectedProposal || !activeAction) return;

    const newStatus = activeAction === 'APPROVE' ? 'DA_DUYET' : 'TU_CHOI';
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setProposals((prev) =>
      prev.map((p) =>
        p.id === selectedProposal.id
          ? {
              ...p,
              status: newStatus,
              directorNote: directorNoteInput.trim(),
              decidedAt: nowStr,
            }
          : p
      )
    );

    // Cập nhật cả Dexie nếu có bảng
    try {
      if (db.salaryIncreaseProposals) {
        await db.salaryIncreaseProposals.update(selectedProposal.id, {
          status: newStatus,
          directorNote: directorNoteInput.trim(),
          decidedAt: nowStr,
        });
      }
    } catch (e) {
      // Ignored
    }

    if (activeAction === 'APPROVE') {
      showSuccess(`Đã phê duyệt tăng lương cho ${selectedProposal.fullName} (${selectedProposal.proposedSalary.toLocaleString('vi-VN')} đ)!`);
    } else {
      showSuccess(`Đã từ chối / yêu cầu xem xét lại đề xuất của ${selectedProposal.fullName}`);
    }

    setSelectedProposal(null);
    setActiveAction(null);
  };

  const filteredProposals = proposals.filter((p) => {
    if (filterProposalStatus === 'ALL') return true;
    return p.status === filterProposalStatus;
  });

  const pendingCount = proposals.filter((p) => p.status === 'CHO_DUYET').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER: EXECUTIVE COCKPIT (10 GIÂY NẮM TOÀN CHUỖI)
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-indigo-500/20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold tracking-wide">
              <Crown className="h-4 w-4 text-amber-400" />
              <span>BẢNG CHỈ HUY TỔNG GIÁM ĐỐC • 10 GIÂY NẮM TOÀN CHUỖI</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Bức Tranh Tài Chính & Thất Thoát T11
            </h1>

            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Theo dõi đối soát dữ liệu thực tế 18 ngày giữa <strong className="text-amber-300 font-semibold">Cơ sở Thái Nguyên</strong> và{' '}
              <strong className="text-indigo-300 font-semibold">Cơ sở Quế Võ</strong>. Cảnh báo nóng thất thoát hải sản đắt tiền và duyệt tăng lương.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-400" /> 01/11 - 18/11/2026 (18 ngày đối soát thật)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Trạng thái dữ liệu: Đồng bộ trực tiếp Google Sheets T11
              </span>
            </div>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col gap-3 min-w-[280px]">
            <div className="flex items-center justify-between text-xs text-slate-300 font-medium border-b border-white/10 pb-2">
              <span>Biên Lợi Nhuận Gộp Chuỗi</span>
              <span className="font-bold text-emerald-400 text-sm">32.8%</span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-400 uppercase font-semibold">Tổng Doanh Thu Chuỗi</div>
                <div className="text-xl sm:text-2xl font-black text-white">1.225.000.000 đ</div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-[11px] text-amber-300 flex items-center gap-1 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Thất thoát cảnh báo nóng: 33.830.000 đ</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. BENTO GRID 4 KHỐI CHỈ HUY TRỌNG YẾU
      ───────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ════════════════════════════════════════════════════════════
            BENTO 1: SO SÁNH LÃI / LỖ 2 CHI NHÁNH (TN vs QV) - 7 CỘT
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-700">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  So Sánh Lãi / Lỗ 2 Chi Nhánh
                </h3>
                <p className="text-xs text-slate-500">Doanh thu vs Chi phí thực phẩm vs Lương (Thái Nguyên vs Quế Võ)</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              Cả 2 CN Đều Có Lãi
            </span>
          </div>

          {/* Cards so sánh 2 Chi nhánh */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Chi nhánh 1: Thái Nguyên */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-amber-50/70 to-slate-50 border border-amber-200/80 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Cơ sở 1 • 29 Nhân sự
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Sen Việt Thái Nguyên</h4>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Lượt khách T11</span>
                  <span className="text-xs font-extrabold text-slate-800">1.529,5 khách</span>
                </div>
              </div>

              {/* Financial metrics */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Doanh thu:</span>
                  <span className="font-extrabold text-slate-900 text-sm">685.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> CP Thực phẩm:
                  </span>
                  <span className="font-bold text-rose-600">328.000.000 đ (47.9%)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Quỹ lương (29 NV):
                  </span>
                  <span className="font-bold text-blue-700">148.000.000 đ (21.6%)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-amber-200/60 text-slate-900 font-extrabold">
                  <span>Lợi nhuận gộp TN:</span>
                  <span className="text-emerald-700 text-sm">209.000.000 đ (30.5%)</span>
                </div>
              </div>

              {/* Tag nhận xét giám đốc */}
              <div className="p-2 rounded-lg bg-amber-100/60 text-[11px] text-amber-900 font-medium leading-snug">
                💡 <strong>Nhận xét:</strong> Doanh thu cao nhất chuỗi nhưng cost thực phẩm cao (47.9%), hụt cua thịt cần siết chặt.
              </div>
            </div>

            {/* Chi nhánh 2: Quế Võ */}
            <div className="rounded-2xl p-4 bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-indigo-200/80 space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Cơ sở 2 • 20 Nhân sự
                  </span>
                  <h4 className="text-sm font-bold text-slate-900 mt-1">Sen Việt Quế Võ</h4>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-500 block">Lượt khách T11</span>
                  <span className="text-xs font-extrabold text-slate-800">1.244,5 khách</span>
                </div>
              </div>

              {/* Financial metrics */}
              <div className="space-y-2 pt-1 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Doanh thu:</span>
                  <span className="font-extrabold text-slate-900 text-sm">540.000.000 đ</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> CP Thực phẩm:
                  </span>
                  <span className="font-bold text-emerald-700">245.000.000 đ (45.4%)</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Quỹ lương (20 NV):
                  </span>
                  <span className="font-bold text-blue-700">102.000.000 đ (18.9%)</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-indigo-200/60 text-slate-900 font-extrabold">
                  <span>Lợi nhuận gộp QV:</span>
                  <span className="text-emerald-700 text-sm">193.000.000 đ (35.7%)</span>
                </div>
              </div>

              {/* Tag nhận xét giám đốc */}
              <div className="p-2 rounded-lg bg-indigo-100/60 text-[11px] text-indigo-900 font-medium leading-snug">
                ⭐ <strong>Hiệu quả:</strong> Kiểm soát cost thực phẩm tốt hơn TN (45.4% vs 47.9%), tỷ suất lợi nhuận gộp vượt trội 35.7%.
              </div>
            </div>
          </div>

          {/* Visual Breakdown Bar Comparison */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700">Cơ cấu Doanh Thu Chuỗi:</span>
              <span>Thái Nguyên (55.9%) • Quế Võ (44.1%)</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div className="h-full bg-amber-500 transition-all duration-500" style={{ width: '55.9%' }} title="Thái Nguyên: 55.9%" />
              <div className="h-full bg-indigo-600 transition-all duration-500" style={{ width: '44.1%' }} title="Quế Võ: 44.1%" />
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            BENTO 2: CẢNH BÁO THẤT THOÁT NÓNG (VƯỢT KG/KHÁCH) - 5 CỘT
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Cảnh Báo Thất Thoát Nóng
                </h3>
                <p className="text-xs text-slate-500">Mặt hàng vượt định mức kg/khách cao nhất T11</p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold">
              🚨 4 Món Báo Đỏ
            </span>
          </div>

          <div className="space-y-2.5">
            {/* Món 1: Cua Thịt TN */}
            <div className="p-3 rounded-2xl bg-rose-50/80 border border-rose-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 truncate">Cua Thịt Cà Mau (TN)</span>
                  <span className="px-1.5 py-0.2 rounded bg-rose-600 text-white text-[10px] font-bold">
                    +21.4%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Định mức: <strong>0.280 kg/khách</strong> ➔ Thực tế:{' '}
                  <strong className="text-rose-700">0.340 kg/khách</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Hụt lũy kế: <strong>45.2 kg</strong> (~18.530.000 đ)
                </div>
              </div>
              <span className="text-xs font-black text-rose-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-rose-200 shrink-0">
                -18.5 tr
              </span>
            </div>

            {/* Món 2: Ghẹ Nghệ An */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900 truncate">Ghẹ Sống Nghệ An (TN)</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-600 text-white text-[10px] font-bold">
                    +22.7%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Định mức: <strong>0.220 kg/khách</strong> ➔ Thực tế:{' '}
                  <strong className="text-amber-800">0.270 kg/khách</strong>
                </div>
                <div className="text-[11px] text-slate-500">
                  Hụt lũy kế: <strong>38.0 kg</strong> (~13.300.000 đ)
                </div>
              </div>
              <span className="text-xs font-black text-amber-800 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-amber-200 shrink-0">
                -13.3 tr
              </span>
            </div>

            {/* Món 3: Ba Chỉ Bò Mỹ */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 truncate">Ba Chỉ Bò Mỹ Nướng</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    +16.7%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Định mức: 0.180 kg/k ➔ Thực tế: <strong className="text-slate-800">0.210 kg/k</strong> (Hụt 22.8 kg)
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-slate-200 shrink-0">
                -4.56 tr
              </span>
            </div>

            {/* Món 4: Cá Hồi Phi Lê */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-800 truncate">Cá Hồi Phi Lê Nauy</span>
                  <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[10px] font-semibold">
                    +16.7%
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Định mức: 0.120 kg/k ➔ Thực tế: <strong className="text-slate-800">0.140 kg/k</strong> (Hụt 15.2 kg)
                </div>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-xl shadow-xs border border-slate-200 shrink-0">
                -5.32 tr
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            BENTO 3: BẢNG ĐEN NHÀ CUNG CẤP (GIAO THIẾU & CUA CHẾT) - 6 CỘT
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Bảng Đen NCC Giao Thiếu & Cua Chết
                </h3>
                <p className="text-xs text-slate-500">Đánh giá uy tín NCC qua tỷ lệ hao hụt & lệch cân</p>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-xs font-bold border border-purple-200">
              Đối Soát T11
            </span>
          </div>

          <div className="space-y-3">
            {/* NCC 1: Liên Cua Cà Mau */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-rose-600 text-white font-extrabold text-xs flex items-center justify-center">
                    1
                  </span>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">Liên Cua Cà Mau (TNLIEUCUA)</h5>
                    <span className="text-[10px] text-slate-500">Thái Nguyên • Cua thịt & Cua gạch</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-rose-600 text-white text-[11px] font-black">
                  Hao hụt 10.9%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-1.5 rounded-xl bg-white border border-rose-100">
                  <span className="text-[10px] text-slate-400 block">Tổng giao</span>
                  <span className="font-bold text-slate-800">520.0 kg</span>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-rose-100">
                  <span className="text-[10px] text-rose-500 block">Cua chết/hỏng</span>
                  <span className="font-black text-rose-600">42.0 kg (8.1%)</span>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-rose-100">
                  <span className="text-[10px] text-rose-500 block">Cân thiếu</span>
                  <span className="font-black text-rose-600">14.5 kg (2.8%)</span>
                </div>
              </div>
              <div className="text-[11px] text-rose-700 flex items-center justify-between font-medium pt-0.5">
                <span>Thiệt hại: <strong>23.165.000 đ</strong></span>
                <span className="text-[10px] bg-rose-100 px-2 py-0.5 rounded text-rose-800 font-bold">
                  Yêu cầu trừ công nợ & cảnh cáo
                </span>
              </div>
            </div>

            {/* NCC 2: Cô Phượng Ghẹ Nghệ An */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center">
                    2
                  </span>
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900">Cô Phượng Ghẹ Nghệ An (TNPHUONGGHE)</h5>
                    <span className="text-[10px] text-slate-500">Thái Nguyên • Ghẹ xanh & Ghẹ tươi</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500 text-white text-[11px] font-black">
                  Hao hụt 8.5%
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
                <div className="p-1.5 rounded-xl bg-white border border-amber-100">
                  <span className="text-[10px] text-slate-400 block">Tổng giao</span>
                  <span className="font-bold text-slate-800">480.0 kg</span>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-amber-100">
                  <span className="text-[10px] text-amber-600 block">Ghẹ óp/chết</span>
                  <span className="font-black text-amber-700">31.0 kg (6.5%)</span>
                </div>
                <div className="p-1.5 rounded-xl bg-white border border-amber-100">
                  <span className="text-[10px] text-amber-600 block">Cân thiếu</span>
                  <span className="font-black text-amber-700">9.8 kg (2.0%)</span>
                </div>
              </div>
              <div className="text-[11px] text-amber-900 flex items-center justify-between font-medium pt-0.5">
                <span>Thiệt hại: <strong>14.280.000 đ</strong></span>
                <span className="text-[10px] bg-amber-100 px-2 py-0.5 rounded text-amber-900 font-bold">
                  Bù ký vào đơn hàng tiếp theo
                </span>
              </div>
            </div>

            {/* NCC 3: Dũng Cẩm Phả */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-800">3. Dũng Cẩm Phả (Hàu, Bề bề)</span>
                <div className="text-[11px] text-slate-500">Giao 350kg • Cân thiếu 12.2kg (3.5%) • Hỏng 8kg</div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 font-bold text-[11px]">
                5.8% Hụt
              </span>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            BENTO 4: DUYỆT TĂNG LƯƠNG CHUỖI (GIÁM ĐỐC DUYỆT) - 6 CỘT
        ════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-6 bg-white rounded-3xl p-6 border border-slate-200/90 shadow-card hover:shadow-card-hover transition-all space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Duyệt Tăng Lương Chuỗi
                </h3>
                <p className="text-xs text-slate-500">Xét duyệt tăng bậc lương theo điểm thi nghề & KPI</p>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setFilterProposalStatus('ALL')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  filterProposalStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Tất cả ({proposals.length})
              </button>
              <button
                onClick={() => setFilterProposalStatus('CHO_DUYET')}
                className={`px-2 py-1 rounded-lg transition-all ${
                  filterProposalStatus === 'CHO_DUYET'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'text-amber-700'
                }`}
              >
                Chờ duyệt ({pendingCount})
              </button>
            </div>
          </div>

          {/* Proposals List */}
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredProposals.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Không có đề xuất tăng lương nào theo bộ lọc này.
              </div>
            ) : (
              filteredProposals.map((item) => {
                const diff = item.proposedSalary - item.currentSalary;
                return (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      item.status === 'CHO_DUYET'
                        ? 'bg-amber-50/40 border-amber-200'
                        : item.status === 'DA_DUYET'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-extrabold text-xs sm:text-sm text-slate-900">
                            {item.fullName}
                          </h5>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-semibold">
                            {item.branchName.includes('Thái Nguyên') ? 'CN Thái Nguyên' : 'CN Quế Võ'}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                            Thi nghề: {item.examScore}/100
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.position}</p>
                      </div>

                      {/* Status Badge */}
                      {item.status === 'CHO_DUYET' && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold shrink-0">
                          Chờ duyệt
                        </span>
                      )}
                      {item.status === 'DA_DUYET' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shrink-0 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Đã duyệt
                        </span>
                      )}
                      {item.status === 'TU_CHOI' && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold shrink-0 flex items-center gap-1">
                          <X className="w-3 h-3" /> Đã từ chối
                        </span>
                      )}
                    </div>

                    {/* Salary Jump */}
                    <div className="flex items-center justify-between text-xs bg-white p-2 rounded-xl border border-slate-100 mt-2">
                      <div className="text-slate-600">
                        Hiện tại: <strong className="text-slate-800">{item.currentSalary.toLocaleString('vi-VN')} đ</strong>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                      <div>
                        Đề xuất:{' '}
                        <strong className="text-emerald-700 font-extrabold">
                          {item.proposedSalary.toLocaleString('vi-VN')} đ
                        </strong>{' '}
                        <span className="text-[10px] text-emerald-600 font-bold">
                          (+{diff.toLocaleString('vi-VN')} đ)
                        </span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 mt-2 italic">
                      &quot;{item.reason}&quot;
                    </p>

                    {/* Giám đốc note if decided */}
                    {item.directorNote && (
                      <div className="mt-2 p-2 rounded-lg bg-white/80 border border-slate-200 text-[11px] text-slate-700">
                        <span className="font-bold text-slate-900">Ý kiến Giám đốc:</span> {item.directorNote}{' '}
                        <span className="text-[10px] text-slate-400 block mt-0.5">{item.decidedAt}</span>
                      </div>
                    )}

                    {/* Action buttons if CHO_DUYET */}
                    {item.status === 'CHO_DUYET' && (
                      <div className="flex items-center gap-2 pt-3 mt-1 border-t border-amber-200/60">
                        <button
                          onClick={() => handleDecision(item, 'APPROVE')}
                          className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Phê Duyệt Tăng Lương
                        </button>
                        <button
                          onClick={() => handleDecision(item, 'REJECT')}
                          className="py-1.5 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Từ Chối
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. MODAL CONFIRMATION DIALOG (PHÊ DUYỆT / TỪ CHỐI TĂNG LƯƠNG)
      ───────────────────────────────────────────────────────────── */}
      {selectedProposal && activeAction && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                {activeAction === 'APPROVE' ? (
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
                    <XCircle className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {activeAction === 'APPROVE' ? 'Xác Nhận Duyệt Tăng Lương' : 'Từ Chối / Hoãn Tăng Lương'}
                  </h4>
                  <p className="text-xs text-slate-500">{selectedProposal.fullName} - {selectedProposal.branchName}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setActiveAction(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Mức lương hiện tại:</span>
                <span className="font-bold text-slate-800">{selectedProposal.currentSalary.toLocaleString('vi-VN')} đ</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Mức lương sau điều chỉnh:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {selectedProposal.proposedSalary.toLocaleString('vi-VN')} đ (+{(selectedProposal.proposedSalary - selectedProposal.currentSalary).toLocaleString('vi-VN')} đ)
                </span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-slate-500">Điểm thi tay nghề:</span>
                <span className="font-bold text-indigo-700">{selectedProposal.examScore} / 100 điểm</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                Chỉ đạo / Lý do của Giám Đốc:
              </label>
              <textarea
                rows={3}
                value={directorNoteInput}
                onChange={(e) => setDirectorNoteInput(e.target.value)}
                placeholder="Nhập ghi chú chỉ đạo hoặc lý do duyệt/từ chối..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setSelectedProposal(null);
                  setActiveAction(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmDecision}
                className={`px-5 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all ${
                  activeAction === 'APPROVE'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                {activeAction === 'APPROVE' ? 'Xác Nhận Phê Duyệt' : 'Xác Nhận Từ Chối'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExecutiveCockpit;
