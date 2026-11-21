import { db } from '../db/schema';
import { simulateLatency, initializeDatabaseIfEmpty } from '../db/dbService';

export interface Item {
  id: number;
  itemCode: string;
  barcode: string;
  itemName: string;
  category: string;
  unit: string;
  costPrice: number;
  isBuffetLine: boolean;
  isDailyOnly?: boolean;
  branchId?: number;
  storage?: string;
  minStock?: number;
  maxStock?: number;
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
  itemId?: number;
  item: Item;
  quantity: number;
  unit: string;
  note?: string;
  isCancelled?: boolean;
  status?: 'ACTIVE' | 'CANCELLED';
  cancelledAt?: string;
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
  approvedBy?: string;
  approvedAt?: string;
  rejectedReason?: string;
  createdAt: string;
}

export interface DailyRemainingItem {
  id: number;
  itemId?: number;
  itemCode: string;
  itemName: string;
  category: string;
  unit: string;
  remainingStock: number;
  suggestedWasteQty?: number;
  isDailyOnly?: boolean;
}

export interface ConfirmDailyWasteRequest {
  shift: string;
  wasteDate?: string;
  note?: string;
  items: {
    itemId: number;
    quantity: number;
    unit: string;
    note?: string;
  }[];
}

export interface QuickAddLineItemRequest {
  itemName: string;
  category: string;
  unit: string;
  costPrice?: number;
  isDailyOnly?: boolean;
}

