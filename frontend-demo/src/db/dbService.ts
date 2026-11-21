import { db } from './schema';
import {
  SEED_BRANCHES,
  SEED_USERS,
  SEED_SUPPLIERS,
  SEED_ITEMS,
  SEED_RECIPES,
  SEED_BATCHES,
  SEED_DAMAGE_REPORTS,
  SEED_LINE_LOGS,
  SEED_TAKE_OUT_LOGS,
  SEED_INVENTORY_LOTS,
  SEED_WAREHOUSE_DOCUMENTS,
  SEED_INVENTORY_CHECKS,
  SEED_RECONCILIATIONS,
  SEED_ATTENDANCES,
  SEED_EXAM_QUESTIONS,
  SEED_EXAM_SUBMISSIONS,
  SEED_UNIFORM_ITEMS,
  SEED_UNIFORM_ALLOCATIONS,
  SEED_RESIGNATIONS,
  SEED_SALARY_ADVANCES,
  SEED_PAYROLL_PERIODS,
  SEED_PAYROLLS,
  SEED_INCREASE_PROPOSALS,
  SEED_DAILY_REMAINING,
  SEED_DAILY_MEALS,
  SEED_RECONCILIATION_PERIODS,
  SEED_DEBT_ADJUSTMENTS,
} from './seedData';

/**
 * Phiên bản dữ liệu mẫu (Cập nhật phiên bản sẽ kích hoạt tự động reset IndexedDB đồng bộ)
 */
export const SEED_DATA_VERSION = 'v2026_11_20_t11_complete_v6';

let memorySeedVersion: string | null = null;

function getStoredVersion(): string | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      return localStorage.getItem('senviet_seed_data_version');
    } catch {
      return memorySeedVersion;
    }
  }
  return memorySeedVersion;
}

function setStoredVersion(version: string): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem('senviet_seed_data_version', version);
    } catch {}
  }
  memorySeedVersion = version;
}

/**
 * Giả lập độ trễ mạng thực tế (100 - 150ms) để giữ trọn vẹn trải nghiệm loading/spinner cho UI
 */
export async function simulateLatency(min = 100, max = 150): Promise<void> {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Nạp dữ liệu mẫu vào IndexedDB nếu database trống hoặc có phiên bản seed data mới
 */
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  try {
    const storedVersion = getStoredVersion();
    const userCount = await db.users.count();

    // Nếu database trống HOẶC phiên bản seed data cũ -> Tự động nạp lại dữ liệu mẫu mới
    if (userCount === 0 || storedVersion !== SEED_DATA_VERSION) {
      console.log(
        `[Dexie DB] Phát hiện phiên bản seed mới (${SEED_DATA_VERSION}), khởi tạo lại dữ liệu mẫu...`
      );
      await resetToSeedData();
      setStoredVersion(SEED_DATA_VERSION);
      console.log('[Dexie DB] Khởi tạo thành công 100% dữ liệu mẫu mới!');
      return true;
    }

    return false;
  } catch (error) {
    console.error('[Dexie DB] Lỗi khởi tạo database nhúng:', error);
    return false;
  }
}

/**
 * Đặt lại (Reset) 1-Click toàn bộ cơ sở dữ liệu về trạng thái ban đầu của Sen Việt Buffet
 */
export async function resetToSeedData(): Promise<void> {
  console.log('[Dexie DB] Đang xóa dữ liệu cũ và nạp lại Seed Data...');
  await db.transaction(
    'rw',
    [
      db.branches,
      db.users,
      db.suppliers,
      db.items,
      db.recipes,
      db.batches,
      db.damageReports,
      db.lineLogs,
      db.takeOutLogs,
      db.inventoryLots,
      db.warehouseDocuments,
      db.inventoryChecks,
      db.reconciliations,
      db.attendances,
      db.examQuestions,
      db.examSubmissions,
      db.uniformItems,
      db.uniformAllocations,
      db.resignationRequests,
      db.salaryAdvances,
      db.payrollPeriods,
      db.payrollRecords,
      db.salaryIncreaseProposals,
      db.dailyRemaining,
      db.dailyMeals,
      db.debtAdjustments,
      db.reconciliationPeriods,
    ],
    async () => {
      await db.branches.clear();
      await db.users.clear();
      await db.suppliers.clear();
      await db.items.clear();
      await db.recipes.clear();
      await db.batches.clear();
      await db.damageReports.clear();
      await db.lineLogs.clear();
      await db.takeOutLogs.clear();
      await db.inventoryLots.clear();
      await db.warehouseDocuments.clear();
      await db.inventoryChecks.clear();
      await db.reconciliations.clear();
      await db.attendances.clear();
      await db.examQuestions.clear();
      await db.examSubmissions.clear();
      await db.uniformItems.clear();
      await db.uniformAllocations.clear();
      await db.resignationRequests.clear();
      await db.salaryAdvances.clear();
      await db.payrollPeriods.clear();
      await db.payrollRecords.clear();
      await db.salaryIncreaseProposals.clear();
      await db.dailyRemaining.clear();
      await db.dailyMeals.clear();
      await db.debtAdjustments.clear();
      await db.reconciliationPeriods.clear();

      await populateAllSeedData();
    }
  );
  setStoredVersion(SEED_DATA_VERSION);
  console.log('[Dexie DB] Đã Reset dữ liệu thành công!');
}

async function populateAllSeedData(): Promise<void> {
  await db.branches.bulkAdd(SEED_BRANCHES);
  await db.users.bulkAdd(SEED_USERS);
  await db.suppliers.bulkAdd(SEED_SUPPLIERS);
  await db.items.bulkAdd(SEED_ITEMS);
  await db.recipes.bulkAdd(SEED_RECIPES);
  await db.batches.bulkAdd(SEED_BATCHES);
  await db.damageReports.bulkAdd(SEED_DAMAGE_REPORTS);
  await db.lineLogs.bulkAdd(SEED_LINE_LOGS);
  await db.takeOutLogs.bulkAdd(SEED_TAKE_OUT_LOGS);
  await db.inventoryLots.bulkAdd(SEED_INVENTORY_LOTS);
  await db.warehouseDocuments.bulkAdd(SEED_WAREHOUSE_DOCUMENTS);
  await db.inventoryChecks.bulkAdd(SEED_INVENTORY_CHECKS);
  await db.reconciliations.bulkAdd(SEED_RECONCILIATIONS);
  await db.attendances.bulkAdd(SEED_ATTENDANCES);
  await db.examQuestions.bulkAdd(SEED_EXAM_QUESTIONS);
  await db.examSubmissions.bulkAdd(SEED_EXAM_SUBMISSIONS);
  await db.uniformItems.bulkAdd(SEED_UNIFORM_ITEMS);
  await db.uniformAllocations.bulkAdd(SEED_UNIFORM_ALLOCATIONS);
  await db.resignationRequests.bulkAdd(SEED_RESIGNATIONS);
  await db.salaryAdvances.bulkAdd(SEED_SALARY_ADVANCES);
  await db.payrollPeriods.bulkAdd(SEED_PAYROLL_PERIODS);
  await db.payrollRecords.bulkAdd(SEED_PAYROLLS);
  await db.salaryIncreaseProposals.bulkAdd(SEED_INCREASE_PROPOSALS);
  await db.dailyRemaining.bulkAdd(SEED_DAILY_REMAINING);
  await db.dailyMeals.bulkAdd(SEED_DAILY_MEALS);
  await db.debtAdjustments.bulkAdd(SEED_DEBT_ADJUSTMENTS);
  await db.reconciliationPeriods.bulkAdd(SEED_RECONCILIATION_PERIODS);
}
