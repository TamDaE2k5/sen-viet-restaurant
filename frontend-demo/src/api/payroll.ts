import * as XLSX from 'xlsx';
import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface SalaryAdvance {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId?: number;
  branchName?: string;
  requestDate: string;
  requestedAmount: number;
  reason: string;
  disbursedAmount: number;
  deductionMonth?: string;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DA_CHI', 'TU_CHOI'
  approvedByName?: string;
  approvedAt?: string;
  managerNote?: string;
}

export interface SalaryAdvanceRequest {
  requestedAmount: number;
  reason: string;
}

export interface DisburseAdvanceRequest {
  disbursedAmount: number;
  deductionMonth: string;
  managerNote?: string;
}

export interface UpdateAdvanceRequest {
  requestedAmount?: number;
  disbursedAmount?: number;
  reason?: string;
  deductionMonth?: string;
  managerNote?: string;
}

export interface PayrollPeriod {
  id?: number;
  periodMonth: string;
  branchId?: number;
  branchName?: string;
  status: 'OPEN' | 'LOCKED';
  lockedAt?: string;
  lockedByUsername?: string;
  unlockReason?: string;
}

export interface Payroll {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  position?: string;
  branchId?: number;
  branchName?: string;
  payrollMonth: string;
  baseSalary: number;
  standardWorkDays: number;
  actualWorkDays: number;
  salaryRaise: number;
  allowance: number;
  grossSalary: number;
  advanceDeduction: number;
  penaltyDeduction: number;
  netSalary: number;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'BO_VIEC', 'DA_THANH_TOAN', 'LOCKED'
  isAbandoned: boolean;
  isUniformRetained: boolean;
  excludedFromCost?: boolean;
  holdReason?: string;
  isLocked?: boolean;
  lockedAt?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  note?: string;
}

export interface PayrollSummary {
  periodMonth: string;
  branchId?: number;
  branchName?: string;
  periodStatus: 'OPEN' | 'LOCKED';
  totalBranchCost: number;
  totalUnpaidAbandonedSalary: number;
  totalEmployees: number;
  abandonedCount: number;
  uniformRetainedCount: number;
  payrolls: Payroll[];
}

export interface SalaryIncreaseProposal {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId?: number;
  branchName?: string;
  examQuarter: string;
  examScore: number;
  lateCount: number;
  unexcusedAbsenceCount: number;
  isEligible: boolean;
  raiseAmount: number;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'TU_CHOI'
  evaluationDetails?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
}

