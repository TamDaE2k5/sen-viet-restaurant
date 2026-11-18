import apiClient from './client';

export interface Item {
  id: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  category: string;
  unit: string;
  costPrice: number;
  isBuffetLine: boolean;
}

export interface Recipe {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  recipeName: string;
  standardLossRate: number;
  description: string;
}

export interface BatchResponse {
  id: number;
  batchCode: string;
  itemId: number;
  itemName: string;
  itemCode: string;
  inputWeight: number;
  outputWeight: number | null;
  lossRate: number | null;
  standardLossRate: number;
  overStandard: boolean;
  secondBatch: boolean;
  status: 'DANG_LAM' | 'HOAN_THANH' | 'HUY';
  startedBy: string;
  finishedBy: string | null;
  startedAt: string;
  finishedAt: string | null;
  warningMessage: string | null;
}

export interface TakeOutLog {
  id: number;
  item: Item;
  quantity: number;
  unit: string;
  note?: string;
  createdAt: string;
}

export interface DamageReport {
  id: number;
  item: Item;
  supplierCode?: string;
  batchNumber?: string;
  quantity: number;
  estimatedValue: number;
  reason: string;
  imageUrls?: string;
  status: 'TU_DONG_DUYET' | 'CHO_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  note?: string;
  createdAt: string;
}

export const kitchenApi = {
  // Lấy danh sách món quầy buffet
  getBuffetItems: async (): Promise<Item[]> => {
    const res = await apiClient.get('/v1/kitchen/items');
    return res.data.data;
  },

  // Tìm kiếm theo mã hoặc barcode
  searchItems: async (code?: string): Promise<Item[]> => {
    const res = await apiClient.get('/v1/kitchen/items/search', { params: { code } });
    return res.data.data;
  },

  // Lấy danh sách công thức & định mức hao hụt chuẩn
  getRecipes: async (): Promise<Recipe[]> => {
    const res = await apiClient.get('/v1/kitchen/recipes');
    return res.data.data;
  },

  // Nút 1: Lấy hàng từ kho
  recordTakeOut: async (data: { itemId: number; quantity: number; unit: string; note?: string }) => {
    const res = await apiClient.post('/v1/kitchen/take-out', data);
    return res.data;
  },

  // Nút 2A: Khởi tạo mẻ chế biến
  startBatch: async (data: { itemId: number; inputWeight: number; unit: string; note?: string; forceSecondBatch?: boolean }) => {
    const res = await apiClient.post('/v1/kitchen/processing/start', data);
    return res.data;
  },

  // Nút 2B: Hoàn thành cân mẻ thành phẩm
  finishBatch: async (data: { batchId: number; outputWeight: number }) => {
    const res = await apiClient.post('/v1/kitchen/processing/finish', data);
    return res.data;
  },

  // Lấy danh sách các mẻ đang làm dở dang
  getActiveBatches: async (): Promise<BatchResponse[]> => {
    const res = await apiClient.get('/v1/kitchen/processing/active');
    return res.data.data;
  },

  // Lấy lịch sử tất cả các mẻ
  getAllBatches: async (): Promise<BatchResponse[]> => {
    const res = await apiClient.get('/v1/kitchen/processing/batches');
    return res.data.data;
  },

  // Nút 3: Ra line (+1)
  recordLineItem: async (data: { itemId: number; quantity?: number; requestId?: string }) => {
    const res = await apiClient.post('/v1/kitchen/line-items/inc', data);
    return res.data;
  },

  // Nút 4: Báo hỏng nguyên liệu
  recordDamageReport: async (data: {
    itemId: number;
    quantity: number;
    reason: string;
    supplierCode?: string;
    batchNumber?: string;
    note?: string;
    imageUrls?: string;
  }) => {
    const res = await apiClient.post('/v1/kitchen/damage-reports', data);
    return res.data;
  },

  // Lấy danh sách báo hỏng
  getDamageReports: async (): Promise<DamageReport[]> => {
    const res = await apiClient.get('/v1/kitchen/damage-reports');
    return res.data.data;
  },
};
