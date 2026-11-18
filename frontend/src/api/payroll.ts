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
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'BO_VIEC', 'DA_THANH_TOAN'
  isAbandoned: boolean;
  isUniformRetained: boolean;
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
