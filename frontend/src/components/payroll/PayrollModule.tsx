import React, { useState, useEffect } from 'react';
import {
  Wallet,
  FileSpreadsheet,
  TrendingUp,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Download,
  RefreshCw,
  X,
  AlertCircle,
  ShieldCheck,
  DollarSign,
  Building,
  CreditCard,
  Check,
  HelpCircle,
  Lock,
  Unlock,
  ShieldAlert,
  Trash2,
  Info
} from 'lucide-react';
import {
  payrollApi,
  SalaryAdvance,
  SalaryIncreaseProposal,
  Payroll,
  PayrollPeriod
} from '../../api/payroll';
import { User, RoleName } from '../../types/auth';

interface PayrollModuleProps {
  currentUser?: User | null;
}

export const PayrollModule: React.FC<PayrollModuleProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'advance' | 'raise' | 'payslip'>('payroll');
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-11');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Data states
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [myAdvances, setMyAdvances] = useState<SalaryAdvance[]>([]);
  const [proposals, setProposals] = useState<SalaryIncreaseProposal[]>([]);
  const [myPayrolls, setMyPayrolls] = useState<Payroll[]>([]);

  // Advance form state
  const [advanceAmount, setAdvanceAmount] = useState<number>(1500000);
  const [advanceReason, setAdvanceReason] = useState<string>('');

  // Disburse modal state
  const [disbursingAdvance, setDisbursingAdvance] = useState<SalaryAdvance | null>(null);
  const [disbursedAmountInput, setDisbursedAmountInput] = useState<number>(0);
  const [deductionMonthInput, setDeductionMonthInput] = useState<string>('2026-11');
  const [disburseNoteInput, setDisburseNoteInput] = useState<string>('');

  // Payroll lock states (Phase 10)
  const [periodLock, setPeriodLock] = useState<PayrollPeriod | null>(null);
  const [showLockModal, setShowLockModal] = useState<boolean>(false);
  const [showUnlockModal, setShowUnlockModal] = useState<boolean>(false);
  const [unlockReasonInput, setUnlockReasonInput] = useState<string>('');

  const isManagerOrAccountant = currentUser?.roles.some((r: RoleName) =>
    ['ROLE_RESTAURANT_MANAGER', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_GENERAL_ACCOUNTANT'].includes(r)
  );

  const isGeneralAccountant = currentUser?.roles.some((r: RoleName) =>
    ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_ADMIN', 'ROLE_CHU_CHUOI'].includes(r)
  );

  const isPeriodLocked = periodLock?.status === 'LOCKED' || payrolls.some(p => p.isLocked);

  useEffect(() => {
    loadPayrollData();
    loadAdvanceData();
    loadProposalData();
  }, [selectedMonth, activeTab]);

  const loadPayrollData = async () => {
    try {
      if (isManagerOrAccountant) {
        const [list, periodStatus] = await Promise.all([
          payrollApi.getPayroll(selectedMonth, currentUser?.branchId || undefined),
          payrollApi.getPeriodStatus(selectedMonth, currentUser?.branchId || undefined)
        ]);
        setPayrolls(list);
        setPeriodLock(periodStatus);
      }
      const myList = await payrollApi.getMyPayrolls();
      setMyPayrolls(myList);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadAdvanceData = async () => {
    try {
      if (isManagerOrAccountant) {
        const list = await payrollApi.getAdvances(currentUser?.branchId || undefined);
        setAdvances(list);
      }
      const myList = await payrollApi.getMyAdvances();
      setMyAdvances(myList);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadProposalData = async () => {
    try {
      if (isManagerOrAccountant) {
        const list = await payrollApi.getIncreaseProposals(currentUser?.branchId || undefined);
        setProposals(list);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  // Lock / Unlock Period Handlers (Phase 10)
  const handleConfirmLock = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.lockPeriod(selectedMonth, currentUser?.branchId || undefined);
      setPeriodLock(res);
      setMessage({
        text: `🔒 Đã chốt & khóa bảng lương tháng ${selectedMonth}. Toàn bộ đơn ứng lương và chi phí tháng này đã được niêm phong!`,
        type: 'success'
      });
      setShowLockModal(false);
      await loadPayrollData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi khóa bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUnlock = async () => {
    if (!unlockReasonInput.trim()) {
      setMessage({ text: 'Vui lòng nhập lý do mở khóa bảng lương (Bắt buộc theo quy chế kiểm toán)!', type: 'error' });
      return;
    }
    try {
      setLoading(true);
      const res = await payrollApi.unlockPeriod(selectedMonth, unlockReasonInput.trim(), currentUser?.branchId || undefined);
      setPeriodLock(res);
      setMessage({
        text: `🔓 Đã mở khóa bảng lương tháng ${selectedMonth}. Kế toán có thể cập nhật và điều chỉnh.`,
        type: 'success'
      });
      setShowUnlockModal(false);
      setUnlockReasonInput('');
      await loadPayrollData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi mở khóa bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAdvance = async (advance: SalaryAdvance) => {
    if (isPeriodLocked) {
      setMessage({
        text: `Kỳ lương ${advance.deductionMonth || selectedMonth} đã được chốt và khóa. Không được phép hủy đơn ứng lương!`,
        type: 'error'
      });
      return;
    }
    if (!window.confirm(`Xác nhận hủy đơn ứng lương #${advance.id} của nhân viên [${advance.fullName}]?`)) {
      return;
    }
    try {
      setLoading(true);
      await payrollApi.cancelAdvance(advance.id);
      setMessage({ text: `Đã hủy thành công đơn ứng lương #${advance.id}!`, type: 'success' });
      await loadAdvanceData();
      await handleGeneratePayroll();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi hủy đơn ứng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Generate / Recalculate Payroll
  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      const list = await payrollApi.generatePayroll(selectedMonth, currentUser?.branchId || undefined);
      setPayrolls(list);
      setMessage({
        text: `Đã tổng hợp tự động bảng lương tháng ${selectedMonth} cho ${list.length} nhân sự!`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi tổng hợp bảng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Export Bank Transfer Excel
  const handleExportBankExcel = async () => {
    try {
      setLoading(true);
      const blob = await payrollApi.exportBankExcel(selectedMonth, currentUser?.branchId || undefined);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Lenh_Chi_Ngan_Hang_${selectedMonth}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      setMessage({
        text: `Xuất file lệnh chi chuyển khoản tháng ${selectedMonth} thành công (Đã loại trừ bỏ việc & giữ lương)`,
        type: 'success'
      });
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi xuất file Excel chuyển khoản', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Submit Advance Request
  const handleSubmitAdvance = async () => {
    try {
      setLoading(true);
      const res = await payrollApi.requestAdvance({
        requestedAmount: advanceAmount,
        reason: advanceReason || 'Chi tiêu cá nhân đầu tháng'
      });
      setMessage({
        text: `Đã gửi đơn xin ứng ${res.requestedAmount.toLocaleString('vi-VN')} đ (Mã #${res.id}). Chờ Kế toán duyệt chi.`,
        type: 'success'
      });
      setAdvanceReason('');
      await loadAdvanceData();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi gửi đơn ứng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Disburse Advance
  const openDisburseModal = (advance: SalaryAdvance) => {
    setDisbursingAdvance(advance);
    setDisbursedAmountInput(advance.requestedAmount);
    setDeductionMonthInput(selectedMonth);
    setDisburseNoteInput(`Đã duyệt chi ${advance.requestedAmount.toLocaleString('vi-VN')} đ`);
  };

  const handleConfirmDisburse = async () => {
    if (!disbursingAdvance) return;
    try {
      setLoading(true);
      const res = await payrollApi.disburseAdvance(disbursingAdvance.id, {
        disbursedAmount: disbursedAmountInput,
        deductionMonth: deductionMonthInput,
        managerNote: disburseNoteInput
      });
      setMessage({
        text: `Đã duyệt chi ${res.disbursedAmount.toLocaleString('vi-VN')} đ cho ${res.fullName}. Tự động trừ vào lương tháng ${res.deductionMonth}.`,
        type: 'success'
      });
      setDisbursingAdvance(null);
      await loadAdvanceData();
      await handleGeneratePayroll(); // Update payroll numbers
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi khi duyệt chi', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Scan Quarterly Increase Eligibility
  const handleScanIncreases = async () => {
    try {
      setLoading(true);
      const list = await payrollApi.scanIncreases('Q4-2026', currentUser?.branchId || undefined);
      setProposals(list);
      const eligibleCount = list.filter(p => p.isEligible).length;
      setMessage({
        text: `Quét tăng lương Q4-2026 hoàn tất: ${eligibleCount}/${list.length} nhân viên đủ 3 điều kiện đạt chuẩn.`,
        type: eligibleCount > 0 ? 'success' : 'warning'
      });
    } catch (err: any) {
      setMessage({ text: 'Lỗi khi quét tăng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Approve Increase
  const handleApproveIncrease = async (proposal: SalaryIncreaseProposal) => {
    try {
      setLoading(true);
      const res = await payrollApi.approveIncrease(proposal.id);
      setMessage({
        text: `Đã duyệt tăng lương +${res.raiseAmount.toLocaleString('vi-VN')} đ cho ${res.fullName}! Lương cơ bản đã được cộng trực tiếp.`,
        type: 'success'
      });
      await loadProposalData();
      await handleGeneratePayroll();
    } catch (err: any) {
      setMessage({ text: err.response?.data?.message || 'Lỗi duyệt tăng lương', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // KPI Calculations
  const totalNetSalary = payrolls.reduce((sum, p) => {
    if (p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost) {
      return sum;
    }
    return sum + (p.netSalary || 0);
  }, 0);
  const totalAdvances = payrolls.reduce((sum, p) => sum + (p.advanceDeduction || 0), 0);
  const blockedCount = payrolls.filter(p => p.status === 'BO_VIEC' || p.status === 'DANG_GIU_LUONG').length;

  // Tổng lương không trả do bỏ việc (đã tách khỏi chi phí P&L)
  const totalUnpaidAbandonedSalary = payrolls
    .filter(p => p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost)
    .reduce((sum, p) => {
      const standardDays = p.standardWorkDays || 26;
      const basePlusRaise = (p.baseSalary || 0) + (p.salaryRaise || 0);
      const nominalSalary = standardDays > 0 ? (basePlusRaise * (p.actualWorkDays || 0)) / standardDays : 0;
      return sum + Math.round(nominalSalary);
    }, 0);

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Title & Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-7 h-7 text-emerald-600" />
              Phân Hệ Quản Trị Tiền Lương & Ứng Lương Tự Động
            </h1>
            {isPeriodLocked && (
              <span className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black rounded-lg flex items-center gap-1 shadow-sm">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                [ĐÃ KHÓA]
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Tự động khấu trừ tạm ứng, tăng lương thi sát hạch quý, khóa lương bỏ việc và xuất lệnh chi ngân hàng.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm text-sm">
            <span className="text-xs text-slate-500 font-semibold">Tháng:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="border-none bg-transparent font-bold text-slate-800 focus:outline-none"
            />
          </div>

          {isManagerOrAccountant && (
            <>
              <button
                onClick={handleGeneratePayroll}
                disabled={loading}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Tổng Hợp Lương
              </button>

              <button
                onClick={handleExportBankExcel}
                disabled={loading}
                className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
              >
                <Download className="w-3.5 h-3.5" /> Xuất File Ngân Hàng
              </button>
            </>
          )}

          {isGeneralAccountant && (
            <>
              {!isPeriodLocked ? (
                <button
                  onClick={() => setShowLockModal(true)}
                  disabled={loading}
                  title="Chốt và khóa bảng lương kỳ này, niêm phong toàn bộ sửa/hủy đơn ứng lương"
                  className="py-2 px-3.5 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Lock className="w-3.5 h-3.5" /> Chốt & Khóa Lương
                </button>
              ) : (
                <button
                  onClick={() => setShowUnlockModal(true)}
                  disabled={loading}
                  title="Mở khóa kỳ lương để điều chỉnh (Bắt buộc nhập lý do kiểm toán)"
                  className="py-2 px-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                >
                  <Unlock className="w-3.5 h-3.5" /> Mở Khóa Lương
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Prominent Period Locked Banner */}
      {isPeriodLocked && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-950 shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm uppercase tracking-wide text-amber-900">
                  KỲ BẢNG LƯƠNG THÁNG {selectedMonth} ĐÃ ĐƯỢC CHỐT VÀ KHÓA
                </span>
                <span className="px-2 py-0.5 bg-amber-200 text-amber-900 text-[10px] font-black rounded-full uppercase">
                  Niêm Phong Kiểm Toán
                </span>
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {periodLock?.lockedAt
                  ? `Đã khóa lúc ${new Date(periodLock.lockedAt).toLocaleString('vi-VN')} bởi ${periodLock.lockedByUsername || 'Kế toán tổng'}. Toàn bộ thao tác sửa/hủy đơn ứng lương tháng này đã bị niêm phong.`
                  : 'Toàn bộ thao tác sửa/hủy đơn ứng lương tháng này đã bị vô hiệu hóa theo quy chế kiểm toán.'}
              </div>
            </div>
          </div>
          {isGeneralAccountant && (
            <button
              onClick={() => setShowUnlockModal(true)}
              className="px-4 py-2 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 shrink-0 self-start sm:self-auto transition-colors"
            >
              <Unlock className="w-3.5 h-3.5 text-amber-700" />
              Mở Khóa Bảng Lương
            </button>
          )}
        </div>
      )}

      {/* Global Alert Message */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-sm transition-all ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : message.type === 'warning'
              ? 'bg-amber-50 text-amber-900 border border-amber-300'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {message.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            {message.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
            {message.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span className="font-medium text-sm">{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      {isManagerOrAccountant && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Quỹ Lương Thực Chi</div>
              <div className="text-lg font-bold text-emerald-700">
                {totalNetSalary.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Số Lượng Nhân Sự</div>
              <div className="text-lg font-bold text-slate-900">{payrolls.length} người</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Tạm Ứng Đã Khấu Trừ</div>
              <div className="text-lg font-bold text-amber-700">
                {totalAdvances.toLocaleString('vi-VN')} đ
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Khóa / Giữ Lương</div>
              <div className="text-lg font-bold text-rose-700">{blockedCount} nhân sự</div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 font-semibold uppercase">Lương Bỏ Việc Không Trả</div>
              <div className="text-lg font-bold text-purple-700">
                {totalUnpaidAbandonedSalary.toLocaleString('vi-VN')} đ
              </div>
              <div className="text-[10px] text-slate-400">Tách khỏi chi phí lãi lỗ</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        {isManagerOrAccountant && (
          <button
            onClick={() => setActiveTab('payroll')}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'payroll'
                ? 'border-emerald-600 text-emerald-600 bg-emerald-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bảng Lương Tháng {selectedMonth}
          </button>
        )}

        <button
          onClick={() => setActiveTab('advance')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'advance'
              ? 'border-amber-600 text-amber-600 bg-amber-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Ứng Lương & Duyệt Chi
        </button>

        {isManagerOrAccountant && (
          <button
            onClick={() => setActiveTab('raise')}
            className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
              activeTab === 'raise'
                ? 'border-blue-600 text-blue-600 bg-blue-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Xét Tăng Lương Quý
          </button>
        )}

        <button
          onClick={() => setActiveTab('payslip')}
          className={`flex items-center gap-2 py-3 px-5 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'payslip'
              ? 'border-purple-600 text-purple-600 bg-purple-50/50 rounded-t-lg'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Phiếu Lương Cá Nhân
        </button>
      </div>

      {/* TAB 1: MASTER PAYROLL TABLE */}
      {activeTab === 'payroll' && isManagerOrAccountant && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Chi Tiết Bảng Lương Tháng {selectedMonth}
            </h2>
            <div className="text-xs text-slate-500">
              Công thức: Thực lĩnh = (Lương CB + Tăng) × (Công / 26) + Phụ cấp - Tạm ứng - Phạt
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Nhân viên</th>
                  <th className="py-2.5 px-3">Ngân hàng & STK</th>
                  <th className="py-2.5 px-3 text-right">Lương CB</th>
                  <th className="py-2.5 px-3 text-center">Ngày công</th>
                  <th className="py-2.5 px-3 text-right">Tăng lương</th>
                  <th className="py-2.5 px-3 text-right">Phụ cấp</th>
                  <th className="py-2.5 px-3 text-right">Trừ Tạm ứng</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900">Thực lĩnh</th>
                  <th className="py-2.5 px-3">Trạng thái / Ghi chú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Chưa có dữ liệu bảng lương tháng này. Nhấn nút "Tổng Hợp Lương" ở góc trên để tạo.
                    </td>
                  </tr>
                ) : (
                  payrolls.map(p => (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50 transition-colors ${
                        p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                          ? 'bg-slate-100/90 text-slate-500'
                          : p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                          ? 'bg-rose-50/50'
                          : ''
                      }`}
                    >
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.fullName}
                        <div className="text-[11px] text-slate-400 font-normal">@{p.username}</div>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="text-slate-900 font-semibold">{p.bankName || 'Vietcombank'}</div>
                        <div className="text-slate-500">{p.bankAccountNumber || '—'}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium">
                        {p.baseSalary.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3 text-center font-bold">
                        {p.actualWorkDays} / {p.standardWorkDays}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-600 font-semibold">
                        {p.salaryRaise > 0 ? `+${p.salaryRaise.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600">
                        {p.allowance.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3 text-right text-amber-600 font-semibold">
                        {p.advanceDeduction > 0 ? `-${p.advanceDeduction.toLocaleString('vi-VN')} đ` : '0 đ'}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-sm text-slate-900">
                        {p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost ? (
                          <div className="flex flex-col items-end">
                            <span className="text-slate-400 line-through">0 đ</span>
                            <span className="text-[10px] text-slate-400 font-normal">Tách khỏi chi phí</span>
                          </div>
                        ) : (
                          <span
                            className={
                              p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                                ? 'text-rose-600'
                                : 'text-emerald-700'
                            }
                          >
                            {p.netSalary.toLocaleString('vi-VN')} đ
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-1 items-start">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                                ? 'bg-slate-200 text-slate-800'
                                : p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                                ? 'bg-rose-100 text-rose-800 animate-pulse'
                                : p.isLocked
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                              ? 'BỎ VIỆC (LƯƠNG = 0)'
                              : p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                              ? 'ĐANG GIỮ LƯƠNG'
                              : p.isLocked
                              ? 'ĐÃ KHÓA'
                              : 'Đã duyệt'}
                          </span>
                          {(p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost) && (
                            <span className="text-[10px] text-rose-600 font-semibold italic">
                              Bỏ việc — không trả theo quy định
                            </span>
                          )}
                          {p.holdReason && (p.status === 'DANG_GIU_LUONG' || p.isUniformRetained) && (
                            <span className="text-[10px] text-rose-700 font-semibold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                              {p.holdReason}
                            </span>
                          )}
                          {p.note && p.status !== 'BO_VIEC' && !p.isAbandoned && (
                            <span className="text-[10px] text-slate-500 italic">{p.note}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: SALARY ADVANCES */}
      {activeTab === 'advance' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Employee Request Form */}
          <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              Nộp Đơn Xin Ứng Lương
            </h2>
            <p className="text-xs text-slate-500">
              Quy chế: Mỗi nhân viên được ứng tối đa 50% lương cơ bản trong tháng. Số tiền được Kế toán duyệt chi sẽ tự động trừ vào bảng lương đợt gần nhất.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Số Tiền Xin Ứng (VNĐ):
                </label>
                <input
                  type="number"
                  step={500000}
                  min={500000}
                  max={10000000}
                  value={advanceAmount}
                  onChange={e => setAdvanceAmount(Number(e.target.value))}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lý Do Xin Ứng Lương:
                </label>
                <textarea
                  rows={3}
                  placeholder="Ví dụ: Đóng tiền trọ đầu tháng, gia đình có việc phát sinh..."
                  value={advanceReason}
                  onChange={e => setAdvanceReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
                />
              </div>

              <button
                onClick={handleSubmitAdvance}
                disabled={loading}
                className="w-full min-h-[48px] py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Gửi Đơn Xin Ứng Lương
              </button>
            </div>

            {/* My Advance History */}
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h3 className="text-xs font-bold uppercase text-slate-500">Lịch Sử Xin Ứng Của Tôi</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {myAdvances.length === 0 ? (
                  <p className="text-xs text-slate-400 py-2">Bạn chưa gửi đơn ứng lương nào.</p>
                ) : (
                  myAdvances.map(a => (
                    <div key={a.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <div className="font-bold text-slate-900">{a.requestedAmount.toLocaleString('vi-VN')} đ</div>
                        <div className="text-[11px] text-slate-500">{a.requestDate} • {a.reason}</div>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        a.status === 'DA_CHI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {a.status === 'DA_CHI' ? 'Đã chi' : 'Chờ duyệt'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Manager / Accountant Approval List */}
          <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                Duyệt Chi Ứng Lương Chi Nhánh
              </h2>
              <button onClick={loadAdvanceData} className="text-xs text-blue-600 hover:underline">
                Làm mới
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                    <th className="py-2 px-3">Nhân viên</th>
                    <th className="py-2 px-3">Ngày xin</th>
                    <th className="py-2 px-3 text-right">Xin ứng</th>
                    <th className="py-2 px-3 text-right">Thực chi</th>
                    <th className="py-2 px-3">Trừ lương</th>
                    <th className="py-2 px-3">Trạng thái</th>
                    <th className="py-2 px-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {advances.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        Không có đơn ứng lương nào.
                      </td>
                    </tr>
                  ) : (
                    advances.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {a.fullName}
                          <div className="text-[10px] text-slate-400">@{a.username}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{a.requestDate}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {a.requestedAmount.toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                          {a.disbursedAmount > 0 ? `${a.disbursedAmount.toLocaleString('vi-VN')} đ` : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 font-mono">
                          {a.deductionMonth || 'Chưa định'}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              a.status === 'DA_CHI' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {a.status === 'DA_CHI' ? 'Đã chi trả' : 'Chờ duyệt'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {isManagerOrAccountant && (
                            <div className="flex justify-end gap-1.5 items-center">
                              {a.status !== 'DA_CHI' && (
                                <button
                                  onClick={() => openDisburseModal(a)}
                                  disabled={isPeriodLocked}
                                  title={isPeriodLocked ? `Kỳ lương ${selectedMonth} đã khóa - Không thể duyệt chi` : 'Duyệt chi ứng lương'}
                                  className={`py-1 px-3 rounded-lg text-xs font-semibold shadow transition-all ${
                                    isPeriodLocked
                                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                >
                                  {isPeriodLocked ? 'Đã Khóa' : 'Duyệt Chi'}
                                </button>
                              )}
                              <button
                                onClick={() => handleCancelAdvance(a)}
                                disabled={isPeriodLocked}
                                title={isPeriodLocked ? `Kỳ lương ${a.deductionMonth || selectedMonth} đã khóa - Không thể hủy đơn` : 'Hủy đơn ứng lương'}
                                className={`p-1 rounded-lg text-xs border transition-all ${
                                  isPeriodLocked
                                    ? 'border-slate-200 text-slate-300 cursor-not-allowed'
                                    : 'border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300'
                                }`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SALARY RAISE EVALUATION */}
      {activeTab === 'raise' && isManagerOrAccountant && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Xét Tăng Lương Định Kỳ (Quý 4/2026)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Thuật toán tự động quét 3 tiêu chuẩn: Điểm thi ≥ 80 đ + Đi muộn ≤ 3 lần + Nghỉ không phép = 0.
              </p>
            </div>
            <button
              onClick={handleScanIncreases}
              disabled={loading}
              className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Quét Điều Kiện Tăng Lương
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">Nhân viên</th>
                  <th className="py-2.5 px-3 text-center">Kỳ thi</th>
                  <th className="py-2.5 px-3 text-center">Điểm thi quý</th>
                  <th className="py-2.5 px-3 text-center">Đi muộn (90 ngày)</th>
                  <th className="py-2.5 px-3">Đánh giá điều kiện</th>
                  <th className="py-2.5 px-3 text-right">Mức tăng</th>
                  <th className="py-2.5 px-3 text-center">Trạng thái</th>
                  <th className="py-2.5 px-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-6 text-center text-slate-400">
                      Chưa có dữ liệu đề xuất tăng lương. Nhấn "Quét Điều Kiện Tăng Lương" để chạy thuật toán.
                    </td>
                  </tr>
                ) : (
                  proposals.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 font-semibold text-slate-900">
                        {p.fullName}
                        <div className="text-[10px] text-slate-400">@{p.username}</div>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">{p.examQuarter}</td>
                      <td className="py-3 px-3 text-center font-bold">
                        <span className={p.examScore >= 80 ? 'text-emerald-600' : 'text-slate-500'}>
                          {p.examScore} / 100
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={p.lateCount <= 3 ? 'text-emerald-600' : 'text-rose-600 font-bold'}>
                          {p.lateCount} lần
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            p.isEligible ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {p.isEligible ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                          {p.isEligible ? 'ĐỦ ĐIỀU KIỆN' : 'CHƯA ĐỦ ĐIỀU KIỆN'}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">{p.evaluationDetails}</div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-700">
                        +{p.raiseAmount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.status === 'DA_DUYET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'DA_DUYET' ? 'Đã duyệt tăng' : 'Chờ duyệt'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {p.isEligible && p.status !== 'DA_DUYET' && (
                          <button
                            onClick={() => handleApproveIncrease(p)}
                            className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow"
                          >
                            Duyệt Tăng
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PERSONAL PAYSLIP */}
      {activeTab === 'payslip' && (
        <div className="max-w-2xl mx-auto space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-600" />
                Phiếu Lương Cá Nhân ({selectedMonth})
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Chi nhánh: {currentUser?.branchName || 'Sen Việt Buffet'}
              </span>
            </div>

            {myPayrolls.length === 0 ? (
              <p className="text-sm text-slate-400 py-6 text-center">
                Chưa có dữ liệu phiếu lương cho tài khoản của bạn trong tháng này.
              </p>
            ) : (
              myPayrolls.map(p => (
                <div key={p.id} className="space-y-4">
                  {/* Status Banner */}
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                        ? 'bg-slate-100 border-slate-300 text-slate-700'
                        : p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                        ? 'bg-rose-50 border-rose-300 text-rose-800'
                        : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5" />
                      <div>
                        <div className="text-xs font-bold uppercase">Trạng Thái Thanh Toán</div>
                        <div className="text-sm font-semibold">
                          {p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                            ? 'Bỏ việc — Lương = 0 đ (Không trả theo quy định)'
                            : p.status === 'DANG_GIU_LUONG' || p.isUniformRetained
                            ? `ĐANG GIỮ LƯƠNG: ${p.holdReason || 'Chưa bàn giao đủ đồng phục'}`
                            : 'Đã sẵn sàng chi trả qua ngân hàng'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Detail Rows */}
                  <div className="divide-y divide-slate-100 text-sm">
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Lương cơ bản:</span>
                      <strong className="text-slate-900">{p.baseSalary.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Tăng lương thi đạt chuẩn:</span>
                      <strong className="text-emerald-600">+{p.salaryRaise.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Ngày công thực tế:</span>
                      <strong className="text-slate-900">{p.actualWorkDays} / {p.standardWorkDays} ngày</strong>
                    </div>
                    <div className="py-2.5 flex justify-between">
                      <span className="text-slate-500">Phụ cấp ăn ca:</span>
                      <strong className="text-slate-900">{p.allowance.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="py-2.5 flex justify-between bg-amber-50/50 px-2 rounded">
                      <span className="text-amber-900">Khấu trừ tạm ứng:</span>
                      <strong className="text-amber-700">-{p.advanceDeduction.toLocaleString('vi-VN')} đ</strong>
                    </div>
                    <div className="py-3 flex justify-between text-base font-bold bg-slate-50 px-2 rounded mt-2">
                      <span className="text-slate-900">THỰC LĨNH CHUYỂN KHOẢN:</span>
                      <span className="text-emerald-700 text-lg">
                        {p.status === 'BO_VIEC' || p.isAbandoned || p.excludedFromCost
                          ? '0 đ (Bỏ việc)'
                          : `${p.netSalary.toLocaleString('vi-VN')} đ`}
                      </span>
                    </div>
                  </div>

                  {/* Bank Account Details */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                    <div className="text-slate-500 font-semibold uppercase">Tài Khoản Nhận Lương:</div>
                    <div className="font-bold text-slate-800">
                      {p.bankName || 'Vietcombank'} — {p.bankAccountNumber || 'Chưa cập nhật STK'}
                    </div>
                    <div className="text-slate-600">Chủ TK: {p.bankAccountHolder || p.fullName}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL: Disburse Advance */}
      {disbursingAdvance && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              Duyệt Chi Ứng Lương: {disbursingAdvance.fullName}
            </h3>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-950">
              <div>Số tiền xin ứng: <strong>{disbursingAdvance.requestedAmount.toLocaleString('vi-VN')} đ</strong></div>
              <div>Lý do: "{disbursingAdvance.reason}"</div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Số Tiền Thực Chi (VNĐ):
              </label>
              <input
                type="number"
                min={0}
                max={disbursingAdvance.requestedAmount}
                value={disbursedAmountInput}
                onChange={e => setDisbursedAmountInput(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tháng Khấu Trừ Bảng Lương (YYYY-MM):
              </label>
              <input
                type="month"
                value={deductionMonthInput}
                onChange={e => setDeductionMonthInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Ghi Chú Duyệt Chi:</label>
              <input
                type="text"
                value={disburseNoteInput}
                onChange={e => setDisburseNoteInput(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDisbursingAdvance(null)}
                className="py-2 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmDisburse}
                disabled={loading}
                className="py-2.5 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow"
              >
                Xác Nhận Duyệt Chi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Lock Payroll Period (Phase 10) */}
      {showLockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Chốt & Khóa Bảng Lương Tháng {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Hành động dành riêng cho Kế Toán Tổng / Ban Lãnh Đạo
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-xs text-rose-900 space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                Quy chế niêm phong tài chính:
              </div>
              <p>
                Sau khi khóa, kỳ bảng lương tháng <strong>{selectedMonth}</strong> sẽ được niêm phong cho công tác kế toán & kiểm toán.
              </p>
              <p className="font-semibold text-rose-950">
                Toàn bộ thao tác chỉnh sửa hoặc hủy đơn ứng lương của tháng này sẽ bị hệ thống từ chối (HTTP 400).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowLockModal(false)}
                className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmLock}
                disabled={loading}
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                Xác Nhận Khóa Bảng Lương
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Unlock Payroll Period (Phase 10) */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-inner">
              <Unlock className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                Mở Khóa Bảng Lương Tháng {selectedMonth}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Hành động dành riêng cho Kế Toán Tổng / Ban Lãnh Đạo
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0" />
                Quy chế kiểm toán & audit trail:
              </div>
              <p>
                Bắt buộc nhập lý do mở khóa. Thao tác này sẽ được ghi lại trong nhật ký hệ thống để phục vụ đối soát.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Lý Do Mở Khóa (Bắt buộc):
              </label>
              <textarea
                rows={3}
                value={unlockReasonInput}
                onChange={e => setUnlockReasonInput(e.target.value)}
                placeholder="Ví dụ: Bổ sung ngày công và điều chỉnh tạm ứng cho nhân viên bếp theo đơn khiếu nại..."
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowUnlockModal(false);
                  setUnlockReasonInput('');
                }}
                className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-sm font-semibold rounded-xl"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={loading || !unlockReasonInput.trim()}
                className="py-2.5 px-5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                Xác Nhận Mở Khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PayrollModule;
