import * as XLSX from 'xlsx';
import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

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
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.suppliers.toArray();
    if (keyword && keyword.trim()) {
      const q = keyword.trim().toLowerCase();
      list = list.filter(
        (s) =>
          s.supplierName.toLowerCase().includes(q) ||
          s.supplierCode.toLowerCase().includes(q) ||
          (s.phone && s.phone.includes(q))
      );
    }
    return list;
  },

  createSupplier: async (data: CreateSupplierRequest): Promise<Supplier> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const newSupplier: Supplier = {
      id: Date.now(),
      supplierCode: data.supplierCode || `NCC-${Date.now().toString().slice(-4)}`,
      supplierName: data.supplierName,
      phone: data.phone,
      address: data.address,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString().slice(0, 10),
    };

    await db.suppliers.add(newSupplier);
    return newSupplier;
  },

  updateSupplier: async (id: number, data: Partial<CreateSupplierRequest>): Promise<Supplier> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    await db.suppliers.update(id, data);
    const updated = await db.suppliers.get(id);
    if (!updated) throw new Error('Không tìm thấy nhà cung cấp');
    return updated;
  },

  // --- Batches (Lô nhập) ---
  getAvailableBatches: async (params?: { branchId?: number; itemId?: number }): Promise<ImportBatch[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    let list = await db.inventoryLots.toArray();
    if (params?.branchId) {
      list = list.filter((b) => !b.branchId || b.branchId === params.branchId);
    }
    if (params?.itemId) {
      list = list.filter((b) => b.itemId === params.itemId);
    }
    return list;
  },

  getAllBatches: async (params?: { branchId?: number; itemId?: number }): Promise<ImportBatch[]> => {
    return warehouseApi.getAvailableBatches(params);
  },

  // --- Inventory Stocks ---
  getStocks: async (params?: { branchId?: number; itemId?: number }): Promise<InventoryStock[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const lots = await db.inventoryLots.toArray();
    const items = await db.items.toArray();
    const itemMap = new Map(items.map((i) => [i.id, i]));

    const stocks: InventoryStock[] = lots.map((lot) => {
      const it = itemMap.get(lot.itemId);
      return {
        id: lot.id,
        branchId: lot.branchId || 1,
        branchName: lot.branchName || 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
        itemId: lot.itemId,
        itemCode: lot.itemCode || it?.itemCode || 'M-01',
        itemName: lot.itemName || it?.itemName || 'Món ăn',
        category: it?.category || 'Nguyên liệu',
        batchId: lot.id,
        batchCode: lot.batchCode,
        quantity: lot.currentStock,
        unit: lot.unit || it?.unit || 'kg',
        lastUpdatedAt: lot.importDate || '2026-11-18',
      };
    });

    let res = stocks;
    if (params?.branchId) {
      res = res.filter((s) => s.branchId === params.branchId);
    }
    if (params?.itemId) {
      res = res.filter((s) => s.itemId === params.itemId);
    }
    return res;
  },

  // --- Documents (Phiếu nhập / xuất / huỷ) ---
  getDocuments: async (params?: {
    branchId?: number;
    docType?: string;
    status?: string;
  }): Promise<WarehouseDocument[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    let list = await db.warehouseDocuments.toArray();
    if (params?.branchId) {
      list = list.filter((d) => !d.branchId || d.branchId === params.branchId);
    }
    if (params?.docType) {
      list = list.filter((d) => d.docType === params.docType);
    }
    if (params?.status) {
      list = list.filter((d) => d.status === params.status);
    }
    return list.reverse();
  },

  createDocument: async (data: CreateDocumentRequest): Promise<WarehouseDocument> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 200);

    const supplier = data.supplierId ? await db.suppliers.get(data.supplierId) : null;
    const itemsList = await db.items.toArray();
    const itemMap = new Map(itemsList.map((i) => [i.id, i]));

    const totalAmount = data.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const codePrefix = data.docType === 'NHAP' ? 'PNK' : data.docType === 'XUAT_CHUYEN' ? 'PXK' : 'PHK';
    const docCode = `${codePrefix}-${Date.now().toString().slice(-6)}`;

    const docItems: WarehouseDocumentItem[] = data.items.map((it, idx) => {
      const foundItem = itemMap.get(it.itemId);
      return {
        id: Date.now() + idx,
        itemId: it.itemId,
        itemCode: foundItem?.itemCode || 'M-01',
        itemName: foundItem?.itemName || 'Nguyên liệu',
        batchCode: it.batchId ? `LOT-${it.batchId}` : `LOT-NEW-${Date.now().toString().slice(-4)}`,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        unit: foundItem?.unit || 'kg',
        expiryDate: it.expiryDate,
      };
    });

    const newDoc: WarehouseDocument = {
      id: Date.now(),
      docType: data.docType,
      docCode,
      branchId: data.branchId || 1,
      branchName: data.branchId === 2 ? 'Sen Việt Buffet - Chi nhánh Quế Võ' : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      supplierId: data.supplierId,
      supplierName: supplier?.supplierName,
      supplierCode: supplier?.supplierCode,
      createdBy: 'ql_chinhanh_tn',
      createdByName: 'Lê Hoàng Quản Lý',
      status: 'HOAN_THANH',
      note: data.note,
      totalAmount,
      imageUrls: data.imageUrls,
      createdAt: now,
      items: docItems,
    };

    await db.warehouseDocuments.add(newDoc);

    // Cập nhật tồn kho nếu là phiếu nhập
    if (data.docType === 'NHAP') {
      for (const it of docItems) {
        const newLot: ImportBatch = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          batchCode: it.batchCode || `LOT-${Date.now().toString().slice(-4)}`,
          supplierId: data.supplierId,
          supplierCode: supplier?.supplierCode,
          supplierName: supplier?.supplierName,
          itemId: it.itemId,
          itemCode: it.itemCode,
          itemName: it.itemName,
          branchId: data.branchId || 1,
          importDate: new Date().toISOString().slice(0, 10),
          expiryDate: it.expiryDate || '2026-12-31',
          initialQuantity: it.quantity,
          currentStock: it.quantity,
          unitPrice: it.unitPrice,
          unit: it.unit || 'kg',
          status: 'ACTIVE',
        };
        await db.inventoryLots.add(newLot);
      }
    }

    return newDoc;
  },

  // --- Inventory Checks (Kiểm kê kho) ---
  getInventoryChecks: async (params?: {
    branchId?: number;
    shift?: string;
    checkDate?: string;
  }): Promise<InventoryCheck[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    let list = await db.inventoryChecks.toArray();
    if (params?.branchId) {
      list = list.filter((c) => !c.branchId || c.branchId === params.branchId);
    }
    if (params?.shift) {
      list = list.filter((c) => c.shift === params.shift);
    }
    if (params?.checkDate) {
      list = list.filter((c) => c.checkDate === params.checkDate);
    }
    return list.reverse();
  },

  createInventoryCheck: async (data: CreateInventoryCheckRequest): Promise<InventoryCheck> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(140, 200);

    const itemsList = await db.items.toArray();
    const itemMap = new Map(itemsList.map((i) => [i.id, i]));
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const checkCode = `KK-${Date.now().toString().slice(-6)}`;

    const checkItems: InventoryCheckItem[] = data.items.map((it, idx) => {
      const foundItem = itemMap.get(it.itemId);
      const diff = it.actualStock - (it.systemStock || 0);
      return {
        id: Date.now() + idx,
        itemId: it.itemId,
        itemCode: foundItem?.itemCode,
        itemName: foundItem?.itemName,
        category: foundItem?.category,
        batchId: it.batchId,
        systemStock: it.systemStock || 0,
        actualStock: it.actualStock,
        difference: diff,
        reason: it.reason || (diff < 0 ? 'Thất thoát / hao hụt ca' : ''),
        unit: foundItem?.unit || 'kg',
      };
    });

    const newCheck: InventoryCheck = {
      id: Date.now(),
      checkCode,
      branchId: data.branchId || 1,
      branchName: 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      shift: data.shift,
      checkDate: data.checkDate,
      checkedBy: 'bep_tn',
      checkedByName: 'Nguyễn Văn Bếp',
      status: 'HOAN_THANH',
      note: data.note,
      createdAt: now,
      items: checkItems,
    };

    await db.inventoryChecks.add(newCheck);
    return newCheck;
  },

  // --- Supplier Loss Report ---
  getSupplierLossReport: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<SupplierLossReport[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    return [
      {
        supplierId: 1,
        supplierCode: 'NCC-HS01',
        supplierName: 'Công ty Hải Sản Biển Đông',
        reportCount: 3,
        importedQuantity: 185.0,
        totalPurchasedQty: 185.0,
        damagedQuantity: 4.8,
        totalDamagedQty: 4.8,
        lossRate: 2.59,
        damageRatePercentage: 2.59,
        damagedAmount: 1820000,
        totalEstimatedLossAmount: 1820000,
        rank: 1,
        ranking: 1,
        evaluation: 'Tỷ lệ hỏng trong chuẩn cho phép (<3%)',
        unit: 'kg',
      },
      {
        supplierId: 3,
        supplierCode: 'NCC-RC03',
        supplierName: 'HTX Rau Củ Quả Sạch Đà Lạt',
        reportCount: 2,
        importedQuantity: 250.0,
        totalPurchasedQty: 250.0,
        damagedQuantity: 18.0,
        totalDamagedQty: 18.0,
        lossRate: 7.2,
        damageRatePercentage: 7.2,
        damagedAmount: 240000,
        totalEstimatedLossAmount: 240000,
        rank: 2,
        ranking: 2,
        evaluation: 'Cần nhắc nhở đóng gói thùng xốp chống ngập nước',
        unit: 'kg',
      },
      {
        supplierId: 2,
        supplierCode: 'NCC-TB02',
        supplierName: 'Thịt Bò Nhập Khẩu Vissan',
        reportCount: 0,
        importedQuantity: 100.0,
        totalPurchasedQty: 100.0,
        damagedQuantity: 0.0,
        totalDamagedQty: 0.0,
        lossRate: 0.0,
        damageRatePercentage: 0.0,
        damagedAmount: 0,
        totalEstimatedLossAmount: 0,
        rank: 3,
        ranking: 3,
        evaluation: 'Chất lượng xuất sắc (0% lỗi)',
        unit: 'kg',
      },
    ];
  },

  exportSupplierLossExcel: async (params?: {
    month?: number;
    year?: number;
    branchId?: number;
    itemId?: number;
  }): Promise<Blob> => {
    await simulateLatency(80, 120);
    const data = await warehouseApi.getSupplierLossReport(params);

    const wb = XLSX.utils.book_new();
    const header = [
      'Xếp hạng',
      'Mã NCC',
      'Tên Nhà Cung Cấp',
      'Số lần giao lỗi',
      'Tổng lượng nhập (kg)',
      'Tổng lượng hỏng (kg)',
      'Tỷ lệ hỏng (%)',
      'Tổng tiền thiệt hại (đ)',
      'Đánh giá chất lượng',
    ];

    const rows = data.map((d) => [
      d.rank || 1,
      d.supplierCode,
      d.supplierName,
      d.reportCount || 0,
      d.totalPurchasedQty || 0,
      d.totalDamagedQty || 0,
      `${d.damageRatePercentage}%`,
      d.totalEstimatedLossAmount || 0,
      d.evaluation,
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'BaoCaoTyLeHongNCC');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