export const kitchenApi = {
  // Lấy danh sách món quầy buffet
  getBuffetItems: async (): Promise<Item[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const items = await db.items.toArray();
    return items.filter((i) => i.isBuffetLine);
  },

  // Tìm kiếm theo mã hoặc barcode
  searchItems: async (code?: string): Promise<Item[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const all = await db.items.toArray();
    if (!code || !code.trim()) return all;
    const q = code.trim().toLowerCase();
    return all.filter(
      (i) =>
        i.itemCode.toLowerCase().includes(q) ||
        i.barcode.includes(q) ||
        i.itemName.toLowerCase().includes(q)
    );
  },

  // Lấy danh sách công thức & định mức hao hụt chuẩn
  getRecipes: async (): Promise<Recipe[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.recipes.toArray();
  },

  // Nút 1: Lấy hàng từ kho
  recordTakeOut: async (data: { itemId: number; quantity: number; unit: string; note?: string }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 150);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy nguyên liệu');

    const newLog: TakeOutLog = {
      id: Date.now(),
      item,
      quantity: data.quantity,
      unit: data.unit,
      note: data.note,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19),
    };

    await db.takeOutLogs.add(newLog);

    // Trừ kho trong lô hàng gần nhất nếu có
    const lot = await db.inventoryLots.where('itemId').equals(data.itemId).first();
    if (lot && lot.currentStock !== undefined) {
      const newStock = Math.max(0, lot.currentStock - data.quantity);
      await db.inventoryLots.update(lot.id, { currentStock: newStock });
    }

    return {
      success: true,
      message: `Đã xuất kho ${data.quantity} ${data.unit} [${item.itemName}] thành công`,
      data: newLog,
    };
  },

  // Lấy lịch sử lấy hàng
  getTakeOutLogs: async (): Promise<TakeOutLog[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(60, 100);
    const logs = await db.takeOutLogs.toArray();
    return logs.reverse();
  },

  // Hủy thao tác lấy hàng (hoàn trả lại kho)
  cancelTakeOut: async (id: number) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);
    const log = await db.takeOutLogs.get(id);
    if (!log) throw new Error('Không tìm thấy bản ghi lấy hàng');
    if (log.isCancelled) throw new Error('Bản ghi lấy hàng này đã được hoàn trả trước đó');

    const itemId = log.item?.id || log.itemId;
    if (itemId) {
      const lot = await db.inventoryLots.where('itemId').equals(itemId).first();
      if (lot && lot.currentStock !== undefined) {
        await db.inventoryLots.update(lot.id, { currentStock: lot.currentStock + log.quantity });
      }
    }

    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated = {
      ...log,
      isCancelled: true,
      status: 'CANCELLED' as const,
      cancelledAt: now,
    };
    await db.takeOutLogs.put(updated);

    return {
      success: true,
      message: `Đã hủy thao tác lấy hàng và hoàn trả ${log.quantity} ${log.unit} vào kho`,
      data: updated,
    };
  },

  // Nút 2A: Khởi tạo mẻ chế biến
  startBatch: async (data: {
    itemId: number;
    inputWeight: number;
    unit: string;
    note?: string;
    forceSecondBatch?: boolean;
  }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy món ăn');

    // Kiểm tra xem món này có mẻ đang làm dở dang không
    const activeBatches = await db.batches
      .filter((b) => b.itemId === data.itemId && b.status === 'DANG_LAM')
      .toArray();

    if (activeBatches.length > 0 && !data.forceSecondBatch) {
      const err: any = new Error(
        `Món [${item.itemName}] đang có mẻ chưa hoàn tất cân thành phẩm. Bạn có chắc muốn mở thêm mẻ mới?`
      );
      err.response = {
        status: 409,
        data: {
          success: false,
          message: err.message,
          activeBatchCode: activeBatches[0].batchCode,
        },
      };
      throw err;
    }

    const recipe = await db.recipes.where('itemId').equals(data.itemId).first();
    const standardLossRate = recipe ? recipe.standardLossRate : 5.0;
    const now = new Date();
    const codeSuffix = Math.floor(Math.random() * 900) + 100;
    const batchCode = `BATCH-${now.toISOString().slice(0, 10).replace(/-/g, '')}-${codeSuffix}`;

    const newBatch: BatchResponse = {
      id: Date.now(),
      batchCode,
      itemId: item.id,
      itemName: item.itemName,
      itemCode: item.itemCode,
      inputWeight: data.inputWeight,
      outputWeight: null,
      lossRate: null,
      standardLossRate,
      overStandard: false,
      secondBatch: activeBatches.length > 0,
      status: 'DANG_LAM',
      startedBy: 'bep_tn',
      finishedBy: null,
      startedAt: now.toISOString().replace('T', ' ').slice(0, 19),
      finishedAt: null,
      warningMessage: null,
    };

    await db.batches.add(newBatch);

    return {
      success: true,
      message: `Đã khởi tạo mẻ [${batchCode}]`,
      data: newBatch,
    };
  },

  // Nút 2B: Hoàn thành cân mẻ thành phẩm
  finishBatch: async (data: { batchId: number; outputWeight: number }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const batch = await db.batches.get(data.batchId);
    if (!batch) throw new Error('Không tìm thấy mẻ chế biến');

    if (data.outputWeight > batch.inputWeight) {
      throw new Error('Khối lượng thành phẩm không thể vượt quá khối lượng nguyên liệu đầu vào');
    }

    const lossRate = Number(
      (((batch.inputWeight - data.outputWeight) / batch.inputWeight) * 100).toFixed(1)
    );
    const overStandard = lossRate > batch.standardLossRate;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const warningMessage = overStandard
      ? `⚠️ Hao hụt thực tế ${lossRate}% vượt quá định mức chuẩn ${batch.standardLossRate}% (+${(
          lossRate - batch.standardLossRate
        ).toFixed(1)}%)`
      : null;

    const updated = {
      ...batch,
      outputWeight: data.outputWeight,
      lossRate,
      overStandard,
      status: 'HOAN_THANH',
      finishedBy: 'bep_tn',
      finishedAt: now,
      warningMessage,
    };

    await db.batches.put(updated);

    return {
      success: true,
      message: `Đã hoàn tất cân mẻ. Hao hụt thực tế: ${lossRate}%`,
      data: updated,
    };
  },

  // Lấy danh sách các mẻ đang làm dở dang
  getActiveBatches: async (): Promise<BatchResponse[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.batches.filter((b) => b.status === 'DANG_LAM').toArray();
  },

  // Lấy lịch sử tất cả các mẻ
  getAllBatches: async (): Promise<BatchResponse[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);
    const batches = await db.batches.toArray();
    return batches.reverse();
  },

  // Nút 3: Ra line (+1)
  recordLineItem: async (data: { itemId: number; quantity?: number; requestId?: string }) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 140);

    const qty = data.quantity || 1;
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const log = {
      id: Date.now(),
      branchId: 1,
      itemId: data.itemId,
      quantity: qty,
      requestId: data.requestId,
      createdAt: now,
    };

    await db.lineLogs.add(log);

    return {
      success: true,
      message: `Đã ra line +${qty}`,
      data: log,
    };
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
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);

    const item = await db.items.get(data.itemId);
    if (!item) throw new Error('Không tìm thấy nguyên liệu báo hỏng');

    const estimatedValue = Math.round(data.quantity * (item.costPrice || 50000));
    // Tự động duyệt nếu giá trị <= 300.000 đ, ngược lại chờ Quản lý duyệt
    const status = estimatedValue <= 300000 ? 'TU_DONG_DUYET' : 'CHO_DUYET';
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const report: DamageReport = {
      id: Date.now(),
      item,
      supplierCode: data.supplierCode || 'NCC-HS01',
      batchNumber: data.batchNumber || 'LOT-202611-001',
      quantity: data.quantity,
      estimatedValue,
      reason: data.reason,
      imageUrls: data.imageUrls,
      status,
      note: data.note || (status === 'TU_DONG_DUYET' ? 'Tự động duyệt (< 300k đ)' : 'Chờ Quản lý duyệt'),
      createdAt: now,
    };

    await db.damageReports.add(report);

    return {
      success: true,
      message:
        status === 'TU_DONG_DUYET'
          ? `Đã báo hỏng thành công (Tự động duyệt - Thiệt hại: ${estimatedValue.toLocaleString('vi-VN')} đ)`
          : `Đã gửi báo hỏng (Chờ Quản lý Bếp duyệt - Thiệt hại: ${estimatedValue.toLocaleString('vi-VN')} đ)`,
      data: report,
    };
  },

  // Lấy danh sách báo hỏng
  getDamageReports: async (): Promise<DamageReport[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    const reports = await db.damageReports.toArray();
    return reports.reverse();
  },

  // Giai đoạn 8: Lấy danh sách món tươi dùng trong ngày còn tồn cuối ca
  getDailyOnlyRemaining: async (): Promise<DailyRemainingItem[]> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(80, 120);
    return await db.dailyRemaining.toArray();
  },

  // Giai đoạn 8: Xác nhận ghi bỏ món dùng trong ngày cuối ca
  confirmDailyWaste: async (data: ConfirmDailyWasteRequest) => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(120, 160);
    await db.dailyRemaining.clear();
    return {
      success: true,
      message: `Đã xác nhận ghi bỏ ${data.items.length} món dùng trong ngày cho ca ${data.shift}`,
    };
  },

  // Giai đoạn 8: Thêm nhanh món mới trên màn hình ra line
  quickAddLineItem: async (data: QuickAddLineItemRequest): Promise<Item> => {
    await initializeDatabaseIfEmpty();
    await simulateLatency(100, 150);

    const newItem: Item = {
      id: Date.now(),
      itemCode: `M-${Date.now().toString().slice(-4)}`,
      barcode: `893${Date.now().toString().slice(-9)}`,
      itemName: data.itemName,
      category: data.category,
      unit: data.unit,
      costPrice: data.costPrice || 50000,
      isBuffetLine: true,
      isDailyOnly: data.isDailyOnly || false,
    };

    await db.items.add(newItem);
    return newItem;
  },
};
