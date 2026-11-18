import apiClient from './client';

export interface ReconciliationSummary {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  costPrice: number;
  reconDate: string;
  shiftType: string;
  exportedQty: number;
  guestConsumptionQty: number;
  processingLossQty: number;
  reportedDamageQty: number;
  unexplainedLossQty: number;
  unexplainedLossAmount: number;
  unexplainedLossRate: number;
  actualConsumptionPerGuest: number;
  isOverThreshold: boolean;
  responsibleUserName?: string;
  status: string;
}

export interface SupplierLoss {
  supplierCode: string;
  supplierName: string;
  reportCount: number;
  totalDamagedQty: number;
  totalEstimatedLossAmount: number;
  totalPurchasedQty: number;
  damageRatePercentage: number;
}

export interface CukCukImportResponse {
  id: number;
  fileName: string;
  importDate: string;
  shiftType: string;
  totalRevenue: number;
  adultGuestCount: number;
  childGuestCount: number;
  totalGuestCount: number;
  standardBuffetCount: number;
  vipBuffetCount: number;
  message: string;
}

export const reconciliationApi = {
  // Lấy bảng đối soát cuối ngày (6 công thức)
  getDailySummary: async (params?: { date?: string; shiftType?: string; overThresholdOnly?: boolean }): Promise<ReconciliationSummary[]> => {
    const res = await apiClient.get('/v1/reconciliation/daily-summary', { params });
    return res.data.data;
  },

  // Báo cáo tỷ lệ hỏng theo nhà cung cấp
  getSupplierLossReport: async (): Promise<SupplierLoss[]> => {
    const res = await apiClient.get('/v1/reconciliation/supplier-loss-report');
    return res.data.data;
  },

  // Upload file Excel CukCuk POS
  uploadCukCukExcel: async (file: File): Promise<CukCukImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/v1/reconciliation/cukcuk/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data.data;
  },

  // Tải file mẫu CukCuk POS
  downloadSampleCukCukExcel: async (): Promise<Blob> => {
    const res = await apiClient.get('/v1/reconciliation/cukcuk/sample', {
      responseType: 'blob',
    });
    return res.data;
  },

  // Xuất file Excel báo cáo đối soát
  exportReconciliationExcel: async (params?: { date?: string; shiftType?: string }): Promise<Blob> => {
    const res = await apiClient.get('/v1/reconciliation/export-excel', {
      params,
      responseType: 'blob',
    });
    return res.data;
  },
};