export const payrollApi = {
  // 1. Quản lý Ứng lương
  requestAdvance: async (data: SalaryAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const user = (await db.users.get(savedUserId)) || (await db.users.get(1));
    const now = new Date();

    const newAdvance: SalaryAdvance = {
      id: Date.now(),
      userId: user?.id || 1,
      fullName: user?.fullName || 'Nguyễn Văn Bếp',
      username: user?.username || 'bep_tn',
      branchId: user?.branchId || 1,
      branchName: user?.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      requestDate: now.toISOString().slice(0, 10),
      requestedAmount: data.requestedAmount,
      reason: data.reason,
      disbursedAmount: 0,
      deductionMonth: now.toISOString().slice(0, 7),
      status: 'CHO_DUYET',
    };

    await db.salaryAdvances.add(newAdvance);
    return newAdvance;
  },

  getMyAdvances: async (): Promise<SalaryAdvance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await db.salaryAdvances.toArray();
    return list.filter((a) => a.userId === savedUserId).reverse();
  },

  getBranchAdvances: async (branchId?: number): Promise<SalaryAdvance[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.salaryAdvances.toArray();
    if (branchId) {
      list = list.filter((a) => a.branchId === branchId);
    }
    return list.reverse();
  },

  getAdvances: async (branchId?: number): Promise<SalaryAdvance[]> => {
    return payrollApi.getBranchAdvances(branchId);
  },

  disburseAdvance: async (id: number, data: DisburseAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const existing = await db.salaryAdvances.get(id);
    if (!existing) throw new Error('Không tìm thấy đơn ứng lương');

    const updated: SalaryAdvance = {
      ...existing,
      disbursedAmount: data.disbursedAmount,
      deductionMonth: data.deductionMonth,
      managerNote: data.managerNote,
      status: 'DA_CHI',
      approvedByName: 'Lê Hoàng Quản Lý',
      approvedAt: new Date().toISOString().slice(0, 10),
    };

    await db.salaryAdvances.put(updated);
    return updated;
  },

  updateAdvance: async (id: number, data: UpdateAdvanceRequest): Promise<SalaryAdvance> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const existing = await db.salaryAdvances.get(id);
    if (!existing) throw new Error('Không tìm thấy đơn ứng lương');

    const updated: SalaryAdvance = {
      ...existing,
      ...data,
    };

    await db.salaryAdvances.put(updated);
    return updated;
  },

  cancelAdvance: async (id: number): Promise<void> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const existing = await db.salaryAdvances.get(id);
    if (existing) {
      await db.salaryAdvances.put({ ...existing, status: 'TU_CHOI' });
    }
  },

  // 1.1 Khóa / Mở Khóa Bảng Lương (Payroll Period Lock)
  lockPeriod: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const list = await db.payrollPeriods.toArray();
    const existing = list.find((p) => p.periodMonth === periodMonth);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const updated: PayrollPeriod = {
      id: existing ? existing.id : Date.now(),
      periodMonth,
      branchId: branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      status: 'LOCKED',
      lockedAt: now,
      lockedByUsername: 'ketoan_tong',
    };

    if (existing) {
      await db.payrollPeriods.put(updated);
    } else {
      await db.payrollPeriods.add(updated);
    }

    return updated;
  },

  unlockPeriod: async (periodMonth: string, reason: string, branchId?: number): Promise<PayrollPeriod> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    const list = await db.payrollPeriods.toArray();
    const existing = list.find((p) => p.periodMonth === periodMonth);

    const updated: PayrollPeriod = {
      id: existing ? existing.id : Date.now(),
      periodMonth,
      branchId: branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      status: 'OPEN',
      unlockReason: reason,
    };

    if (existing) {
      await db.payrollPeriods.put(updated);
    } else {
      await db.payrollPeriods.add(updated);
    }

    return updated;
  },

  getPeriodStatus: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod | null> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const list = await db.payrollPeriods.toArray();
    const match = list.find((p) => p.periodMonth === periodMonth && (!branchId || p.branchId === branchId));
    return match || null;
  },

  getPayrollSummary: async (month?: string, branchId?: number): Promise<PayrollSummary | null> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const periodMonth = month || '2026-10';
    const payrolls = await payrollApi.getPayroll(periodMonth, branchId);
    const period = await payrollApi.getPeriodStatus(periodMonth, branchId);

    const totalBranchCost = payrolls
      .filter((p) => !p.excludedFromCost)
      .reduce((sum, p) => sum + p.netSalary, 0);

    const totalUnpaidAbandonedSalary = payrolls
      .filter((p) => p.isAbandoned)
      .reduce((sum, p) => sum + p.netSalary, 0);

    const abandonedCount = payrolls.filter((p) => p.isAbandoned).length;
    const uniformRetainedCount = payrolls.filter((p) => p.isUniformRetained).length;

    return {
      periodMonth,
      branchId: branchId || 1,
      branchName: branchId === 2 ? 'Sen Việt Buffet - Chi nhánh Quế Võ' : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      periodStatus: period?.status === 'LOCKED' ? 'LOCKED' : 'OPEN',
      totalBranchCost,
      totalUnpaidAbandonedSalary,
      totalEmployees: payrolls.length,
      abandonedCount,
      uniformRetainedCount,
      payrolls,
    };
  },

  // 2. Xét tăng lương quý
  scanIncreases: async (quarter = 'Q4-2026', branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 180);

    return [
      {
        id: 1,
        userId: 1,
        fullName: 'Nguyễn Văn Bếp',
        username: 'bep_tn',
        branchId: branchId || 1,
        branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
        examQuarter: quarter,
        examScore: 96,
        lateCount: 0,
        unexcusedAbsenceCount: 0,
        isEligible: true,
        raiseAmount: 1000000,
        status: 'CHO_DUYET',
        evaluationDetails: 'Đạt điểm lý thuyết 100/100, thực hành 92/100. Đi làm đầy đủ không vi phạm.',
        createdAt: '2026-11-15',
      },
    ];
  },

  getIncreaseProposals: async (branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    return payrollApi.scanIncreases('Q4-2026', branchId);
  },

  approveIncrease: async (id: number): Promise<SalaryIncreaseProposal> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    return {
      id,
      userId: 1,
      fullName: 'Nguyễn Văn Bếp',
      username: 'bep_tn',
      branchId: 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      examQuarter: 'Q4-2026',
      examScore: 96,
      lateCount: 0,
      unexcusedAbsenceCount: 0,
      isEligible: true,
      raiseAmount: 1000000,
      status: 'DA_DUYET',
      evaluationDetails: 'Đạt điểm thi xuất sắc, đã duyệt tăng lương',
      approvedByName: 'Lê Hoàng Quản Lý',
      approvedAt: new Date().toISOString().slice(0, 10),
      createdAt: '2026-11-15',
    };
  },

  // 3. Bảng lương tổng hợp & Chuyển khoản
  generatePayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 220);

    const m = month || '2026-11';
    return await payrollApi.getPayroll(m, branchId);
  },

  getPayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const m = month || '2026-10';
    let list = await db.payrollRecords.toArray();

    // Map fields to match Payroll interface exactly
    const mapped: Payroll[] = list.map((p) => {
      const isRetained = p.userId === 10 || p.holdReason?.includes('đồng phục');
      const isAband = p.userId === 10 || p.status === 'BO_VIEC';

      return {
        id: p.id,
        userId: p.userId,
        fullName: p.fullName,
        username: p.username,
        position: p.position || 'Nhân viên',
        branchId: p.branchId || 1,
        branchName: p.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
        payrollMonth: p.month || p.payrollMonth || m,
        baseSalary: p.baseSalary || 8500000,
        standardWorkDays: 26,
        actualWorkDays: p.actualWorkDays || 26,
        salaryRaise: 0,
        allowance: p.allowance || 500000,
        grossSalary: (p.baseSalary || 8500000) + (p.allowance || 500000) + (p.overtimePay || 0),
        advanceDeduction: p.advanceDeduction || 0,
        penaltyDeduction: p.deductions || 0,
        netSalary: p.netSalary || 9000000,
        status: isRetained ? 'DANG_GIU_LUONG' : isAband ? 'BO_VIEC' : p.isPaid ? 'DA_THANH_TOAN' : 'CHO_DUYET',
        isAbandoned: isAband,
        isUniformRetained: isRetained,
        excludedFromCost: isAband,
        holdReason: isRetained ? '🔒 Chưa thu hồi đồng phục (thiếu 1 Tạp dề, 1 Nón bếp)' : undefined,
        isLocked: p.isLocked !== undefined ? p.isLocked : true,
        bankName: 'Vietcombank',
        bankAccountNumber: `101${p.userId}888999`,
        bankAccountHolder: p.fullName.toUpperCase(),
        note: isRetained ? 'Giữ lương theo quy định thu hồi đồng phục' : undefined,
      };
    });

    if (branchId) {
      return mapped.filter((p) => p.branchId === branchId);
    }
    return mapped;
  },

  getMyPayrolls: async (): Promise<Payroll[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const savedUserId = Number(localStorage.getItem('senviet_demo_user_id') || 1);
    const list = await payrollApi.getPayroll('2026-10');
    return list.filter((p) => p.userId === savedUserId);
  },

  exportBankExcel: async (month: string, branchId?: number): Promise<Blob> => {
    await simulateLatency(80, 120);
    const list = await payrollApi.getPayroll(month, branchId);

    const wb = XLSX.utils.book_new();
    const header = [
      'STT',
      'Mã NV',
      'Họ và tên',
      'Chức vụ',
      'Chi nhánh',
      'Lương cơ bản',
      'Ngày công',
      'Phụ cấp',
      'Khấu trừ ứng lương',
      'Thực lĩnh (VNĐ)',
      'Tên Ngân hàng',
      'Số tài khoản',
      'Chủ tài khoản',
      'Trạng thái chuyển khoản',
      'Ghi chú',
    ];

    const rows = list.map((p, idx) => [
      idx + 1,
      p.username,
      p.fullName,
      p.position,
      p.branchName,
      p.baseSalary,
      p.actualWorkDays,
      p.allowance,
      p.advanceDeduction,
      p.netSalary,
      p.bankName,
      p.bankAccountNumber,
      p.bankAccountHolder,
      p.status === 'DA_THANH_TOAN' ? 'ĐÃ CHI TRẢ' : p.isUniformRetained ? 'ĐANG GIỮ ĐỒNG PHỤC' : 'CHỜ DUYỆT',
      p.holdReason || p.note || '',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, `BangLuong_${month}`);
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
