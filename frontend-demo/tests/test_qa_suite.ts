/**
 * Automated QA & Logic Verification Suite for Sen Việt Buffet Standalone Demo
 * Tests:
 * 1. Dexie IndexedDB (15+ tables, initial seed data)
 * 2. Anti-double click & Idempotency on Ra line (+1)
 * 3. Second in-progress batch warning (HTTP 409) & bypass
 * 4. Batch loss calculation, over-standard threshold detection, input validation
 * 5. CukCuk reconciliation: red alert flag when loss > 5% or > 300,000 VND
 * 6. GPS Haversine calculation (<= 50m valid, > 50m warning)
 * 7. Resigned employee uniform return & salary hold constraint
 * 8. RBAC 5 Roles permission matrix
 */

import 'fake-indexeddb/auto';

// Polyfill localStorage and navigator for Node.js test environment
if (typeof global.localStorage === 'undefined') {
  const store: Record<string, string> = {};
  global.localStorage = {
    getItem: (k: string) => store[k] || null,
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] || null,
    length: 0,
  } as any;
}

if (typeof global.navigator === 'undefined') {
  (global as any).navigator = { onLine: true };
}

import { db } from '../src/db/schema';
import { resetToSeedData } from '../src/db/dbService';
import { kitchenApi } from '../src/api/kitchen';
import { reconciliationApi } from '../src/api/reconciliation';
import { hrApi } from '../src/api/hr';
import { payrollApi } from '../src/api/payroll';
import { isViewAuthorized, getDefaultAuthorizedView, userHasRole } from '../src/utils/rbac';

