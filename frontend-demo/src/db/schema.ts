import Dexie, { Table } from 'dexie';

export class SenVietDemoDatabase extends Dexie {
  users!: Table<any, number>;
  branches!: Table<any, number>;
  items!: Table<any, number>;
  recipes!: Table<any, number>;
  batches!: Table<any, number>;
  damageReports!: Table<any, number>;
  lineLogs!: Table<any, number>;
  inventoryLots!: Table<any, number>;
  suppliers!: Table<any, number>;
  warehouseDocuments!: Table<any, number>;
  inventoryChecks!: Table<any, number>;
  attendances!: Table<any, number>;
  examQuestions!: Table<any, number>;
  examSubmissions!: Table<any, number>;
  salaryAdvances!: Table<any, number>;
  payrollRecords!: Table<any, number>;
  payrollPeriods!: Table<any, number>;
  salaryIncreaseProposals!: Table<any, number>;
  uniformItems!: Table<any, number>;
  uniformAllocations!: Table<any, number>;
  resignationRequests!: Table<any, number>;
  reconciliations!: Table<any, number>;
  takeOutLogs!: Table<any, number>;
  dailyRemaining!: Table<any, number>;
  dailyMeals!: Table<any, number>;
  debtAdjustments!: Table<any, number>;
  reconciliationPeriods!: Table<any, number>;

  constructor() {
    super('SenVietBuffetDemoDB');
    this.version(1).stores({
      users: '++id, username, role, branchId, bankAccount, bankName',
      branches: '++id, code, name',
      items: '++id, itemCode, barcode, itemName, category, costGroup, branchId',
      recipes: '++id, itemId, itemCode',
      batches: '++id, batchCode, branchId, itemId, status, startedAt',
      damageReports: '++id, branchId, itemId, approvalStatus, status, createdAt',
      lineLogs: '++id, branchId, itemId, createdAt',
      inventoryLots: '++id, batchCode, branchId, itemId, supplierId, expiryDate',
      suppliers: '++id, supplierCode, supplierName, branchId',
      warehouseDocuments: '++id, docCode, docType, branchId, createdAt',
      inventoryChecks: '++id, checkCode, branchId, checkDate',
      attendances: '++id, userId, branchId, attendanceDate, date, isValidLocation, warningLocation',
      examQuestions: '++id, position, type',
      examSubmissions: '++id, userId, branchId, examId, status',
      salaryAdvances: '++id, userId, status, month, deductionMonth',
      payrollRecords: '++id, userId, month, isLocked, bankAccount, bankName',
      payrollPeriods: '++id, periodMonth, branchId, status',
      salaryIncreaseProposals: '++id, branchId, status',
      uniformItems: '++id, itemCode',
      uniformAllocations: '++id, userId, status, isReturned',
      resignationRequests: '++id, userId, branchId, status',
      reconciliations: '++id, branchId, reconDate, date, hasWarning, isOverThreshold',
      takeOutLogs: '++id, itemId, createdAt',
      dailyRemaining: '++id, itemId, branchId',
      dailyMeals: '++id, branchId, branchCode, date, day',
      debtAdjustments: '++id, supplierId, branchCode, periodId, status, createdAt',
      reconciliationPeriods: '++id, supplierId, branchCode, status, periodStartDate, periodEndDate',
    });
  }
}

export const db = new SenVietDemoDatabase();
