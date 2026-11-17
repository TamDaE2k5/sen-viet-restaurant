import apiClient from './client';

export interface Attendance {
  id: number;
  userId: number;
  fullName: string;
  username: string;
  branchId: number;
  branchName: string;
  attendanceDate: string;
  shiftName: string;
  checkInTime: string;
  checkInSelfieUrl?: string;
  checkInDistanceMeters: number;
  isValidLocation: boolean;
  lateMinutes: number;
  checkOutTime?: string;
  checkOutSelfieUrl?: string;
  checkOutDistanceMeters: number;
  earlyMinutes: number;
  workShiftHours: number;
  actualHours: number;
  status: string; // 'DANG_LAM', 'HOAN_THANH', 'VI_PHAM_KHOANG_CACH'
}

export interface CheckInRequest {
  shiftName: string;
  selfieUrl: string;
  latitude: number;
  longitude: number;
}

export interface CheckOutRequest {
  selfieUrl: string;
  latitude: number;
  longitude: number;
}

export interface ExamQuestion {
  id: number;
  position: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
}

export interface ExamSubmitRequest {
  examQuarter: string;
  startedAt?: string;
  answers: Record<string, string>;
}

export interface ExamSubmission {
  id: number;
  userId: number;
  fullName: string;
  examQuarter: string;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  theoryScore: number;
  practicalScore?: number;
  totalScore: number;
  practicalComment?: string;
  status: string;
  isPassed: boolean;
}

export interface GradePracticalRequest {
  practicalScore: number;
  comment: string;
}

export interface UniformItem {
  id: number;
  itemName: string;
  depositValue: number;
}

export interface UniformAllocation {
  id: number;
  uniformItemId: number;
  uniformItemName: string;
  depositValue: number;
  allocatedDate: string;
  isReturned: boolean;
  returnedDate?: string;
  note?: string;
}

export interface ResignationRequest {
  id: number;
  user: {
    id: number;
    username: string;
    fullName: string;
    phone?: string;
  };
  branch: {
    id: number;
    branchCode: string;
    branchName: string;
  };
  requestDate: string;
  reason: string;
  isAbandoned: boolean;
  status: string; // 'CHO_DUYET', 'DA_DUYET', 'DANG_GIU_LUONG', 'HOAN_TAT', 'BO_VIEC'
  missingUniformDetails?: string;
  approvedByUser?: {
    id: number;
    fullName: string;
  };
  approvedAt?: string;
  managerNote?: string;
  createdAt: string;
}

export interface UniformReturnRequest {
  returnedAllocationIds: number[];
  managerNote: string;
}

export interface AbandonmentScanResult {
  scanDate: string;
  totalUsersScanned: number;
  suspectedAbandonmentCount: number;
  suspectedUsers: Array<{
    userId: number;
    username: string;
    fullName: string;
    branchName: string;
    consecutiveDaysAbsent: number;
    suggestion: string;
  }>;
}

export const hrApi = {
  // Attendance
  checkIn: async (data: CheckInRequest): Promise<Attendance> => {
    const res = await apiClient.post('/hr/attendance/check-in', data);
    return res.data.data;
  },

  checkOut: async (data: CheckOutRequest): Promise<Attendance> => {
    const res = await apiClient.post('/hr/attendance/check-out', data);
    return res.data.data;
  },

  getTodayAttendances: async (branchId?: number): Promise<Attendance[]> => {
    const res = await apiClient.get('/hr/attendance/today', { params: { branchId } });
    return res.data.data;
  },

  getMyAttendanceHistory: async (): Promise<Attendance[]> => {
    const res = await apiClient.get('/hr/attendance/history');
    return res.data.data;
  },

  scanAbandonment: async (): Promise<AbandonmentScanResult> => {
    const res = await apiClient.get('/hr/attendance/scan-abandonment');
    return res.data.data;
  },

  confirmAbandonment: async (userId: number): Promise<ResignationRequest> => {
    const res = await apiClient.post(`/hr/attendance/confirm-abandonment/${userId}`);
    return res.data.data;
  },

  // Exam
  getExamQuestions: async (position = 'BEP'): Promise<ExamQuestion[]> => {
    const res = await apiClient.get('/hr/exams/questions', { params: { position } });
    return res.data.data;
  },

  submitExam: async (data: ExamSubmitRequest): Promise<ExamSubmission> => {
    const res = await apiClient.post('/hr/exams/submit', data);
    return res.data.data;
  },

  getBranchSubmissions: async (branchId?: number): Promise<ExamSubmission[]> => {
    const res = await apiClient.get('/hr/exams/submissions', { params: { branchId } });
    return res.data.data;
  },

  getMySubmissions: async (): Promise<ExamSubmission[]> => {
    const res = await apiClient.get('/hr/exams/my-submissions');
    return res.data.data;
  },

  gradePractical: async (id: number, data: GradePracticalRequest): Promise<ExamSubmission> => {
    const res = await apiClient.put(`/hr/exams/submissions/${id}/grade-practical`, data);
    return res.data.data;
  },

  // Uniform & Resignation
  getUniformItems: async (): Promise<UniformItem[]> => {
    const res = await apiClient.get('/hr/uniforms/items');
    return res.data.data;
  },

  getMyUniformAllocations: async (): Promise<UniformAllocation[]> => {
    const res = await apiClient.get('/hr/uniforms/my-allocations');
    return res.data.data;
  },

  getUserUniformAllocations: async (userId: number): Promise<UniformAllocation[]> => {
    const res = await apiClient.get(`/hr/uniforms/user-allocations/${userId}`);
    return res.data.data;
  },

  getResignationRequests: async (branchId?: number): Promise<ResignationRequest[]> => {
    const res = await apiClient.get('/hr/resignations', { params: { branchId } });
    return res.data.data;
  },

  getMyResignations: async (): Promise<ResignationRequest[]> => {
    const res = await apiClient.get('/hr/resignations/my');
    return res.data.data;
  },

  submitResignation: async (reason?: string): Promise<ResignationRequest> => {
    const res = await apiClient.post('/hr/resignations/submit', null, { params: { reason } });
    return res.data.data;
  },

  verifyChecklist: async (id: number, data: UniformReturnRequest): Promise<ResignationRequest> => {
    const res = await apiClient.put(`/hr/resignations/${id}/checklist`, data);
    return res.data.data;
  },
};
