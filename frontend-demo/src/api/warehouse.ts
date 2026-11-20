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
  supplierReportedWeight?: number; // Khối lượng NCC báo (kg)
  actualWeight?: number;          // Khối lượng thực cân (kg)
  weightDiff?: number;            // Lệch = actualWeight - supplierReportedWeight
  shortageAmount?: number;        // Tiền phạt/trừ do cân thiếu
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
  totalReportedAmount?: number;    // Tổng tiền theo khối lượng NCC báo
  totalShortageAmount?: number;    // Tổng tiền bị trừ do cân thiếu
  finalPayableAmount?: number;     // Công nợ thực tế phải trả = totalReportedAmount - totalShortageAmount
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
    supplierReportedWeight?: number;
    actualWeight?: number;
    weightDiff?: number;
    shortageAmount?: number;
  }[];
}

export interface SupplierDebtSummary {
  supplierId: number;
  supplierCode: string;
  supplierName: string;
  phone?: string;
  address?: string;
  branchId?: number;
  totalInvoicesCount: number;
  totalReportedWeight: number; // Tổng khối lượng NCC báo (kg)
  totalActualWeight: number;   // Tổng khối lượng thực cân (kg)
  totalWeightDiff: number;     // Lệch = Thực cân - NCC báo (kg)
  totalReportedAmount: number; // Tổng tiền hóa đơn NCC báo (đ)
  totalShortageDeduction: number; // Tiền giảm trừ công nợ do cân thiếu (đ)
  finalPayableDebt: number;    // Công nợ thực tế phải trả cuối tháng = totalReportedAmount - totalShortageDeduction
  disputeStatus: 'KHOP_DU' | 'LECH_CAN_THIEU' | 'CAN_XAC_MINH';
  lastImportDate?: string;
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

    let totalReportedAmount = 0;
    let totalShortageAmount = 0;

    const docItems: WarehouseDocumentItem[] = data.items.map((it, idx) => {
      const foundItem = itemMap.get(it.itemId);
      const actualWeight = it.actualWeight !== undefined ? it.actualWeight : it.quantity;
      const supplierReportedWeight =
        it.supplierReportedWeight !== undefined ? it.supplierReportedWeight : it.quantity;
      const weightDiff = Number((actualWeight - supplierReportedWeight).toFixed(2));
      const shortage = weightDiff < 0 ? Math.round(Math.abs(weightDiff) * it.unitPrice) : 0;

      totalReportedAmount += supplierReportedWeight * it.unitPrice;
      totalShortageAmount += shortage;

      return {
        id: Date.now() + idx,
        itemId: it.itemId,
        itemCode: foundItem?.itemCode || 'M-01',
        itemName: foundItem?.itemName || 'Nguyên liệu',
        batchCode: it.batchId ? `LOT-${it.batchId}` : `LOT-NEW-${Date.now().toString().slice(-4)}`,
        quantity: actualWeight,
        unitPrice: it.unitPrice,
        unit: foundItem?.unit || 'kg',
        expiryDate: it.expiryDate,
        supplierReportedWeight,
        actualWeight,
        weightDiff,
        shortageAmount: shortage,
      };
    });

    const totalAmount = data.items.reduce(
      (sum, it) => sum + (it.actualWeight ?? it.quantity) * it.unitPrice,
      0
    );
    const finalPayableAmount = Math.max(0, totalReportedAmount - totalShortageAmount);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const codePrefix = data.docType === 'NHAP' ? 'PNK' : data.docType === 'XUAT_CHUYEN' ? 'PXK' : 'PHK';
    const docCode = `${codePrefix}-${Date.now().toString().slice(-6)}`;

