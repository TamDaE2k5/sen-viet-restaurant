import apiClient from './client';

export interface Supplier {
  id: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
}

export interface CreateSupplierRequest {
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  status?: 'ACTIVE' | 'INACTIVE';
}

export interface ImportBatch {
  id: number;
  batchCode: string;
  supplierId?: number;
  supplierCode?: string;
  supplierName?: string;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  branchId?: number;
  branchName?: string;
  importDate: string;
  expiryDate?: string;
  initialQuantity: number;
  currentStock: number;
  unitPrice: number;
  unit: string;
  status?: string;
}

export interface WarehouseDocumentItem {
  id?: number;
  documentId?: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  batchId?: number;
  batchCode?: string;
  quantity: number;
  unitPrice: number;
  unit?: string;
  expiryDate?: string;
}

export interface WarehouseDocument {
  id: number;
  docType: 'NHAP' | 'XUAT_CHUYEN' | 'HUY' | 'KIEM_KE' | string;
  docCode: string;
  branchId?: number;
  branchName?: string;
  supplierId?: number;
  supplierName?: string;
  supplierCode?: string;
  createdBy?: string;
  createdByName?: string;
  status?: string;
  note?: string;
  totalAmount: number;
  imageUrls?: string;
  createdAt: string;
  items: WarehouseDocumentItem[];
}

export interface CreateDocumentRequest {
  branchId?: number;
  docType: 'NHAP' | 'XUAT_CHUYEN' | 'HUY' | 'KIEM_KE' | string;
  supplierId?: number;
  note?: string;
  imageUrls?: string;
  items: {
    itemId: number;
    quantity: number;
    unitPrice: number;
    expiryDate?: string;
    batchId?: number;
  }[];
}

export interface InventoryStock {
  id: number;
  branchId: number;
  branchName?: string;
  itemId: number;
  itemCode: string;
  itemName: string;
  category?: string;
  batchId?: number;
  batchCode?: string;
  quantity: number;
  unit: string;
  lastUpdatedAt: string;
}

export interface InventoryCheckItem {
  id?: number;
  checkId?: number;
  itemId: number;
  itemCode?: string;
  itemName?: string;
  category?: string;
  batchId?: number;
  batchCode?: string;
  systemStock: number;
  actualStock: number;
  difference?: number;
  reason?: string;
  unit?: string;
}

export interface InventoryCheck {
  id: number;
  checkCode: string;
  branchId?: number;
  branchName?: string;
  shift: 'CA_SANG' | 'CA_TOI' | 'CA_NGAY' | 'SANG' | 'TOI' | string;
  checkDate: string;
  checkedBy?: string;
  checkedByName?: string;
  status?: string;
  note?: string;
  createdAt: string;
  items: InventoryCheckItem[];
}

export interface CreateInventoryCheckRequest {
  branchId?: number;
  shift: string;
  checkDate: string;
  note?: string;
  items: {
    itemId: number;
    batchId?: number;
    systemStock?: number;
    actualStock: number;
    reason?: string;
  }[];
}

export interface SupplierLossReport {
  supplierId?: number;
  supplierCode: string;
  supplierName: string;
  reportCount?: number;
  importedQuantity?: number;
  totalPurchasedQty?: number;
  damagedQuantity?: number;
  totalDamagedQty?: number;
  lossRate?: number;
  damageRatePercentage?: number;
  damagedAmount?: number;
  totalEstimatedLossAmount?: number;
  ranking?: number;
  rank?: number;
  defectCount?: number;
  evaluation?: string;
  unit?: string;
}

export const warehouseApi = {
  // --- Suppliers ---
  getSuppliers: async (keyword?: string): Promise<Supplier[]> => {
    try {
      const res = await apiClient.get('/v1/suppliers', { params: { keyword } });
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.get('/v1/warehouse/suppliers', { params: { keyword } });
        return res.data.data;
      }
      throw err;
    }
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    try {
      const res = await apiClient.post('/v1/suppliers', data);
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.post('/v1/warehouse/suppliers', data);
        return res.data.data;
      }
      throw err;
    }
  },

  updateSupplier: async (id: number, data: Partial<CreateSupplierRequest>): Promise<Supplier> => {
    try {
      const res = await apiClient.put(`/v1/suppliers/${id}`, data);
      return res.data.data;
    } catch (err: any) {
      if (err.response?.status === 404) {
        const res = await apiClient.put(`/v1/warehouse/suppliers/${id}`, data);
        return res.data.data;
      }
      throw err;
    }
  },

  // --- Batches (Lô nhập) ---
  getAvailableBatches: async (params?: { branchId?: number; itemId?: number }): Promise<ImportBatch[]> => {
    const res = await apiClient.get('/v1/warehouse/batches/available', { params });
    return res.data.data;
  },

  getAllBatches: async (params?: { branchId?: number; itemId?: number }): Promise<ImportBatch[]> => {
    try {
      const res = await apiClient.get('/v1/warehouse/batches', { params });
      return res.data.data;
    } catch (err: any) {
      // Fallback to available batches if getAll not separately implemented
      return warehouseApi.getAvailableBatches(params);
    }
  },

  // --- Inventory Stocks ---
  getStocks: async (params?: { branchId?: number; itemId?: number }): Promise<InventoryStock[]> => {
    const res = await apiClient.get('/v1/warehouse/stocks', { params });
    return res.data.data;
  },

  // --- Documents (Phiếu nhập / xuất / huỷ) ---
  getDocuments: async (params?: {
    branchId?: number;
    docType?: string;
    status?: string;
  }): Promise<WarehouseDocument[]> => {
    const res = await apiClient.get('/v1/warehouse/documents', { params });
    return res.data.data;
  },

  createDocument: async (data: CreateDocumentRequest): Promise<WarehouseDocument> => {
    const res = await apiClient.post('/v1/warehouse/documents', data);
    return res.data.data;
  },

  // --- Inventory Checks (Kiểm kê kho) ---
  getInventoryChecks: async (params?: {
    branchId?: number;
    shift?: string;
    checkDate?: string;
  }): Promise<InventoryCheck[]> => {
    const res = await apiClient.get('/v1/warehouse/inventory-checks', { params });
    return res.data.data;
  },

  createInventoryCheck: async (data: CreateInventoryCheckRequest): Promise<InventoryCheck> => {
    const res = await apiClient.post('/v1/warehouse/inventory-checks', data);
    return res.data.data;
  },

  // --- Supplier Loss Report ---
  getSupplierLossReport: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<SupplierLossReport[]> => {
    let monthParam: string | undefined = undefined;
    if (params?.month && params?.year) {
      monthParam = `${params.year}-${String(params.month).padStart(2, '0')}`;
    }
    const queryParams: Record<string, any> = {
      branchId: params?.branchId,
      itemId: params?.itemId,
      month: monthParam,
    };
    const res = await apiClient.get('/v1/warehouse/reports/supplier-loss', { params: queryParams });
    return res.data.data;
  },

  exportSupplierLossExcel: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<Blob> => {
    let monthParam: string | undefined = undefined;
    if (params?.month && params?.year) {
      monthParam = `${params.year}-${String(params.month).padStart(2, '0')}`;
    }
    const queryParams: Record<string, any> = {
      branchId: params?.branchId,
      itemId: params?.itemId,
      month: monthParam,
    };
    const res = await apiClient.get('/v1/warehouse/reports/supplier-loss/export', {
      params: queryParams,
      responseType: 'blob',
    });
    return res.data;
  },
};