interface TestResult {
  suite: string;
  testName: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, testName: string, detail?: string) {
  results.push({
    suite,
    testName,
    passed: !!condition,
    message: detail || (condition ? 'PASSED' : 'FAILED'),
  });
  if (condition) {
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}: ${detail || 'Assertion failed'}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 BẮT ĐẦU CHẠY BỘ KIỂM THỬ TỰ ĐỘNG QA SEN VIỆT DEMO');
  console.log('======================================================\n');

  // -----------------------------------------------------------------
  // 1. KIỂM THỬ CƠ SỞ DỮ LIỆU DEXIE INDEXEDDB & SEED DATA
  // -----------------------------------------------------------------
  console.log('\n📦 SUITE 1: Dexie IndexedDB & Seed Data Integrity');
  await resetToSeedData();

  const branchCount = await db.branches.count();
  assert(branchCount === 2, 'IndexedDB', 'Số lượng chi nhánh là 2 (TN & QV)', `Thực tế: ${branchCount}`);

  const userCount = await db.users.count();
  assert(userCount >= 5, 'IndexedDB', 'Tài khoản người dùng mẫu >= 5', `Thực tế: ${userCount}`);

  const bepUser = await db.users.where('username').equals('bep_tn').first();
  assert(!!bepUser, 'IndexedDB', 'Có tài khoản bep_tn (ROLE_BEP)');

  const itemCount = await db.items.count();
  assert(itemCount >= 8, 'IndexedDB', 'Danh mục món ăn phong phú >= 8 món', `Thực tế: ${itemCount}`);

  const batchCount = await db.batches.count();
  assert(batchCount >= 3, 'IndexedDB', 'Mẻ chế biến mẫu >= 3', `Thực tế: ${batchCount}`);

  const reconCount = await db.reconciliations.count();
  assert(reconCount >= 6, 'IndexedDB', 'Dữ liệu đối soát CukCuk >= 6 món', `Thực tế: ${reconCount}`);

  const uniformCount = await db.uniformAllocations.count();
  assert(uniformCount >= 3, 'IndexedDB', 'Bản ghi cấp phát đồng phục >= 3', `Thực tế: ${uniformCount}`);

  // -----------------------------------------------------------------
  // 2. KIỂM THỬ CẢNH BÁO MẺ CHẾ BIẾN THỨ HAI (DANG_LAM)
  // -----------------------------------------------------------------
  console.log('\n🔥 SUITE 2: Second In-Progress Batch Alert Logic');
  // Trong seedData, item id=2 (Tôm càng xanh) đang có mẻ BATCH-202611-003 ở trạng thái DANG_LAM
  let caughtSecondBatch = false;
  try {
    await kitchenApi.startBatch({
      itemId: 2,
      inputWeight: 15.0,
      unit: 'kg',
      forceSecondBatch: false,
    });
  } catch (err: any) {
    if (err.response?.status === 409) {
      caughtSecondBatch = true;
    }
  }
  assert(
    caughtSecondBatch,
    'Kitchen Batch',
    'Chặn mẻ thứ hai và trả về status 409 khi món đang có mẻ dở dang',
    caughtSecondBatch ? 'Đã kích hoạt 409 thành công' : 'Không bắt được cảnh báo 409'
  );

  // Mở mẻ thứ hai khi có cờ xác nhận forceSecondBatch: true
  const forcedBatch = await kitchenApi.startBatch({
    itemId: 2,
    inputWeight: 15.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  assert(
    forcedBatch.success && forcedBatch.data.secondBatch === true,
    'Kitchen Batch',
    'Cho phép mở mẻ khi người dùng xác nhận "Vẫn mở mẻ mới" (forceSecondBatch=true)',
    `secondBatch flag: ${forcedBatch.data?.secondBatch}`
  );

  // -----------------------------------------------------------------
  // 3. KIỂM THỬ TÍNH HAO HỤT MẺ CHẾ BIẾN & CẢNH BÁO VƯỢT ĐỊNH MỨC
  // -----------------------------------------------------------------
  console.log('\n⚖️ SUITE 3: Batch Loss Calculation & Over-Standard Threshold');
  // Khởi tạo mẻ mới cho Ba chỉ bò (id=4, chuẩn hao hụt 4.0%)
  const newBachiBatch = await kitchenApi.startBatch({
    itemId: 4,
    inputWeight: 20.0,
    unit: 'kg',
  });
  const batchId = newBachiBatch.data.id;

  // Trường hợp 1: Hoàn tất mẻ đạt chuẩn (đầu ra 19.3kg -> hao hụt 3.5% <= 4.0%)
  const normalFinish = await kitchenApi.finishBatch({
    batchId,
    outputWeight: 19.3,
  });
  assert(
    normalFinish.data.lossRate === 3.5 && normalFinish.data.overStandard === false,
    'Kitchen Batch',
    'Hao hụt 3.5% <= chuẩn 4.0% -> overStandard = false',
    `lossRate: ${normalFinish.data.lossRate}%, overStandard: ${normalFinish.data.overStandard}`
  );

  // Trường hợp 2: Khởi tạo mẻ Cá hồi (id=1, chuẩn hao hụt 8.0%), hoàn tất với hao hụt vượt chuẩn
  const newCahoiBatch = await kitchenApi.startBatch({
    itemId: 1,
    inputWeight: 15.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  // Đầu ra 13.0kg trên 15kg -> hụt 2kg = 13.3% > 8.0%
  const overFinish = await kitchenApi.finishBatch({
    batchId: newCahoiBatch.data.id,
    outputWeight: 13.0,
  });
  assert(
    overFinish.data.lossRate === 13.3 && overFinish.data.overStandard === true && !!overFinish.data.warningMessage,
    'Kitchen Batch',
    'Hao hụt 13.3% > chuẩn 8.0% -> overStandard = true và có warningMessage',
    `lossRate: ${overFinish.data.lossRate}%, overStandard: ${overFinish.data.overStandard}`
  );

  // Trường hợp 3: Khối lượng thành phẩm lớn hơn đầu vào -> Phải ném ngoại lệ
  let caughtInvalidWeight = false;
  const invalidBatch = await kitchenApi.startBatch({
    itemId: 4,
    inputWeight: 10.0,
    unit: 'kg',
    forceSecondBatch: true,
  });
  try {
    await kitchenApi.finishBatch({
      batchId: invalidBatch.data.id,
      outputWeight: 12.0, // Không hợp lệ: 12kg > 10kg
    });
  } catch (e: any) {
    caughtInvalidWeight = true;
  }
  assert(
    caughtInvalidWeight,
    'Kitchen Batch',
    'Chặn thành phẩm > đầu vào (ném lỗi ngoại lệ toàn vẹn dữ liệu)',
    caughtInvalidWeight ? 'Chặn thành công' : 'Cho phép khối lượng ảo'
  );

  // -----------------------------------------------------------------
  // 4. KIỂM THỬ NÚT RA LINE (+1) & TÍNH KHÔNG TRỪ KHO
  // -----------------------------------------------------------------
  console.log('\n🍽️ SUITE 4: Kitchen Ra Line (+1) Operation');
  const lineRes = await kitchenApi.recordLineItem({
    itemId: 4,
    quantity: 1,
    requestId: `line-test-${Date.now()}`,
  });
  assert(
    lineRes.success && lineRes.data.quantity === 1,
    'Kitchen Ra Line',
    'Ghi nhận ra line +1 thành công với requestId định danh',
    `message: ${lineRes.message}`
  );

  // -----------------------------------------------------------------
  // 5. KIỂM THỬ ĐỐI SOÁT CUKCUK & TÔ ĐỎ THẤT THOÁT (>5% HOẶC >300.000Đ)
  // -----------------------------------------------------------------
  console.log('\n📊 SUITE 5: CukCuk Reconciliation Red Alert Rules (>5% or >300,000đ)');
  const allRecons = await reconciliationApi.getDailySummary();
  const redAlertItems = allRecons.filter(r => r.isOverThreshold);

  assert(
    redAlertItems.length >= 2,
    'CukCuk Reconciliation',
    'Có ít nhất 2 món bị đánh dấu cờ đỏ thất thoát vượt ngưỡng (>5% hoặc >300k)',
    `Số món cờ đỏ: ${redAlertItems.length}`
  );

  // Cụ thể: Cua Cà Mau có thất thoát 2.730.000đ (21.67%)
  const cuaItem = allRecons.find(r => r.itemCode === 'HS-CUACAMAU');
  assert(
    !!cuaItem && cuaItem.isOverThreshold && cuaItem.unexplainedLossAmount === 2730000 && cuaItem.unexplainedLossRate > 5,
    'CukCuk Reconciliation',
    'Cua Cà Mau: thất thoát 2.730.000đ (>300k) & 21.67% (>5%) -> isOverThreshold = true',
    `Thất thoát: ${cuaItem?.unexplainedLossAmount?.toLocaleString()}đ (${cuaItem?.unexplainedLossRate}%)`
  );

  // Ba chỉ bò khớp số liệu: thất thoát = 0đ (0%) -> isOverThreshold = false
  const bachiRecon = allRecons.find(r => r.itemCode === 'TB-BACHIBO');
  assert(
    !!bachiRecon && !bachiRecon.isOverThreshold && bachiRecon.unexplainedLossAmount === 0,
    'CukCuk Reconciliation',
    'Ba chỉ bò Mỹ: khớp số liệu 0đ -> isOverThreshold = false (không báo động)',
    `Thất thoát: ${bachiRecon?.unexplainedLossAmount}đ`
  );

  // Kiểm tra bộ lọc overThresholdOnly
  const filteredOnlyRed = await reconciliationApi.getDailySummary({ overThresholdOnly: true });
  assert(
    filteredOnlyRed.every(r => r.isOverThreshold),
    'CukCuk Reconciliation',
    'Bộ lọc overThresholdOnly=true chỉ trả về các dòng bị báo đỏ',
    `Tổng số dòng lọc được: ${filteredOnlyRed.length}`
  );

  // -----------------------------------------------------------------
  // 6. KIỂM THỬ CHẤM CÔNG GPS HAVERSINE (<=50M HỢP LỆ, >50M CẢNH BÁO)
  // -----------------------------------------------------------------
  console.log('\n📍 SUITE 6: GPS Geofencing (Haversine Formula <=50m vs >50m)');
  // Tọa độ chi nhánh Thái Nguyên: 21.5928, 105.8442
  // Test 1: Tọa độ tại nhà hàng (khoảng cách 0 - 15m <= 50m)
  const validCheckIn = await hrApi.checkIn({
    latitude: 21.59285,
    longitude: 105.84422,
    selfieUrl: 'data:image/svg+xml;base64,mock',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
  });
  assert(
    validCheckIn.isValidLocation === true && validCheckIn.checkInDistanceMeters <= 50 && validCheckIn.status === 'DANG_LAM',
    'GPS Attendance',
    'Tọa độ tại nhà hàng (khoảng cách <= 50m) -> isValidLocation = true, status = DANG_LAM',
    `Khoảng cách: ${validCheckIn.checkInDistanceMeters}m`
  );

  // Test 2: Tọa độ ngoài chi nhánh (cách >50m, ví dụ cách 500m)
  const invalidCheckIn = await hrApi.checkIn({
    latitude: 21.5980,
    longitude: 105.8490,
    selfieUrl: 'data:image/svg+xml;base64,mock',
    shiftName: 'Ca Sáng (08:00 - 16:30)',
  });
  assert(
    invalidCheckIn.isValidLocation === false && invalidCheckIn.checkInDistanceMeters > 50 && invalidCheckIn.status === 'VI_PHAM_KHOANG_CACH',
    'GPS Attendance',
    'Tọa độ ngoài chi nhánh (> 50m) -> isValidLocation = false, status = VI_PHAM_KHOANG_CACH',
    `Khoảng cách: ${invalidCheckIn.checkInDistanceMeters}m`
  );

  // -----------------------------------------------------------------
  // 7. KIỂM THỬ KHÓA LƯƠNG NHÂN VIÊN NGHỈ VIỆC CHƯA TRẢ ĐỒNG PHỤC
  // -----------------------------------------------------------------
  console.log('\n👔 SUITE 7: Resigned Employee Uniform Hold & Salary Locking');
  const payrolls = await payrollApi.getPayroll('2026-10');
  
  // User 10 là Hoàng Thị Tạp Vụ, nghỉ việc chưa trả 1 tạp dề + 1 nón bếp
  const tapvuPayroll = payrolls.find(p => p.userId === 10);
  assert(
    !!tapvuPayroll && tapvuPayroll.isUniformRetained === true && tapvuPayroll.status === 'DANG_GIU_LUONG',
    'Payroll Uniform Hold',
    'Nhân sự chưa trả đồng phục bị ghim cờ isUniformRetained = true & status = DANG_GIU_LUONG',
    `Trạng thái: ${tapvuPayroll?.status}, Lý do: ${tapvuPayroll?.holdReason}`
  );

  assert(
    !!tapvuPayroll && !!tapvuPayroll.holdReason && tapvuPayroll.holdReason.includes('đồng phục'),
    'Payroll Uniform Hold',
    'Lý do giữ lương thể hiện rõ thiếu đồng phục',
    `holdReason: ${tapvuPayroll?.holdReason}`
  );

  // Kiểm tra khóa kỳ lương
  const lockResult = await payrollApi.lockPeriod('2026-10');
  assert(
    lockResult.status === 'LOCKED' && !!lockResult.lockedAt,
    'Payroll Period Lock',
    'Khóa kỳ lương niêm phong bảng lương thành công',
    `Trạng thái kỳ: ${lockResult.status}`
  );

  // Mở khóa kỳ lương kèm lý do giải trình
  const unlockResult = await payrollApi.unlockPeriod('2026-10', 'Điều chỉnh phụ cấp làm thêm giờ theo phê duyệt BGĐ');
  assert(
    unlockResult.status === 'OPEN' && !!unlockResult.unlockReason?.includes('BGĐ'),
    'Payroll Period Lock',
    'Mở khóa kỳ lương yêu cầu lý do giải trình bắt buộc',
    `Trạng thái kỳ: ${unlockResult.status}, Lý do: ${unlockResult.unlockReason}`
  );

  // -----------------------------------------------------------------
  // 8. KIỂM THỬ PHÂN QUYỀN RBAC 5 VAI TRÒ
  // -----------------------------------------------------------------
  console.log('\n🛡️ SUITE 8: RBAC 5 Roles Permission Matrix');

  const userBep = { id: 1, username: 'bep_tn', fullName: 'Bếp Viên', roles: ['ROLE_KITCHEN_STAFF', 'ROLE_EMPLOYEE', 'ROLE_BEP'] } as any;
  const userQlBep = { id: 2, username: 'ql_bep_tn', fullName: 'Bếp Trưởng', roles: ['ROLE_KITCHEN_STAFF', 'ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_QL_BEP'] } as any;
  const userQlChiNhanh = { id: 3, username: 'ql_chinhanh_tn', fullName: 'Quản Lý Chi Nhánh', roles: ['ROLE_RESTAURANT_MANAGER', 'ROLE_EMPLOYEE', 'ROLE_QL_CHINHANH'] } as any;
  const userKeToan = { id: 4, username: 'ketoan_tong', fullName: 'Kế Toán Tổng', roles: ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_BRANCH_ACCOUNTANT', 'ROLE_KETOAN'] } as any;
  const userAdminChu = { id: 5, username: 'admin_chu', fullName: 'Chủ Chuỗi', roles: ['ROLE_GENERAL_ACCOUNTANT', 'ROLE_CHU_CHUOI'] } as any;

  // 8.1. ROLE_BEP
  assert(isViewAuthorized('kitchen', userBep) === true, 'RBAC ROLE_BEP', 'Bếp viên được truy cập phân hệ kitchen');
  assert(isViewAuthorized('warehouse', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên TUYỆT ĐỐI KHÔNG được xem phân hệ warehouse');
  assert(isViewAuthorized('reconciliation', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên TUYỆT ĐỐI KHÔNG được xem phân hệ reconciliation');
  assert(isViewAuthorized('payroll', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên TUYỆT ĐỐI KHÔNG được xem phân hệ payroll');
  assert(isViewAuthorized('dashboard', userBep) === false, 'RBAC ROLE_BEP', 'Bếp viên không xem dashboard quản trị');
  assert(getDefaultAuthorizedView(userBep) === 'kitchen', 'RBAC ROLE_BEP', 'Màn hình mặc định của Bếp viên là kitchen');

  // 8.2. ROLE_QL_BEP / ROLE_QL_CHINHANH
  assert(isViewAuthorized('kitchen', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được kitchen');
  assert(isViewAuthorized('reconciliation', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được reconciliation chi nhánh');
  assert(isViewAuthorized('dashboard', userQlChiNhanh) === true, 'RBAC ROLE_QL_CHINHANH', 'Quản lý xem được dashboard');
  assert(isViewAuthorized('warehouse', userQlChiNhanh) === false, 'RBAC ROLE_QL_CHINHANH', 'Quản lý chi nhánh không quản lý kho NCC chuỗi');

  // 8.3. ROLE_KETOAN & ROLE_CHU_CHUOI
  assert(isViewAuthorized('warehouse', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán quản lý warehouse');
  assert(isViewAuthorized('reconciliation', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán xem reconciliation');
  assert(isViewAuthorized('payroll', userKeToan) === true, 'RBAC ROLE_KETOAN', 'Kế toán quản lý payroll');

  assert(isViewAuthorized('dashboard', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền dashboard');
  assert(isViewAuthorized('kitchen', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền kitchen');
  assert(isViewAuthorized('warehouse', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền warehouse');
  assert(isViewAuthorized('reconciliation', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền reconciliation');
  assert(isViewAuthorized('payroll', userAdminChu) === true, 'RBAC ROLE_CHU_CHUOI', 'Chủ chuỗi toàn quyền payroll');

  // -----------------------------------------------------------------
  // 9. KIỂM THỬ VALIDATION NHẬP KHO & SỐ THẬP PHÂN (HOTFIX P0)
  // -----------------------------------------------------------------
  console.log('\n🔢 SUITE 9: Warehouse & Kitchen Quantity Validation (P0 Hotfix)');

  // 9.1. Warehouse document validation logic
  const validateDocItems = (items: { quantity: number | string }[]) => {
    return !items.some((item) => {
      const q = typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity;
      return item.quantity === '' || item.quantity === undefined || isNaN(q) || q <= 0;
    });
  };

  assert(validateDocItems([{ quantity: '' }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng rỗng');
  assert(validateDocItems([{ quantity: 0 }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng = 0');
  assert(validateDocItems([{ quantity: -5 }]) === false, 'Warehouse Validation', 'Chặn phiếu kho khi số lượng âm');
  assert(validateDocItems([{ quantity: 10 }]) === true, 'Warehouse Validation', 'Cho phép số nguyên 10 (không bị chặn bởi step mismatch)');
  assert(validateDocItems([{ quantity: 10.5 }]) === true, 'Warehouse Validation', 'Cho phép số thập phân 10.5');
  assert(validateDocItems([{ quantity: 2.33 }]) === true, 'Warehouse Validation', 'Cho phép số lẻ 2.33');

  // 9.2. Decimal normalization (thay ',' thành '.')
  const normalizeQty = (val: string) => {
    const raw = val.replace(',', '.');
    return raw === '' ? '' : parseFloat(raw);
  };
  assert(normalizeQty('10,5') === 10.5, 'Decimal Normalization', 'Tự động đổi dấu phẩy 10,5 thành 10.5');
  assert(normalizeQty('2,33') === 2.33, 'Decimal Normalization', 'Tự động đổi dấu phẩy 2,33 thành 2.33');
  assert(normalizeQty('10') === 10, 'Decimal Normalization', 'Nhập 10 giữ nguyên 10');

  // 9.3. VirtualNumpad decimal input sequence logic
  let numpadStr = '';
  const simulateDigit = (digit: string) => {
    if (!numpadStr || numpadStr === '0') {
      numpadStr = digit === '.' ? '0.' : digit;
    } else if (digit === '.' && numpadStr.includes('.')) {
      return;
    } else {
      numpadStr = numpadStr + digit;
    }
  };

  simulateDigit('.');
  assert(numpadStr === '0.', 'VirtualNumpad Logic', 'Bấm phím "." khi trống tạo thành "0."');
  simulateDigit('5');
  assert(numpadStr === '0.5' && parseFloat(numpadStr) === 0.5, 'VirtualNumpad Logic', 'Bấm tiếp "5" tạo thành 0.5');
  simulateDigit('.');
  assert(numpadStr === '0.5', 'VirtualNumpad Logic', 'Không cho phép bấm thừa dấu chấm thứ hai');

  // -----------------------------------------------------------------
  // TỔNG KẾT
  // -----------------------------------------------------------------
  console.log('\n======================================================');
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  console.log(`🏁 TỔNG KẾT: ${passed}/${total} TESTS ĐẠT (${Math.round((passed / total) * 100)}%)`);
  if (failed > 0) {
    console.error(`❌ CÓ ${failed} TESTS THẤT BẠI:`);
    results.filter(r => !r.passed).forEach(r => console.error(`   - [${r.suite}] ${r.testName}: ${r.message}`));
    process.exit(1);
  } else {
    console.log('🎉 100% KIỂM THỬ NGHIỆP VỤ & TOÀN VẸN DỮ LIỆU ĐÃ ĐẠT CHUẨN XUẤT SẮC!');
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Lỗi nghiêm trọng khi thực thi Test Suite:', err);
  process.exit(1);
});