    const newDoc: WarehouseDocument = {
      id: Date.now(),
      docType: data.docType,
      docCode,
      branchId: data.branchId || 1,
      branchName:
        data.branchId === 2
          ? 'Sen Việt Buffet - Chi nhánh Quế Võ'
          : 'Sen Việt Buffet - Chi nhánh Thái Nguyên',
      supplierId: data.supplierId,
      supplierName: supplier?.supplierName,
      supplierCode: supplier?.supplierCode,
      createdBy: 'ql_chinhanh_tn',
      createdByName: 'Lê Hoàng Quản Lý',
      status: 'HOAN_THANH',
      note: data.note,
      totalAmount,
      totalReportedAmount,
      totalShortageAmount,
      finalPayableAmount,
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

  // --- Bảng tổng hợp công nợ NCC & Khấu trừ cân thiếu (TASK-S4-02) ---
  getSupplierDebtSummary: async (params?: {
    branchId?: number;
    month?: string;
  }): Promise<SupplierDebtSummary[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);

    const suppliers = await db.suppliers.toArray();
    const documents = await db.warehouseDocuments.toArray();
    const importDocs = documents.filter((d) => d.docType === 'NHAP');

    const map = new Map<number, SupplierDebtSummary>();

    for (const sup of suppliers) {
      map.set(sup.id, {
        supplierId: sup.id,
        supplierCode: sup.supplierCode,
        supplierName: sup.supplierName,
        phone: sup.phone,
        address: sup.address,
        branchId: params?.branchId || 1,
        totalInvoicesCount: 0,
        totalReportedWeight: 0,
        totalActualWeight: 0,
        totalWeightDiff: 0,
        totalReportedAmount: 0,
        totalShortageDeduction: 0,
        finalPayableDebt: 0,
        disputeStatus: 'KHOP_DU',
      });
    }

    for (const doc of importDocs) {
      if (!doc.supplierId) continue;
      let summary = map.get(doc.supplierId);
      if (!summary) {
        summary = {
          supplierId: doc.supplierId,
          supplierCode: doc.supplierCode || 'NCC-UNKNOWN',
          supplierName: doc.supplierName || 'Nhà Cung Cấp',
          branchId: doc.branchId || 1,
          totalInvoicesCount: 0,
          totalReportedWeight: 0,
          totalActualWeight: 0,
          totalWeightDiff: 0,
          totalReportedAmount: 0,
          totalShortageDeduction: 0,
          finalPayableDebt: 0,
          disputeStatus: 'KHOP_DU',
        };
        map.set(doc.supplierId, summary);
      }

      summary.totalInvoicesCount += 1;
      summary.lastImportDate = doc.createdAt.slice(0, 10);

      for (const it of doc.items || []) {
        const repW = it.supplierReportedWeight ?? it.quantity;
        const actW = it.actualWeight ?? it.quantity;
        const diff = it.weightDiff !== undefined ? it.weightDiff : Number((actW - repW).toFixed(2));
        const shortage =
          it.shortageAmount !== undefined
            ? it.shortageAmount
            : diff < 0
            ? Math.round(Math.abs(diff) * it.unitPrice)
            : 0;

        summary.totalReportedWeight = Number((summary.totalReportedWeight + repW).toFixed(2));
        summary.totalActualWeight = Number((summary.totalActualWeight + actW).toFixed(2));
        summary.totalWeightDiff = Number((summary.totalWeightDiff + diff).toFixed(2));
        summary.totalReportedAmount += repW * it.unitPrice;
        summary.totalShortageDeduction += shortage;
      }
      summary.finalPayableDebt = Math.max(
        0,
        summary.totalReportedAmount - summary.totalShortageDeduction
      );
      summary.disputeStatus = summary.totalShortageDeduction > 0 ? 'LECH_CAN_THIEU' : 'KHOP_DU';
    }

    // Nạp baseline thực tế từ sheet NCC Thái Nguyên & Quế Võ nếu chưa có phiếu cân mới
    const list = Array.from(map.values()).map((s) => {
      if (s.totalInvoicesCount === 0) {
        if (s.supplierCode === 'TNCOTHUY' || s.supplierCode === 'NCC-RC03') {
          return {
            ...s,
            totalInvoicesCount: 8,
            totalReportedWeight: 420.5,
            totalActualWeight: 405.0,
            totalWeightDiff: -15.5,
            totalReportedAmount: 45438000,
            totalShortageDeduction: 1860000,
            finalPayableDebt: 43578000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNANHTHO' || s.supplierCode === 'NCC-TB02') {
          return {
            ...s,
            totalInvoicesCount: 12,
            totalReportedWeight: 680.0,
            totalActualWeight: 662.5,
            totalWeightDiff: -17.5,
            totalReportedAmount: 56328000,
            totalShortageDeduction: 2450000,
            finalPayableDebt: 53878000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNHUYENHS' || s.supplierCode === 'NCC-HS01') {
          return {
            ...s,
            totalInvoicesCount: 6,
            totalReportedWeight: 185.0,
            totalActualWeight: 178.2,
            totalWeightDiff: -6.8,
            totalReportedAmount: 23805000,
            totalShortageDeduction: 1496000,
            finalPayableDebt: 22309000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
        if (s.supplierCode === 'TNTHANHHIEP') {
          return {
            ...s,
            totalInvoicesCount: 15,
            totalReportedWeight: 890.0,
            totalActualWeight: 871.0,
            totalWeightDiff: -19.0,
            totalReportedAmount: 98647000,
            totalShortageDeduction: 4180000,
            finalPayableDebt: 94467000,
            disputeStatus: 'LECH_CAN_THIEU' as const,
            lastImportDate: '2026-11-18',
          };
        }
      }
      return s;
    });

    return list;
  },

  exportSupplierDebtExcel: async (params?: {
    branchId?: number;
    month?: string;
  }): Promise<Blob> => {
    await simulateLatency(80, 120);
    const data = await warehouseApi.getSupplierDebtSummary(params);

    const wb = XLSX.utils.book_new();
    const header = [
      'STT',
      'Mã NCC',
      'Tên Nhà Cung Cấp',
      'Số Phiếu Nhập',
      'Khối Lượng NCC Báo (kg)',
      'Khối Lượng Thực Cân (kg)',
      'Lệch Cân (kg)',
      'Tiền Hàng NCC Báo (đ)',
      'Trừ Tiền Cân Thiếu (đ)',
      'Công Nợ Thực Trả Cuối Tháng (đ)',
      'Trạng Thái Đối Soát',
    ];

    const rows = data.map((d, idx) => [
      idx + 1,
      d.supplierCode,
      d.supplierName,
      d.totalInvoicesCount,
      d.totalReportedWeight,
      d.totalActualWeight,
      d.totalWeightDiff,
      d.totalReportedAmount,
      d.totalShortageDeduction,
      d.finalPayableDebt,
      d.disputeStatus === 'LECH_CAN_THIEU' ? '⚠️ CÂN THIẾU (ĐÃ TRỪ TIỀN)' : '✓ ĐỦ KHỐI LƯỢNG',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'CongNo_NCC_CuoiThang');
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });

    return new Blob([wbout], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  },
};
