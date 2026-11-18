import apiClient from './client';

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

export interface Payroll {
  id: number;
  userId: number;
  fullName: string;
  username: string;
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

export const payrollApi = {
  // 1. Tạm ứng lương
  requestAdvance: async (data: SalaryAdvanceRequest): Promise<SalaryAdvance> => {
    const res = await apiClient.post('/hr/advances', data);
    return res.data.data;
  },

  getAdvances: async (branchId?: number): Promise<SalaryAdvance[]> => {
    const res = await apiClient.get('/hr/advances', { params: { branchId } });
    return res.data.data;
  },

  getMyAdvances: async (): Promise<SalaryAdvance[]> => {
    const res = await apiClient.get('/hr/advances/my');
    return res.data.data;
  },

  disburseAdvance: async (id: number, data: DisburseAdvanceRequest): Promise<SalaryAdvance> => {
    const res = await apiClient.put(`/hr/advances/${id}/disburse`, data);
    return res.data.data;
  },

  updateAdvance: async (id: number, data: UpdateAdvanceRequest): Promise<SalaryAdvance> => {
    try {
      const res = await apiClient.put(`/hr/advances/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.put(`/v1/payroll/advances/${id}`, data);
        return res.data.data;
      }
      throw err;
    }
  },

  cancelAdvance: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/hr/advances/${id}`);
    } catch (err: any) {
      if (err.response?.status === 404) {
        await apiClient.delete(`/v1/payroll/advances/${id}`);
      } else {
        throw err;
      }
    }
  },

  // 1.1 Khóa / Mở Khóa Bảng Lương (Payroll Period Lock)
  lockPeriod: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod> => {
    try {
      const res = await apiClient.post(`/v1/payroll/lock/${periodMonth}`, null, { params: { branchId } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.post(`/hr/payroll/lock/${periodMonth}`, null, { params: { branchId } });
        return res.data.data;
      }
      throw err;
    }
  },

  unlockPeriod: async (periodMonth: string, reason: string, branchId?: number): Promise<PayrollPeriod> => {
    try {
      const res = await apiClient.post(`/v1/payroll/unlock/${periodMonth}`, { reason }, { params: { branchId } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.post(`/hr/payroll/unlock/${periodMonth}`, { reason }, { params: { branchId } });
        return res.data.data;
      }
      throw err;
    }
  },

  getPeriodStatus: async (periodMonth: string, branchId?: number): Promise<PayrollPeriod | null> => {
    try {
      const res = await apiClient.get(`/v1/payroll/periods/${periodMonth}`, { params: { branchId } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const res = await apiClient.get(`/v1/payroll/period/${periodMonth}`, { params: { branchId } });
          return res.data.data;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  getPayrollSummary: async (month?: string, branchId?: number): Promise<PayrollSummary | null> => {
    try {
      const res = await apiClient.get('/v1/payroll/summary', { params: { month, branchId } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        try {
          const res = await apiClient.get('/hr/payroll/summary', { params: { month, branchId } });
          return res.data.data;
        } catch {
          return null;
        }
      }
      return null;
    }
  },

  // 2. Xét tăng lương quý
  scanIncreases: async (quarter = 'Q4-2026', branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    const res = await apiClient.post('/hr/increases/scan', null, { params: { quarter, branchId } });
    return res.data.data;
  },

  getIncreaseProposals: async (branchId?: number): Promise<SalaryIncreaseProposal[]> => {
    const res = await apiClient.get('/hr/increases', { params: { branchId } });
    return res.data.data;
  },

  approveIncrease: async (id: number): Promise<SalaryIncreaseProposal> => {
    const res = await apiClient.put(`/hr/increases/${id}/approve`);
    return res.data.data;
  },

  // 3. Bảng lương tổng hợp & Chuyển khoản
  generatePayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    const res = await apiClient.post('/hr/payroll/generate', null, { params: { month, branchId } });
    return res.data.data;
  },

  getPayroll: async (month?: string, branchId?: number): Promise<Payroll[]> => {
    const res = await apiClient.get('/hr/payroll', { params: { month, branchId } });
    return res.data.data;
  },

  getMyPayrolls: async (): Promise<Payroll[]> => {
    const res = await apiClient.get('/hr/payroll/my');
    return res.data.data;
  },

  exportBankExcel: async (month: string, branchId?: number): Promise<Blob> => {
    const res = await apiClient.get(`/hr/payroll/${month}/export-bank`, {
      params: { branchId },
      responseType: 'blob'
    });
    return res.data;
  }
};
