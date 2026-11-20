import React, { useState, useEffect, useRef } from 'react';
import {
  Package,
  Flame,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  Camera,
  RotateCw,
  Scale,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
  Salad,
  Plus,
  Trash2,
  ShieldAlert,
  Image as ImageIcon,
  Search,
  Check,
  Clock,
  Undo2,
  History,
  XCircle,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import {
  kitchenApi,
  Item,
  Recipe,
  BatchResponse,
  DailyRemainingItem,
  ConfirmDailyWasteRequest,
  QuickAddLineItemRequest,
  TakeOutLog,
  DamageReport,
} from '../../api/kitchen';
import { warehouseApi, ImportBatch } from '../../api/warehouse';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';

export type KitchenStation = 'ALL' | 'BEP_NONG' | 'BEP_LANH' | 'BAR' | 'RA_LINE';

interface VirtualNumpadProps {
  value: number;
  onChange: (val: number) => void;
  unit?: string;
  quickAddValues?: number[];
  max?: number;
}

/**
 * Numpad ảo kích thước lớn cho màn hình cảm ứng Kiosk / Tablet bếp.
 * Phím số to rõ, hỗ trợ găng tay làm việc và các nút cộng dồn định lượng nhanh.
 * Hỗ trợ dấu chấm '.' thập phân và gõ trực tiếp bàn phím cứng / cảm ứng.
 */
const VirtualNumpad: React.FC<VirtualNumpadProps> = ({
  value,
  onChange,
  unit = 'kg',
  quickAddValues = [1, 5, 10],
  max,
}) => {
  const [strVal, setStrVal] = useState<string>(value > 0 ? value.toString() : '');

  useEffect(() => {
    // Chỉ đồng bộ lại khi giá trị số khác biệt thực sự
    // Tránh xóa mất dấu chấm dở dang "0." hoặc "5." khi gõ
    const curNum = parseFloat(strVal);
    if ((isNaN(curNum) && value > 0) || (!isNaN(curNum) && curNum !== value)) {
      setStrVal(value > 0 ? value.toString() : '');
    }
  }, [value]);

  const handleDigit = (digit: string) => {
    let next: string;
    if (!strVal || strVal === '0') {
      next = digit === '.' ? '0.' : digit;
    } else if (digit === '.' && strVal.includes('.')) {
      return;
    } else {
      next = strVal + digit;
    }
    setStrVal(next);
    const num = parseFloat(next);
    if (!isNaN(num)) {
      if (max !== undefined && num > max) return;
      onChange(num);
    } else {
      onChange(0);
    }
  };

  const handleClear = () => {
    setStrVal('');
    onChange(0);
  };

  const handleBackspace = () => {
    const next = strVal.length > 1 ? strVal.slice(0, -1) : '';
    setStrVal(next);
    onChange(parseFloat(next) || 0);
  };

  const handleQuickAdd = (add: number) => {
    const cur = parseFloat(strVal) || 0;
    const nextNum = Math.round((cur + add) * 10) / 10;
    if (max !== undefined && nextNum > max) {
      onChange(max);
      setStrVal(max.toString());
    } else {
      onChange(nextNum);
      setStrVal(nextNum.toString());
    }
  };

  return (
    <div className="bg-slate-50 p-3 sm:p-4 rounded-2xl border border-slate-200 space-y-2.5">
      {/* Ô nhập trực tiếp hỗ trợ bàn phím cứng & chuyển đổi dấu phẩy ',' thành '.' */}
      <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">Số đang nhập:</span>
        <div className="flex items-baseline gap-1">
          <input
            type="text"
            inputMode="decimal"
            value={strVal}
            onChange={(e) => {
              const raw = e.target.value.replace(',', '.');
              if (raw === '' || /^[0-9]*\.?[0-9]*$/.test(raw)) {
                setStrVal(raw);
                const num = parseFloat(raw);
                if (!isNaN(num)) {
                  if (max !== undefined && num > max) return;
                  onChange(num);
                } else {
                  onChange(0);
                }
              }
            }}
            placeholder="0"
            className="w-32 text-right font-mono font-black text-2xl text-slate-900 bg-transparent focus:outline-none focus:border-b-2 focus:border-emerald-500"
          />
          <span className="font-extrabold text-slate-600 text-sm">{unit}</span>
        </div>
      </div>

      {/* Phím tắt định lượng nhanh */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">Cộng nhanh:</span>
        {quickAddValues.map((add) => (
          <button
            key={add}
            type="button"
            onClick={() => handleQuickAdd(add)}
            className="btn-touch px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 font-extrabold text-xs text-slate-800 shadow-sm active:scale-95 transition-transform"
          >
            +{add} {unit}
          </button>
        ))}
      </div>

      {/* Numpad 3x4 Grid lớn + Nút dấu chấm '.' và Xóa */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            onClick={() => handleDigit(digit)}
            className="btn-touch h-12 sm:h-14 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-900 shadow-sm active:scale-95 transition-transform"
          >
            {digit}
          </button>
        ))}
        <button
          type="button"
          onClick={() => handleDigit('.')}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-black text-2xl text-slate-900 shadow-sm active:scale-95"
        >
          .
        </button>
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 font-black text-xl text-slate-900 shadow-sm active:scale-95"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="btn-touch h-12 sm:h-14 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 font-black text-xs text-slate-700 shadow-sm active:scale-95"
        >
          ⌫ Xóa
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="col-span-3 btn-touch h-10 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 font-bold text-xs text-rose-700 shadow-sm active:scale-95 flex items-center justify-center gap-1"
        >
          <span>✕</span> XÓA TẤT CẢ (C)
        </button>
      </div>
    </div>
  );
};

export const KitchenModule: React.FC = () => {
  const { user } = useAuth();
  const { showError, showSuccess, showWarning } = useNotification();

  // Dữ liệu danh mục
  const [items, setItems] = useState<Item[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [activeBatches, setActiveBatches] = useState<BatchResponse[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Trạng thái mở các Modals
  const [activeModal, setActiveModal] = useState<'takeOut' | 'batch' | 'lineItem' | 'damage' | null>(null);

  // --- Nút 1: Lấy hàng state ---
  const [selectedItemId, setSelectedItemId] = useState<number | ''>('');
  const [takeOutQty, setTakeOutQty] = useState<number | ''>('');
  const [takeOutNote, setTakeOutNote] = useState<string>('');
  const [isTakingOut, setIsTakingOut] = useState<boolean>(false);
  // TASK-S1-03: Lịch sử lấy hàng trong ca & Hủy lấy hàng
  const [takeOutLogs, setTakeOutLogs] = useState<TakeOutLog[]>([]);
  const [cancellingTakeOutId, setCancellingTakeOutId] = useState<number | null>(null);

  // --- Nút 2: Chế biến mẻ state ---
  const [batchTab, setBatchTab] = useState<'start' | 'finish'>('start');
  const [batchItemId, setBatchItemId] = useState<number | ''>('');
  const [batchInputWeight, setBatchInputWeight] = useState<number>(0);
  const [batchNote, setBatchNote] = useState<string>('');
  const [isStartingBatch, setIsStartingBatch] = useState<boolean>(false);
  // Cảnh báo mẻ thứ hai modal
  const [showSecondBatchWarning, setShowSecondBatchWarning] = useState<boolean>(false);
  const [pendingBatchRequest, setPendingBatchRequest] = useState<{ itemId: number; inputWeight: number; unit: string; note?: string } | null>(null);
  // Cân thành phẩm state
  const [selectedFinishBatch, setSelectedFinishBatch] = useState<BatchResponse | null>(null);
  const [finishOutputWeight, setFinishOutputWeight] = useState<number>(0);
  const [isFinishingBatch, setIsFinishingBatch] = useState<boolean>(false);

  // --- GIAI ĐOẠN 8: Chặn cứng mẻ có báo hỏng chưa duyệt (HTTP 422) ---
  const [showUnapprovedDamageModal, setShowUnapprovedDamageModal] = useState<boolean>(false);
  const [unapprovedDamageError, setUnapprovedDamageError] = useState<string>('');

  // --- GIAI ĐOẠN 8: Món chỉ dùng trong ngày cuối ca ---
  const [showDailyWasteModal, setShowDailyWasteModal] = useState<boolean>(false);
  const [dailyItems, setDailyItems] = useState<DailyRemainingItem[]>([]);
  const [dailyWasteShift, setDailyWasteShift] = useState<'CA_TOI' | 'CA_SANG'>('CA_TOI');
  const [dailyWasteDate, setDailyWasteDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dailyWasteQuantities, setDailyWasteQuantities] = useState<{ [itemId: number]: number }>({});
  const [dailyWasteItemNotes, setDailyWasteItemNotes] = useState<{ [itemId: number]: string }>({});
  const [dailyWasteGeneralNote, setDailyWasteGeneralNote] = useState<string>('');
  const [isLoadingDailyItems, setIsLoadingDailyItems] = useState<boolean>(false);
  const [isSubmittingDailyWaste, setIsSubmittingDailyWaste] = useState<boolean>(false);

  // --- GIAI ĐOẠN 8: Thêm món nhanh ra line ---
  const [showQuickAddModal, setShowQuickAddModal] = useState<boolean>(false);
  const [quickItemName, setQuickItemName] = useState<string>('');
  const [quickItemCategory, setQuickItemCategory] = useState<string>('MÓN NẤU / RA LINE');
  const [quickItemUnit, setQuickItemUnit] = useState<string>('Đĩa');
  const [quickItemCostPrice, setQuickItemCostPrice] = useState<number>(50000);
  const [quickIsDailyOnly, setQuickIsDailyOnly] = useState<boolean>(false);
  const [isSubmittingQuickAdd, setIsSubmittingQuickAdd] = useState<boolean>(false);

  // --- Nút 3: Ra line (+1) state & idempotency ---
  const [lineCounters, setLineCounters] = useState<{ [itemId: number]: number }>({});
  const [loadingLineButtons, setLoadingLineButtons] = useState<{ [itemId: number]: boolean }>({});
  const [cooldownButtons, setCooldownButtons] = useState<{ [itemId: number]: boolean }>({});
  const [animatingLineItemId, setAnimatingLineItemId] = useState<number | null>(null);
  const [shakingLineItemId, setShakingLineItemId] = useState<number | null>(null);
  const [selectedStation, setSelectedStation] = useState<KitchenStation>('ALL');
  const [lineSearchTerm, setLineSearchTerm] = useState<string>('');

  // Bộ lọc Station theo từng trạm chế biến bếp
  const filterItemsByStation = (itemList: Item[], station: KitchenStation) => {
    if (station === 'ALL') return itemList;
    if (station === 'BAR') {
      return itemList.filter(
        (it) => it.category?.toLowerCase().includes('bar') || it.category?.toLowerCase().includes('đồ uống')
      );
    }
    if (station === 'BEP_LANH') {
      return itemList.filter(
        (it) =>
          it.category?.toLowerCase().includes('salad') ||
          it.category?.toLowerCase().includes('khai vị') ||
          it.category?.toLowerCase().includes('nộm') ||
          it.category?.toLowerCase().includes('kim chi') ||
          it.category?.toLowerCase().includes('tráng miệng') ||
          it.isDailyOnly
      );
    }
    if (station === 'BEP_NONG') {
      return itemList.filter(
        (it) =>
          it.category?.toLowerCase().includes('thịt') ||
          it.category?.toLowerCase().includes('hải sản') ||
          it.category?.toLowerCase().includes('nấu') ||
          it.category?.toLowerCase().includes('nướng')
      );
    }
    if (station === 'RA_LINE') {
      return itemList.filter((it) => it.isBuffetLine);
    }
    return itemList;
  };

  // --- Nút 4: Báo hỏng state ---
  const [damageItemId, setDamageItemId] = useState<number | ''>('');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<string>('HONG_DO_NHA_CUNG_CAP');
  const [damageSupplier, setDamageSupplier] = useState<string>('NCC_HAI_SAN_01');
  const [availableBatches, setAvailableBatches] = useState<ImportBatch[]>([]);
  const [selectedBatchCode, setSelectedBatchCode] = useState<string>('');
  const [damageNote, setDamageNote] = useState<string>('');
  const [damageImage, setDamageImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmittingDamage, setIsSubmittingDamage] = useState<boolean>(false);
  // TASK-S1-05: Đơn báo hỏng đã gửi ca này
  const [damageReports, setDamageReports] = useState<DamageReport[]>([]);
  const [viewingDamageImage, setViewingDamageImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // Tải dữ liệu ban đầu
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [itemList, recipeList, batchList, takeOutList, damageList] = await Promise.all([
        kitchenApi.getBuffetItems(),
        kitchenApi.getRecipes(),
        kitchenApi.getActiveBatches(),
        kitchenApi.getTakeOutLogs(),
        kitchenApi.getDamageReports(),
      ]);
      setItems(itemList);
      setRecipes(recipeList);
      setActiveBatches(batchList);
      setTakeOutLogs(takeOutList);
      setDamageReports(damageList);
      if (itemList.length > 0 && !selectedItemId) {
        setSelectedItemId(itemList[0].id);
        setBatchItemId(itemList[0].id);
        setDamageItemId(itemList[0].id);
      }
    } catch (err: any) {
      console.error('Lỗi khi tải dữ liệu bếp:', err);
      showNotice('error', 'Không thể kết nối đến máy chủ.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Khi chọn mặt hàng báo hỏng, nạp danh sách các lô nhập (lots) còn tồn của mặt hàng đó
  useEffect(() => {
    if (damageItemId) {
      warehouseApi.getAvailableBatches({ itemId: Number(damageItemId) })
        .then((batches) => {
          setAvailableBatches(batches);
          if (batches.length > 0) {
            setSelectedBatchCode(batches[0].batchCode);
            if (batches[0].supplierCode || batches[0].supplierName) {
              setDamageSupplier(batches[0].supplierCode || batches[0].supplierName || '');
            }
          } else {
            setSelectedBatchCode('');
          }
        })
        .catch(() => {
          setAvailableBatches([]);
          setSelectedBatchCode('');
        });
    }
  }, [damageItemId]);

  const showNotice = (type: 'success' | 'error' | 'warning', text: string) => {
    setStatusMessage({ type: type === 'warning' ? 'error' : type, text });
    setTimeout(() => setStatusMessage(null), 4500);

    // Bắn alert nổi bật (Task 12.2: Prominent Visual Alerts)
    if (type === 'error') {
      showError(text, 'LỖI THAO TÁC BẾP');
    } else if (type === 'warning') {
      showWarning(text, 'CẢNH BÁO MẺ BẾP');
    } else {
      showSuccess(text, 'THAO TÁC BẾP THÀNH CÔNG');
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 1: LẤY HÀNG
  // -------------------------------------------------------------
  const handleTakeOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const qty = typeof takeOutQty === 'string' ? parseFloat(takeOutQty) : takeOutQty;
    if (!selectedItemId || !takeOutQty || isNaN(qty) || qty <= 0) {
      showNotice('error', 'Vui lòng nhập số lượng xuất hợp lệ (> 0)');
      return;
    }

    const item = items.find((i) => i.id === Number(selectedItemId));
    if (!item) return;

    try {
      setIsTakingOut(true);
      await kitchenApi.recordTakeOut({
        itemId: item.id,
        quantity: qty,
        unit: item.unit,
        note: takeOutNote || 'Lấy hàng ra bếp sơ chế',
      });
      showNotice('success', `Đã xuất kho ${qty} ${item.unit} ${item.itemName}`);
      // TASK-S1-03: Reset toàn bộ form lấy hàng về rỗng
      setTakeOutQty('');
      setTakeOutNote('');
      setActiveModal(null);

      // Cập nhật lại danh sách lấy hàng trong ca ngay lập tức
      const updatedLogs = await kitchenApi.getTakeOutLogs();
      setTakeOutLogs(updatedLogs);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || 'Lỗi khi lấy hàng');
    } finally {
      setIsTakingOut(false);
    }
  };

  // -------------------------------------------------------------
  // TASK-S1-03: HỦY THAO TÁC LẤY HÀNG NẾU LẤY NHẦM (HOÀN TRẢ LẠI KHO)
  // -------------------------------------------------------------
  const handleCancelTakeOut = async (log: TakeOutLog) => {
    if (log.isCancelled) return;
    try {
      setCancellingTakeOutId(log.id);
      const res = await kitchenApi.cancelTakeOut(log.id);
      showNotice('success', res.message);
      const updatedLogs = await kitchenApi.getTakeOutLogs();
      setTakeOutLogs(updatedLogs);
    } catch (err: any) {
      showNotice('error', err.message || 'Lỗi khi hủy thao tác lấy hàng');
    } finally {
      setCancellingTakeOutId(null);
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 2: CHẾ BIẾN MẺ
  // -------------------------------------------------------------
  const handleStartBatchSubmit = async (force = false) => {
    if (!batchItemId || !batchInputWeight || batchInputWeight <= 0) {
      showNotice('error', 'Vui lòng nhập khối lượng đầu vào hợp lệ (> 0 kg)');
      return;
    }
    const item = items.find((i) => i.id === Number(batchItemId));
    if (!item) return;

    const reqData = {
      itemId: item.id,
      inputWeight: batchInputWeight,
      unit: item.unit,
      note: batchNote || undefined,
      forceSecondBatch: force,
    };

    try {
      setIsStartingBatch(true);
      if (!navigator.onLine) {
        localStorage.setItem('senviet_offline_start_batch', JSON.stringify(reqData));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu mẻ [${item.itemName} - ${batchInputWeight} kg] đã được lưu tạm trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
        return;
      }
      const res = await kitchenApi.startBatch(reqData);
      localStorage.removeItem('senviet_offline_start_batch');
      showNotice('success', `Đã khởi tạo mẻ [${res.data.batchCode}] cho món ${item.itemName}`);
      setShowSecondBatchWarning(false);
      setPendingBatchRequest(null);
      // Reload danh sách mẻ đang làm
      const updatedBatches = await kitchenApi.getActiveBatches();
      setActiveBatches(updatedBatches);
      setActiveModal(null);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        localStorage.setItem('senviet_offline_start_batch', JSON.stringify(reqData));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu cân mẻ ${batchInputWeight} kg đã được lưu tạm an toàn trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
      } else if (err.response?.status === 409) {
        // Kích hoạt Modal Cảnh Báo Đỏ Mẻ Thứ Hai
        setPendingBatchRequest(reqData);
        setShowSecondBatchWarning(true);
      } else if (err.response?.status === 422) {
        // Giai đoạn 8: Chặn cứng do món có báo hỏng chờ Quản lý duyệt
        setUnapprovedDamageError(
          err.response?.data?.message ||
          'Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!'
        );
        setShowUnapprovedDamageModal(true);
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi tạo mẻ');
      }
    } finally {
      setIsStartingBatch(false);
    }
  };

  // Hoàn tất cân mẻ thành phẩm (Offline Resilience)
  const handleFinishBatchSubmit = async () => {
    if (!selectedFinishBatch || finishOutputWeight <= 0) return;

    try {
      setIsFinishingBatch(true);
      if (!navigator.onLine) {
        localStorage.setItem(`senviet_offline_finish_batch_${selectedFinishBatch.id}`, finishOutputWeight.toString());
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Số cân thành phẩm ${finishOutputWeight} kg của mẻ [${selectedFinishBatch.batchCode}] đã được lưu tạm an toàn. Vui lòng bấm 'Thử lại' khi có mạng.`
        );
        return;
      }
      const res = await kitchenApi.finishBatch({
        batchId: selectedFinishBatch.id,
        outputWeight: finishOutputWeight,
      });

      localStorage.removeItem(`senviet_offline_finish_batch_${selectedFinishBatch.id}`);
      const batchData = res.data;
      if (batchData.overStandard) {
        showNotice(
          'error',
          `⚠️ CẢNH BÁO: Mẻ [${batchData.batchCode}] hao hụt ${batchData.lossRate}% (vượt chuẩn ${batchData.standardLossRate}%)!`
        );
      } else {
        showNotice('success', `✅ Mẻ [${batchData.batchCode}] hoàn tất thành công. Hao hụt chuẩn: ${batchData.lossRate}%`);
      }

      setSelectedFinishBatch(null);
      setFinishOutputWeight(0);
      const updatedBatches = await kitchenApi.getActiveBatches();
      setActiveBatches(updatedBatches);
      setActiveModal(null);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        // Giữ nguyên số kg nhân viên vừa cân xong, không làm mất dữ liệu
        localStorage.setItem(`senviet_offline_finish_batch_${selectedFinishBatch.id}`, finishOutputWeight.toString());
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu cân mẻ ${finishOutputWeight} kg đã được lưu tạm an toàn trên máy. Vui lòng bấm 'Thử lại' khi có mạng lại.`
        );
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi hoàn thành mẻ');
      }
    } finally {
      setIsFinishingBatch(false);
    }
  };

  // -------------------------------------------------------------
  // TASK-S1-04: Xử lý Nút 3: RA LINE (+1) kèm Cooldown 1.5s & Phản hồi Haptic/Visual
  // -------------------------------------------------------------
  const handleLineItemInc = async (item: Item) => {
    // Khóa nút tối thiểu 1.5 giây sau mỗi lần bấm để tránh spam click
    if (loadingLineButtons[item.id] || cooldownButtons[item.id]) return;

    // Khóa nút tức thì & kích hoạt cooldown lock tối thiểu 1.5 giây (1500ms)
    setLoadingLineButtons((prev) => ({ ...prev, [item.id]: true }));
    setCooldownButtons((prev) => ({ ...prev, [item.id]: true }));

    // Kích hoạt hiệu ứng phản hồi: nảy số +1 (floating badge) và rung nhẹ phản hồi (haptic/visual)
    setAnimatingLineItemId(item.id);
    setShakingLineItemId(item.id);

    // Haptic feedback cho thiết bị màn hình cảm ứng / tablet bếp
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([40, 30, 40]);
      } catch (e) {
        // Bỏ qua nếu trình duyệt không hỗ trợ hoặc bị chặn
      }
    }

    // Thời gian kết thúc hiệu ứng rung visual (400ms) và hiệu ứng floating badge (900ms)
    setTimeout(() => {
      setShakingLineItemId(null);
    }, 400);

    setTimeout(() => {
      setAnimatingLineItemId(null);
    }, 900);

    // Đảm bảo mở khóa cooldown tối thiểu 1.5 giây (1500ms)
    setTimeout(() => {
      setCooldownButtons((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);

    // Sinh requestId duy nhất để server loại trừ request trùng khi mạng chập chờn
    const idempotencyRequestId = `line-${item.id}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    try {
      await kitchenApi.recordLineItem({
        itemId: item.id,
        quantity: 1,
        requestId: idempotencyRequestId,
      });

      // Tăng counter hiển thị trên giao diện
      setLineCounters((prev) => ({
        ...prev,
        [item.id]: (prev[item.id] || 0) + 1,
      }));

      showNotice('success', `+1 đĩa [${item.itemName}] đã ra line buffet!`);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || 'Lỗi khi ghi nhận ra line');
    } finally {
      // Mở lại loading của nút sau khi request ghi nhận xong
      setLoadingLineButtons((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 4: BÁO HỎNG & Nén Ảnh Canvas
  // -------------------------------------------------------------
  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      // Nén ảnh Canvas về max 1280x720, quality 0.75, <= 250KB
      const result = await compressImage(file, 1280, 720, 0.75);
      setDamageImage(result);
    } catch (err) {
      console.error('Lỗi nén ảnh:', err);
      showNotice('error', 'Không thể nén ảnh, vui lòng thử lại');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDamageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!damageItemId || damageQty <= 0) return;

    const damagePayload = {
      itemId: Number(damageItemId),
      quantity: damageQty,
      reason: damageReason,
      supplierCode: damageReason === 'HONG_DO_NHA_CUNG_CAP' ? damageSupplier : undefined,
      batchNumber: selectedBatchCode || undefined,
      note: damageNote || undefined,
      imageUrls: damageImage?.dataUrl || undefined,
    };

    try {
      setIsSubmittingDamage(true);
      if (!navigator.onLine) {
        localStorage.setItem('senviet_offline_damage_report', JSON.stringify(damagePayload));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu báo hỏng (${damageQty} kg) đã được lưu tạm an toàn trên máy. Vui lòng bấm "Thử lại" khi có mạng.`
        );
        return;
      }

      const res = await kitchenApi.recordDamageReport(damagePayload);
      localStorage.removeItem('senviet_offline_damage_report');

      const report = res.data;
      if (report.status === 'TU_DONG_DUYET') {
        showNotice('success', `✅ Đơn báo hỏng đã được TỰ ĐỘNG DUYỆT (Giá trị: ${Number(report.estimatedValue).toLocaleString('vi-VN')} đ)`);
      } else {
        showNotice('error', `⚠️ Đơn báo hỏng giá trị cao (${Number(report.estimatedValue).toLocaleString('vi-VN')} đ) đang CHỜ QUẢN LÝ DUYỆT`);
      }

      setDamageNote('');
      setDamageImage(null);
      setActiveModal(null);

      // TASK-S1-05: Cập nhật lại danh sách báo hỏng đã gửi ca này ngay lập tức
      const updatedReports = await kitchenApi.getDamageReports();
      setDamageReports(updatedReports);
    } catch (err: any) {
      const isNetworkErr =
        !navigator.onLine ||
        err.code === 'ERR_NETWORK' ||
        err.message?.includes('Network Error') ||
        err.message?.includes('timeout') ||
        !err.response;

      if (isNetworkErr) {
        localStorage.setItem('senviet_offline_damage_report', JSON.stringify(damagePayload));
        showNotice(
          'error',
          `⚠️ Mất kết nối mạng! Dữ liệu báo hỏng (${damageQty} kg) đã được lưu tạm trên máy. Vui lòng bấm "Thử lại" khi mạng ổn định.`
        );
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi gửi báo hỏng');
      }
    } finally {
      setIsSubmittingDamage(false);
    }
  };

  // -------------------------------------------------------------
  // GIAI ĐOẠN 8: Xử lý Món Dùng Trong Ngày Cuối Ca
  // -------------------------------------------------------------
  const handleOpenDailyWasteModal = async () => {
    try {
      setIsLoadingDailyItems(true);
      setShowDailyWasteModal(true);
      const list = await kitchenApi.getDailyOnlyRemaining();
      setDailyItems(list);
      // Pre-fill quantities
      const initialQtys: { [id: number]: number } = {};
      list.forEach((item) => {
        initialQtys[item.id] = item.remainingStock || item.suggestedWasteQty || 0;
      });
      setDailyWasteQuantities(initialQtys);
    } catch (err: any) {
      console.error('Lỗi nạp danh sách món dùng trong ngày:', err);
      showNotice('error', 'Không thể nạp danh sách món dùng trong ngày');
    } finally {
      setIsLoadingDailyItems(false);
    }
  };

  const handleSubmitDailyWaste = async (e: React.FormEvent) => {
    e.preventDefault();
    const itemsToWaste = dailyItems
      .filter((it) => (dailyWasteQuantities[it.id] || 0) > 0)
      .map((it) => ({
        itemId: it.itemId || it.id,
        quantity: dailyWasteQuantities[it.id] || 0,
        unit: it.unit,
        note: dailyWasteItemNotes[it.id] || undefined,
      }));

    if (itemsToWaste.length === 0) {
      showNotice('error', 'Vui lòng nhập số lượng ghi bỏ cho ít nhất 1 món');
      return;
    }

    try {
      setIsSubmittingDailyWaste(true);
      const req: ConfirmDailyWasteRequest = {
        shift: dailyWasteShift,
        wasteDate: dailyWasteDate,
        note: dailyWasteGeneralNote || undefined,
        items: itemsToWaste,
      };

      await kitchenApi.confirmDailyWaste(req);
      showNotice(
        'success',
        `✅ Đã xác nhận ghi bỏ ${itemsToWaste.length} món dùng trong ngày thành công! Đã hạch toán vào Hỏng/bỏ có báo.`
      );
      setShowDailyWasteModal(false);
      loadInitialData();
    } catch (err: any) {
      console.error('Lỗi khi ghi bỏ món trong ngày:', err);
      showNotice('error', err.response?.data?.message || 'Lỗi khi xác nhận ghi bỏ');
    } finally {
      setIsSubmittingDailyWaste(false);
    }
  };

  // -------------------------------------------------------------
  // GIAI ĐOẠN 8: Xử lý Thêm Món Nhanh Ra Line
  // -------------------------------------------------------------
  const handleQuickAddLineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickItemName.trim()) {
      showNotice('error', 'Tên món không được để trống');
      return;
    }

    try {
      setIsSubmittingQuickAdd(true);
      const newItem = await kitchenApi.quickAddLineItem({
        itemName: quickItemName.trim(),
        category: quickItemCategory,
        unit: quickItemUnit,
        costPrice: quickItemCostPrice || 50000,
        isDailyOnly: quickIsDailyOnly,
      });

      setItems((prev) => [...prev, newItem]);
      showNotice('success', `✅ Đã thêm món "${newItem.itemName}" vào thực đơn ra line thành công!`);
      setShowQuickAddModal(false);
      setQuickItemName('');
      setQuickIsDailyOnly(false);
    } catch (err: any) {
      console.error('Lỗi khi thêm món nhanh:', err);
      showNotice('error', err.response?.data?.message || 'Lỗi khi thêm món nhanh ra line');
    } finally {
      setIsSubmittingQuickAdd(false);
    }
  };

  // Tính giá trị ước tính của đơn báo hỏng
  const selectedDamageItem = items.find((i) => i.id === Number(damageItemId));
  const estimatedDamageCost = (selectedDamageItem?.costPrice || 0) * (damageQty || 0);
  const isAutoApprove = estimatedDamageCost <= 500000;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 mb-2" />
        <span className="text-sm font-medium">Đang tải dữ liệu quầy Bếp & Bar...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl mx-auto pb-8">
      {/* Thông báo Alert Toast */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border border-rose-300 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-medium">{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header Panel tóm tắt ca làm việc của Bếp */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">
            {user?.branchName || 'Sen Việt Buffet'}
          </span>
          <h2 className="text-lg font-bold text-slate-800">Bảng Vận Hành Bếp & Bar</h2>
          <p className="text-xs text-slate-500">Người thực hiện: <span className="font-semibold text-slate-700">{user?.fullName}</span></p>
        </div>
        <div className="flex items-center gap-2">
          {activeBatches.length > 0 && (
            <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
              <Flame className="h-3.5 w-3.5" />
              {activeBatches.length} mẻ đang làm
            </span>
          )}
          <button
            onClick={loadInitialData}
            title="Tải lại dữ liệu"
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* CẢNH BÁO MẺ DỞ DANG NỔI BẬT (BANNER ĐỎ / AMBER) */}
      {activeBatches.length > 0 && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 rounded-2xl p-4 sm:p-5 text-white shadow-xl shadow-rose-600/20 border-2 border-amber-300 animate-in fade-in flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md flex-shrink-0 animate-pulse">
              <Flame className="h-7 w-7 text-amber-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base sm:text-lg tracking-tight">CẢNH BÁO: CÓ {activeBatches.length} MẺ CHƯA CÂN THÀNH PHẨM!</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black uppercase tracking-wider animate-bounce">
                  Cần cân ngay
                </span>
              </div>
              <p className="text-xs sm:text-sm text-amber-100/90 mt-0.5">
                Hoàn tất cân thành phẩm mẻ đang làm để tránh vượt định mức hao hụt và mở mẻ mới chuẩn xác.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setBatchTab('finish');
              setSelectedFinishBatch(activeBatches[0]);
              const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${activeBatches[0].id}`);
              if (savedDraft) {
                setFinishOutputWeight(parseFloat(savedDraft));
              } else {
                setFinishOutputWeight(activeBatches[0].inputWeight ? Math.round(activeBatches[0].inputWeight * 0.8 * 10) / 10 : 0);
              }
              setActiveModal('batch');
            }}
            className="btn-touch px-4 py-3 rounded-xl bg-white text-rose-700 hover:bg-amber-50 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all flex-shrink-0"
          >
            <Scale className="h-4 w-4 text-rose-600" />
            <span>TIẾP TỤC MẺ TRƯỚC</span>
          </button>
        </div>
      )}

      {/* BỘ LỌC TRẠM CHẾ BIẾN (STATION FILTER) */}
      <div className="bg-white p-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider px-2 whitespace-nowrap flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          <span>Trạm:</span>
        </span>
        {[
          { key: 'ALL', label: 'Tất cả trạm', icon: '🍽️' },
          { key: 'BEP_NONG', label: 'Bếp Nóng', icon: '🔥' },
          { key: 'BEP_LANH', label: 'Bếp Lạnh', icon: '🥗' },
          { key: 'BAR', label: 'Quầy Bar', icon: '🍹' },
          { key: 'RA_LINE', label: 'Ra Line Buffet', icon: '🍱' },
        ].map((st) => (
          <button
            key={st.key}
            type="button"
            onClick={() => setSelectedStation(st.key as KitchenStation)}
            className={`btn-touch px-3 py-1.5 rounded-xl font-bold text-xs whitespace-nowrap flex items-center gap-1.5 transition-all ${
              selectedStation === st.key
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <span>{st.icon}</span>
            <span>{st.label}</span>
          </button>
        ))}
      </div>

      {/* 4 NÚT BẤM CỰC LỚN (MOBILE-FIRST BUTTONS: MIN 56PX - 64PX TOUCH TARGETS) */}
      <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
        {/* NÚT 1: LẤY HÀNG (Màu Xanh Dương) */}
        <button
          onClick={() => {
            setTakeOutQty('');
            setTakeOutNote('');
            setActiveModal('takeOut');
          }}
          className="btn-touch min-h-[140px] sm:min-h-[155px] rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 hover:from-blue-700 hover:to-indigo-900 text-white p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-blue-600/25 active:scale-[0.97] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Package className="h-7 w-7 text-white" />
            </div>
            <span className="text-[11px] font-black px-2.5 py-1 rounded bg-black/25 uppercase tracking-wider">Nút 1</span>
          </div>
          <div>
            <div className="font-black text-lg sm:text-xl leading-tight tracking-tight">LẤY HÀNG</div>
            <div className="text-xs sm:text-sm text-blue-100 mt-1">Xuất kho sơ bộ ra bếp</div>
          </div>
        </button>

        {/* NÚT 2: CHẾ BIẾN MẺ (Màu Xanh Lá) */}
        <button
          onClick={() => {
            setBatchTab(activeBatches.length > 0 ? 'finish' : 'start');
            setBatchInputWeight(0);
            setBatchNote('');
            setActiveModal('batch');
          }}
          className="btn-touch min-h-[140px] sm:min-h-[155px] rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 hover:from-emerald-700 hover:to-teal-900 text-white p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-emerald-600/25 active:scale-[0.97] transition-all text-left relative overflow-hidden"
        >
          {activeBatches.length > 0 && (
            <span className="absolute top-3 right-3 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-300"></span>
            </span>
          )}
          <div className="flex items-center justify-between w-full">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Flame className="h-7 w-7 text-white" />
            </div>
            <span className="text-[11px] font-black px-2.5 py-1 rounded bg-black/25 uppercase tracking-wider">Nút 2</span>
          </div>
          <div>
            <div className="font-black text-lg sm:text-xl leading-tight tracking-tight">CHẾ BIẾN MẺ</div>
            <div className="text-xs sm:text-sm text-emerald-100 mt-1">
              {activeBatches.length > 0 ? `${activeBatches.length} mẻ cần cân hụt` : 'Mở mẻ & cân thành phẩm'}
            </div>
          </div>
        </button>

        {/* NÚT 3: RA LINE (+1) (Màu Vàng / Hổ Phách) */}
        <button
          onClick={() => setActiveModal('lineItem')}
          className="btn-touch min-h-[140px] sm:min-h-[155px] rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-orange-700 hover:from-amber-600 hover:to-orange-800 text-white p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-amber-500/25 active:scale-[0.97] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <PlusCircle className="h-7 w-7 text-white" />
            </div>
            <span className="text-[11px] font-black px-2.5 py-1 rounded bg-black/25 uppercase tracking-wider">Nút 3</span>
          </div>
          <div>
            <div className="font-black text-lg sm:text-xl leading-tight tracking-tight">RA LINE (+1)</div>
            <div className="text-xs sm:text-sm text-amber-100 mt-1">Ghi nhận đĩa ra buffet</div>
          </div>
        </button>

        {/* NÚT 4: BÁO HỎNG (Màu Đỏ Rose) */}
        <button
          onClick={() => setActiveModal('damage')}
          className="btn-touch min-h-[140px] sm:min-h-[155px] rounded-2xl bg-gradient-to-br from-rose-600 via-rose-700 to-red-800 hover:from-rose-700 hover:to-red-900 text-white p-4 sm:p-5 flex flex-col justify-between shadow-xl shadow-rose-600/25 active:scale-[0.97] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="h-7 w-7 text-white" />
            </div>
            <span className="text-[11px] font-black px-2.5 py-1 rounded bg-black/25 uppercase tracking-wider">Nút 4</span>
          </div>
          <div>
            <div className="font-black text-lg sm:text-xl leading-tight tracking-tight">BÁO HỎNG</div>
            <div className="text-xs sm:text-sm text-rose-100 mt-1">Kèm ảnh chụp nén &lt;200KB</div>
          </div>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TASK-S1-03: BẢNG LỊCH SỬ LẤY HÀNG TRONG CA HÔM NAY             */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Lịch Sử Lấy Hàng Trong Ca Hôm Nay</h3>
              <p className="text-[11px] text-slate-500">
                Xuất kho ra bếp sơ chế. Hỗ trợ hủy thao tác hoàn trả lại kho nếu lấy nhầm.
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
            {takeOutLogs.length} lần xuất
          </span>
        </div>

        {takeOutLogs.length === 0 ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <Package className="h-7 w-7 mx-auto mb-1 text-slate-300" />
            <p className="text-xs font-semibold">Chưa có lượt lấy hàng nào trong ca hôm nay</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Nhấn "NÚT 1: LẤY HÀNG" ở trên để ghi nhận xuất kho sơ bộ</p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Thời gian</th>
                  <th className="py-2.5 px-3">Tên nguyên liệu</th>
                  <th className="py-2.5 px-3 text-right">Số lượng</th>
                  <th className="py-2.5 px-3">Ghi chú</th>
                  <th className="py-2.5 px-3 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {takeOutLogs.map((log) => {
                  const isCancelled = log.isCancelled || log.status === 'CANCELLED';
                  const timeStr = log.createdAt ? log.createdAt.slice(11, 16) : '--:--';
                  return (
                    <tr
                      key={log.id}
                      className={`transition-colors ${isCancelled ? 'bg-slate-50/80 opacity-60' : 'hover:bg-blue-50/40'}`}
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-600 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-slate-400" />
                          <span>{timeStr}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">
                        <div className="flex items-center gap-1.5">
                          <span>{log.item?.itemName || 'Nguyên liệu'}</span>
                          {log.item?.category && (
                            <span className="text-[10px] font-normal text-slate-400 bg-slate-100 px-1 rounded">
                              {log.item.category}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right whitespace-nowrap">
                        <span className={`font-mono font-black text-sm ${isCancelled ? 'line-through text-slate-400' : 'text-blue-700'}`}>
                          {log.quantity}
                        </span>{' '}
                        <span className="font-semibold text-slate-500">{log.unit || log.item?.unit}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 max-w-[140px] truncate" title={log.note}>
                        {log.note || '--'}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-600">
                            <Check className="h-3 w-3" /> Đã hoàn kho
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCancelTakeOut(log)}
                            disabled={cancellingTakeOutId === log.id}
                            className="btn-touch px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px] active:scale-95 transition-all inline-flex items-center gap-1 shadow-sm"
                            title="Hủy lần xuất này nếu lấy nhầm và hoàn trả số lượng lại kho"
                          >
                            {cancellingTakeOutId === log.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Undo2 className="h-3 w-3 text-rose-600" />
                            )}
                            <span>Hủy (Hoàn kho)</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* TASK-S1-05: BẢNG THEO DÕI ĐƠN BÁO HỎNG ĐÃ GỬI CA NÀY          */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">Đơn Báo Hỏng Đã Gửi Ca Này</h3>
              <p className="text-[11px] text-slate-500">
                Minh bạch tình trạng phê duyệt từ Bếp trưởng & Quản lý với 3 badge màu chuẩn hóa.
              </p>
            </div>
          </div>
          <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
            {damageReports.length} đơn
          </span>
        </div>

        {damageReports.length === 0 ? (
          <div className="text-center py-6 text-slate-400 bg-slate-50/60 rounded-xl border border-dashed border-slate-200">
            <AlertTriangle className="h-7 w-7 mx-auto mb-1 text-slate-300" />
            <p className="text-xs font-semibold">Chưa có đơn báo hỏng nào trong ca</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Nhấn "NÚT 4: BÁO HỎNG" để lập đơn kèm ảnh chụp nén</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {damageReports.map((report) => {
              const timeStr = report.createdAt ? report.createdAt.slice(11, 16) : '--:--';
              const isPending = report.status === 'CHO_DUYET';
              const isApproved = report.status === 'DA_DUYET' || report.status === 'TU_DONG_DUYET';
              const isRejected = report.status === 'TU_CHOI';

              return (
                <div
                  key={report.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-50/60 border-amber-200'
                      : isApproved
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm text-slate-900">{report.item?.itemName}</span>
                      <span className="font-mono text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {report.quantity} {report.item?.unit}
                      </span>
                      <span className="text-xs font-extrabold text-rose-700">
                        {report.estimatedValue ? Number(report.estimatedValue).toLocaleString('vi-VN') : '0'} đ
                      </span>
                      <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {timeStr}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        Lý do:{' '}
                        <strong className="text-slate-800">
                          {report.reason === 'HONG_SO_CHE_NAU'
                            ? 'Hủy do sơ chế / nấu hỏng'
                            : report.reason === 'HONG_DO_NHA_CUNG_CAP'
                            ? 'Hủy do nguyên liệu chết / ươn từ NCC'
                            : report.reason === 'HUY_THUA_CUOI_CA'
                            ? 'Hủy do thừa cuối ca'
                            : report.reason}
                        </strong>
                      </span>
                      {report.batchNumber && (
                        <span className="text-[10px] font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                          Lô: {report.batchNumber}
                        </span>
                      )}
                      {report.supplierCode && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          NCC: {report.supplierCode}
                        </span>
                      )}
                    </div>

                    {/* Thông tin giải trình / lý do từ chối nếu có */}
                    {isRejected && report.rejectedReason && (
                      <div className="text-[11px] font-medium text-rose-700 bg-white/80 p-1.5 rounded-lg border border-rose-200 flex items-start gap-1">
                        <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                        <span>Lý do từ chối: {report.rejectedReason}</span>
                      </div>
                    )}

                    {isApproved && (
                      <div className="text-[11px] font-medium text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                        <span>
                          Duyệt bởi: <strong>{report.approvedBy || (report.status === 'TU_DONG_DUYET' ? 'Hệ thống tự động' : 'Bếp trưởng')}</strong>
                          {report.approvedAt && ` (${report.approvedAt.slice(11, 16)})`}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Badge Trạng Thái Màu Sắc Theo Tiêu Chuẩn Nghiệm Thu */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0">
                    {isPending && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5 shadow-sm">
                        <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                        <span>🟡 Chờ Bếp trưởng duyệt</span>
                      </span>
                    )}

                    {isApproved && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 shadow-sm">
                        <span>🟢 Đã duyệt</span>
                      </span>
                    )}

                    {isRejected && (
                      <span className="px-3 py-1.5 rounded-full text-xs font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1.5 shadow-sm">
                        <span>🔴 Từ chối</span>
                      </span>
                    )}

                    {report.imageUrls && (
                      <button
                        type="button"
                        onClick={() => setViewingDamageImage(report.imageUrls || null)}
                        className="text-[11px] font-bold text-slate-600 hover:text-slate-900 underline flex items-center gap-1"
                      >
                        <ImageIcon className="h-3.5 w-3.5" />
                        <span>Xem ảnh</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Phóng To Xem Ảnh Báo Hỏng */}
        {viewingDamageImage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[80] flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl p-4 max-w-lg w-full space-y-3">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="font-bold text-sm text-slate-800">Ảnh minh chứng báo hỏng</span>
                <button onClick={() => setViewingDamageImage(null)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <img src={viewingDamageImage} alt="Ảnh báo hỏng" className="w-full max-h-[70vh] object-contain rounded-xl" />
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: XỬ LÝ MÓN TƯƠI CHỈ DÙNG TRONG NGÀY CUỐI CA         */}
      {/* ============================================================== */}
      <div className="bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-md flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
            <Salad className="h-6 w-6 text-emerald-200" />
          </div>
          <div className="min-w-0">
            <div className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-2">
              <span className="truncate">MÓN CHỈ DÙNG TRONG NGÀY</span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/40 text-emerald-100 uppercase flex-shrink-0">
                Phase 8
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5 truncate sm:whitespace-normal">
              Cuối ca: Kiểm đếm tồn salad, kim chi, nộm & xác nhận ghi bỏ (không phạt bếp)
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenDailyWasteModal}
          className="btn-touch px-3.5 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs hover:bg-emerald-50 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all flex-shrink-0"
        >
          <Salad className="h-4 w-4 text-emerald-700" />
          <span>XỬ LÝ CUỐI CA</span>
        </button>
      </div>

      {/* DANH SÁCH MẺ ĐANG CHẾ BIẾN DỞ DANG (NẾU CÓ) */}
      {activeBatches.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Flame className="h-4 w-4 text-amber-600" />
              <span>Các mẻ đang chế biến chưa cân thành phẩm ({activeBatches.length})</span>
            </div>
          </div>
          <div className="space-y-2">
            {activeBatches.map((b) => (
              <div
                key={b.id}
                className="bg-white p-3 rounded-xl border border-amber-200 shadow-sm flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-slate-800 text-sm">{b.itemName}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Mã: <span className="font-mono font-semibold">{b.batchCode}</span> | Vào: <span className="font-bold text-brand-600">{b.inputWeight} kg</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedFinishBatch(b);
                    const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${b.id}`);
                    if (savedDraft) {
                      setFinishOutputWeight(parseFloat(savedDraft));
                      showNotice('success', `Đã khôi phục số cân lưu tạm: ${savedDraft} kg`);
                    } else {
                      setFinishOutputWeight(b.inputWeight ? Math.round(b.inputWeight * 0.8 * 10) / 10 : 0);
                    }
                    setBatchTab('finish');
                    setActiveModal('batch');
                  }}
                  className="btn-touch px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                >
                  <Scale className="h-4 w-4" />
                  <span>Cân Xong</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: LẤY HÀNG RA BẾP                                      */}
      {/* ============================================================== */}
      {activeModal === 'takeOut' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2 text-blue-600 font-bold text-base">
                <Package className="h-6 w-6" />
                <span>NÚT 1: LẤY HÀNG RA BẾP</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleTakeOutSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">MÓN ĂN / NGUYÊN LIỆU</label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemName} ({i.unit}) - [{i.barcode || i.itemCode}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-600">SỐ LƯỢNG LẤY</label>
                  <span className="text-xs font-semibold text-blue-600">
                    Đơn vị: {items.find((i) => i.id === Number(selectedItemId))?.unit || 'KG'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="Nhập số lượng..."
                    value={takeOutQty}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      setTakeOutQty(val === '' ? '' : parseFloat(val) || 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ',') {
                        e.preventDefault();
                        const cur = String(takeOutQty ?? '');
                        if (!cur.includes('.')) {
                          setTakeOutQty(((cur ? cur : '0') + '.') as any);
                        }
                      }
                    }}
                    className="flex-1 h-12 px-4 rounded-xl border border-slate-300 font-extrabold text-xl text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-1.5">
                    {[5, 10, 20].map((inc) => (
                      <button
                        type="button"
                        key={inc}
                        onClick={() => setTakeOutQty(inc)}
                        className="btn-touch px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
                      >
                        {inc}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ (TÙY CHỌN)</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Xuất sơ chế ca trưa..."
                  value={takeOutNote}
                  onChange={(e) => setTakeOutNote(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isTakingOut}
                  className="btn-touch w-full h-14 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all"
                >
                  {isTakingOut ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>XÁC NHẬN LẤY HÀNG</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: CHẾ BIẾN MẺ & CÂN THÀNH PHẨM                          */}
      {/* ============================================================== */}
      {activeModal === 'batch' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <Flame className="h-6 w-6" />
                <span>NÚT 2: CHẾ BIẾN MẺ & CÂN HAO HỤT</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tab Chọn: Mở mẻ mới HOẶC Cân thành phẩm */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mt-4">
              <button
                onClick={() => setBatchTab('start')}
                className={`btn-touch py-2 rounded-lg text-xs font-bold transition-all ${
                  batchTab === 'start' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1. Mở Mẻ Mới
              </button>
              <button
                onClick={() => setBatchTab('finish')}
                className={`btn-touch py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  batchTab === 'finish' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Scale className="h-3.5 w-3.5" />
                <span>2. Cân Thành Phẩm ({activeBatches.length})</span>
              </button>
            </div>

            {/* TAB 1: MỞ MẺ MỚI */}
            {batchTab === 'start' && (
              <div className="space-y-4 mt-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MÓN CHẾ BIẾN</label>
                  <select
                    value={batchItemId}
                    onChange={(e) => setBatchItemId(Number(e.target.value))}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-emerald-500"
                  >
                    {items.map((i) => {
                      const recipe = recipes.find((r) => r.itemId === i.id);
                      return (
                        <option key={i.id} value={i.id}>
                          {i.itemName} {recipe ? `(Chuẩn hao hụt: ${recipe.standardLossRate}%)` : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">KHỐI LƯỢNG NGUYÊN LIỆU ĐẦU VÀO (KG)</label>
                    <span className="text-xs font-semibold text-emerald-600">
                      Đang nhập: <strong className="text-base text-slate-900 font-mono">{batchInputWeight}</strong> kg
                    </span>
                  </div>
                  <VirtualNumpad
                    value={batchInputWeight}
                    onChange={(val) => setBatchInputWeight(val)}
                    unit="kg"
                    quickAddValues={[1, 5, 10]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ MẺ</label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Cua hấp bia sả..."
                    value={batchNote}
                    onChange={(e) => setBatchNote(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => handleStartBatchSubmit(false)}
                    disabled={isStartingBatch}
                    className="btn-touch w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    {isStartingBatch ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Flame className="h-5 w-5" />
                        <span>BẮT ĐẦU CHẾ BIẾN MẺ</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: CÂN THÀNH PHẨM */}
            {batchTab === 'finish' && (
              <div className="space-y-4 mt-4">
                {activeBatches.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">Hiện không có mẻ nào đang làm dở dang</p>
                    <button
                      onClick={() => setBatchTab('start')}
                      className="mt-3 px-4 py-2 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-bold"
                    >
                      Mở mẻ chế biến mới
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">CHỌN MẺ CẦN CÂN THÀNH PHẨM</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activeBatches.map((b) => (
                          <div
                            key={b.id}
                            onClick={() => {
                              setSelectedFinishBatch(b);
                              const savedDraft = localStorage.getItem(`senviet_offline_finish_batch_${b.id}`);
                              if (savedDraft) {
                                setFinishOutputWeight(parseFloat(savedDraft));
                                showNotice('success', `Đã khôi phục số cân lưu tạm: ${savedDraft} kg`);
                              } else {
                                setFinishOutputWeight(b.inputWeight ? Math.round(b.inputWeight * 0.8 * 10) / 10 : 0);
                              }
                            }}
                            className={`p-3 rounded-xl border cursor-pointer transition-all ${
                              selectedFinishBatch?.id === b.id
                                ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                                : 'bg-white border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-sm text-slate-800">{b.itemName}</span>
                              <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                {b.batchCode}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
                              <span>Đầu vào: <strong className="text-slate-800">{b.inputWeight} kg</strong></span>
                              <span>Chuẩn hụt: <strong>{b.standardLossRate}%</strong></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {selectedFinishBatch && (
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700">KHỐI LƯỢNG THÀNH PHẨM CÂN ĐƯỢC (KG)</label>
                          <span className="text-xs text-slate-500">
                            Đang cân: <strong className="text-base text-slate-900 font-mono">{finishOutputWeight}</strong> / {selectedFinishBatch.inputWeight} kg
                          </span>
                        </div>
                        <VirtualNumpad
                          value={finishOutputWeight}
                          onChange={(val) => setFinishOutputWeight(val)}
                          unit="kg"
                          quickAddValues={[1, 5, 10]}
                          max={selectedFinishBatch.inputWeight}
                        />

                        {/* Realtime Loss Rate Preview */}
                        {finishOutputWeight > 0 && (
                          <div className="pt-1">
                            {(() => {
                              const inW = selectedFinishBatch.inputWeight;
                              const outW = finishOutputWeight;
                              const actualLoss = Math.round(((inW - outW) / inW) * 10000) / 100;
                              const isOver = actualLoss > selectedFinishBatch.standardLossRate;

                              return (
                                <div
                                  className={`p-3 rounded-lg border text-xs font-medium ${
                                    isOver
                                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                                      : 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                  }`}
                                >
                                  <div className="flex items-center justify-between font-bold">
                                    <span>Hao hụt thực tế: {actualLoss}%</span>
                                    <span>Chuẩn cho phép: {selectedFinishBatch.standardLossRate}%</span>
                                  </div>
                                  <div className="mt-1">
                                    {isOver ? (
                                      <span className="text-rose-700 font-bold flex items-center gap-1">
                                        <AlertTriangle className="h-4 w-4" />
                                        CẢNH BÁO: Vượt định mức hao hụt {Math.round((actualLoss - selectedFinishBatch.standardLossRate) * 100) / 100}%!
                                      </span>
                                    ) : (
                                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Đạt chuẩn định mức cho phép.
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        <button
                          onClick={handleFinishBatchSubmit}
                          disabled={isFinishingBatch || finishOutputWeight <= 0}
                          className="btn-touch w-full h-14 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                        >
                          {isFinishingBatch ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              <Scale className="h-5 w-5" />
                              <span>XÁC NHẬN HOÀN TẤT CÂN MẺ</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* POPUP CẢNH BÁO ĐỎ MẺ THỨ HAI (SECOND BATCH WARNING MODAL)      */}
      {/* ============================================================== */}
      {showSecondBatchWarning && pendingBatchRequest && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-rose-500 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 rounded-2xl bg-rose-100">
                <AlertTriangle className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-rose-700">CẢNH BÁO MẺ CHẾ BIẾN THỨ HAI!</h3>
                <p className="text-xs text-slate-500">Quy tắc chống thất thoát bếp</p>
              </div>
            </div>

            <p className="text-sm text-slate-700 leading-relaxed bg-rose-50 p-3.5 rounded-xl border border-rose-200">
              Món này đang có một mẻ chế biến <strong>chưa hoàn tất cân thành phẩm</strong>.
              Bạn có chắc chắn muốn mở thêm mẻ mới trước khi hoàn thành mẻ cũ?
            </p>

            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                type="button"
                onClick={() => {
                  setShowSecondBatchWarning(false);
                  setPendingBatchRequest(null);
                }}
                className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
              >
                HỦY BỎ
              </button>
              <button
                type="button"
                onClick={() => handleStartBatchSubmit(true)}
                disabled={isStartingBatch}
                className="btn-touch h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                {isStartingBatch ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>VẪN MỞ MẺ MỚI</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: POPUP CHẶN CỨNG BÁO HỎNG CHỜ DUYỆT (HTTP 422)    */}
      {/* ============================================================== */}
      {showUnapprovedDamageModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border-2 border-rose-600 animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-3 rounded-2xl bg-rose-100">
                <ShieldAlert className="h-8 w-8 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-base text-rose-700">CHẶN CỨNG: BÁO HỎNG CHỜ DUYỆT!</h3>
                <p className="text-xs text-slate-500 font-semibold">Quy tắc chống thất thoát bếp (Phase 8)</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 text-xs sm:text-sm leading-relaxed space-y-2">
              <p className="font-bold text-rose-800">
                {unapprovedDamageError ||
                  'Món này đang có mẻ/lô báo hỏng chờ Quản lý duyệt. Vui lòng liên hệ Quản lý phê duyệt trước khi mở mẻ mới!'}
              </p>
              <p className="text-slate-600 text-xs leading-normal">
                Để xóa bỏ hoàn toàn việc mở mẻ mới nhằm che giấu hao hụt/hỏng hóc mẻ trước, hệ thống
                <strong> chặn tuyệt đối</strong> thao tác bắt đầu mẻ mới cho đến khi Quản lý Chi nhánh phê duyệt
                đơn báo hỏng trước đó.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnapprovedDamageModal(false)}
                className="btn-touch w-full h-12 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center gap-1.5"
              >
                <span>ĐÃ HIỂU & LIÊN HỆ QUẢN LÝ</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: RA LINE (+1 ĐĨA)                                      */}
      {/* ============================================================== */}
      {activeModal === 'lineItem' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-base">
                <PlusCircle className="h-6 w-6" />
                <span>NÚT 3: BẤM RA LINE BUFFET (+1)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>+ Thêm món nhanh</span>
                </button>
                <button onClick={() => setActiveModal(null)} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Task 8.4 Business Rule Callout */}
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex items-start gap-2">
              <Info className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Khẳng định nghiệp vụ:</strong> Nút Ra Line chỉ ghi nhận số lượt khay/đĩa đưa ra quầy buffet để đối soát với CukCuk POS, <strong>TUYỆT ĐỐI KHÔNG TRỪ TỒN KHO</strong>.
              </span>
            </div>

            {/* Thanh tìm kiếm & lọc Station */}
            <div className="space-y-2 mt-3">
              <div className="relative">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm món ra line..."
                  value={lineSearchTerm}
                  onChange={(e) => setLineSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Station Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'ALL', label: 'Tất cả' },
                  { key: 'BEP_NONG', label: 'Bếp Nóng' },
                  { key: 'BEP_LANH', label: 'Bếp Lạnh' },
                  { key: 'BAR', label: 'Bar' },
                  { key: 'RA_LINE', label: 'Line Buffet' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => setSelectedStation(st.key as KitchenStation)}
                    className={`btn-touch px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                      selectedStation === st.key
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Mỗi lần nhấn nút <strong className="text-amber-700">+1 ĐĨA / KHAY</strong>, hệ thống tự động ghi nhận đĩa đưa ra line và loại bỏ hoàn toàn hiện tượng bấm đúp (chống double-click).
            </p>

            <div className="space-y-3 mt-4">
              {filterItemsByStation(items, selectedStation)
                .filter(
                  (it) =>
                    it.itemName.toLowerCase().includes(lineSearchTerm.toLowerCase()) ||
                    it.itemCode.toLowerCase().includes(lineSearchTerm.toLowerCase())
                )
                .map((item) => {
                  const isLoadingBtn = !!loadingLineButtons[item.id];
                  const isCooldown = !!cooldownButtons[item.id];
                  const isLocked = isLoadingBtn || isCooldown;
                  const countToday = lineCounters[item.id] || 0;
                  const isAnimating = animatingLineItemId === item.id;
                  const isShaking = shakingLineItemId === item.id;

                  return (
                    <div
                      key={item.id}
                      className={`relative p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3 overflow-hidden transition-all ${
                        isShaking ? 'ring-2 ring-amber-400 animate-haptic-shake' : ''
                      }`}
                    >
                      {/* Floating +1 pop badge animation */}
                      {isAnimating && (
                        <div className="absolute top-2 right-4 px-3 py-1 rounded-full bg-emerald-600 text-white font-black text-xs shadow-xl animate-float-up flex items-center gap-1 z-20 pointer-events-none">
                          <Check className="h-3.5 w-3.5" />
                          <span>+1 {item.unit}!</span>
                        </div>
                      )}

                      <div>
                        <div className="font-bold text-sm sm:text-base text-slate-900">{item.itemName}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5">
                          <span>Đã ra hôm nay:</span>
                          <span
                            className={`font-mono font-black transition-all ${
                              isAnimating ? 'text-emerald-600 scale-125' : 'text-amber-700'
                            }`}
                          >
                            {countToday}
                          </span>
                          <span>{item.unit}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded ml-1 font-semibold">
                            {item.category}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLineItemInc(item)}
                        disabled={isLocked}
                        className={`btn-touch px-4 h-12 rounded-xl text-white font-extrabold text-sm flex items-center gap-1.5 shadow-md active:scale-95 transition-all flex-shrink-0 ${
                          isLocked
                            ? 'bg-amber-300 cursor-not-allowed opacity-80'
                            : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                        }`}
                      >
                        {isLoadingBtn ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>ĐANG GHI...</span>
                          </>
                        ) : isCooldown ? (
                          <>
                            <Clock className="h-4 w-4 animate-pulse" />
                            <span>CHỜ 1.5s</span>
                          </>
                        ) : (
                          <>
                            <PlusCircle className="h-5 w-5" />
                            <span>+1 {item.unit}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: BÁO HỎNG NGUYÊN LIỆU (NÉN ẢNH CANVAS)                  */}
      {/* ============================================================== */}
      {activeModal === 'damage' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertTriangle className="h-6 w-6" />
                <span>NÚT 4: BÁO HỎNG NGUYÊN LIỆU</span>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleDamageSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">NGUYÊN LIỆU BÁO HỎNG</label>
                <select
                  value={damageItemId}
                  onChange={(e) => setDamageItemId(Number(e.target.value))}
                  className="w-full h-12 px-3 rounded-xl border border-slate-300 font-medium text-slate-800 focus:ring-2 focus:ring-rose-500"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.itemName} ({Number(i.costPrice).toLocaleString('vi-VN')} đ/{i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">SỐ LƯỢNG HỎNG</label>
                  <input
                    type="number"
                    step="any"
                    min="0.001"
                    placeholder="Nhập số lượng..."
                    value={damageQty}
                    onChange={(e) => {
                      const val = e.target.value.replace(',', '.');
                      setDamageQty(parseFloat(val) || 0);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === ',') {
                        e.preventDefault();
                        const cur = String(damageQty ?? '');
                        if (!cur.includes('.')) {
                          setDamageQty(((cur ? cur : '0') + '.') as any);
                        }
                      }
                    }}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">PHÂN LOẠI LÝ DO HỦY</label>
                  <select
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    className="w-full h-12 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    <optgroup label="1. Hủy do sơ chế / nấu hỏng">
                      <option value="HONG_SO_CHE_NAU">Hủy do sơ chế / nấu hỏng (chè cháy, cơm khê, nước dùng hỏng)</option>
                      <option value="HONG_CHE_BIEN">Lỗi thao tác chế biến của đầu bếp</option>
                    </optgroup>
                    <optgroup label="2. Hủy do nguyên liệu chết / ươn từ NCC">
                      <option value="HONG_DO_NHA_CUNG_CAP">Hủy do nguyên liệu chết / ươn từ NCC (cua chết, ghẹ óp, ngao thối)</option>
                      <option value="HONG_BAO_QUAN">Hư hỏng thiết bị lạnh / tủ cấp đông</option>
                    </optgroup>
                    <optgroup label="3. Hủy do thừa cuối ca">
                      <option value="HUY_THUA_CUOI_CA">Hủy do thừa cuối ca (hàng ra line không dùng hết theo quy định VSATTP)</option>
                      <option value="HET_HAN_SU_DUNG">Hết hạn sử dụng trong ngày</option>
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* CHỌN LÔ HÀNG (BATCH/LOT) ĐỂ TRUY VẾT NCC & CUA CHẾT */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  LÔ HÀNG LIÊN KẾT (TRUY VẾT LÔ NHẬP & NCC)
                </label>
                {availableBatches.length > 0 ? (
                  <select
                    value={selectedBatchCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedBatchCode(code);
                      const found = availableBatches.find((b) => b.batchCode === code);
                      if (found && (found.supplierCode || found.supplierName)) {
                        setDamageSupplier(found.supplierCode || found.supplierName || '');
                      }
                    }}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">-- Chọn lô nhập để truy vết chính xác NCC --</option>
                    {availableBatches.map((b) => (
                      <option key={b.id} value={b.batchCode}>
                        {b.batchCode} ({b.supplierName || b.supplierCode || 'NCC'} - Tồn: {b.currentStock} {b.unit})
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    placeholder="Mã lô (VD: LOT-202611-001) hoặc để trống..."
                    value={selectedBatchCode}
                    onChange={(e) => setSelectedBatchCode(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-rose-500"
                  />
                )}
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  * Ví dụ: Báo hỏng cua chết gắn với Lô LOT-202611-001 để trừ tồn lô và tính tỷ lệ hỏng của NCC Hải Sản Quảng Ninh.
                </span>
              </div>

              {damageReason === 'HONG_DO_NHA_CUNG_CAP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MÃ / TÊN NHÀ CUNG CẤP</label>
                  <input
                    type="text"
                    value={damageSupplier}
                    onChange={(e) => setDamageSupplier(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* UPLOAD & NÉN ẢNH CANVAS (Hỗ trợ 2 chế độ: Chụp trực tiếp & Chọn từ thư viện) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ẢNH MINH CHỨNG (NÉN TỰ ĐỘNG DƯỚI 250KB)</label>
                {/* Input 1: Chụp ảnh trực tiếp với camera sau */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />
                {/* Input 2: Chọn ảnh từ máy / thư viện nếu camera bị hạn chế quyền */}
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={handlePhotoSelect}
                  className="hidden"
                />

                {damageImage ? (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={damageImage.dataUrl}
                        alt="Preview"
                        className="h-14 w-14 object-cover rounded-lg border border-slate-300"
                      />
                      <div>
                        <div className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Đã nén thành công</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Dung lượng: <strong className="text-slate-800">{damageImage.compressedSizeKb} KB</strong> (từ {damageImage.originalSizeKb} KB)
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDamageImage(null)}
                      className="p-1.5 text-slate-400 hover:text-rose-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isCompressing}
                      className="btn-touch h-14 rounded-xl border-2 border-dashed border-rose-300 hover:border-rose-500 bg-rose-50/40 text-rose-800 flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      {isCompressing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <Camera className="h-5 w-5 text-rose-600" />
                          <span>Chụp Ảnh Ngay</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      disabled={isCompressing}
                      className="btn-touch h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50 text-slate-700 flex items-center justify-center gap-2 font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      {isCompressing ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <>
                          <ImageIcon className="h-5 w-5 text-slate-500" />
                          <span>Chọn Từ Thư Viện</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* DỰ TOÁN GIÁ TRỊ & TỰ ĐỘNG DUYỆT */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500">Giá trị ước tính:</span>
                  <div className="font-extrabold text-sm text-slate-900">
                    {estimatedDamageCost.toLocaleString('vi-VN')} VNĐ
                  </div>
                </div>
                <div>
                  {isAutoApprove ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Tự động duyệt (&le; 500k)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      Cần Quản lý duyệt (&gt; 500k)
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingDamage}
                  className="btn-touch w-full h-14 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-extrabold text-base flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all"
                >
                  {isSubmittingDamage ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5" />
                      <span>GỬI ĐƠN BÁO HỎNG</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: MODAL XÁC NHẬN GHI BỎ MÓN DÙNG TRONG NGÀY         */}
      {/* ============================================================== */}
      {showDailyWasteModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700 font-black text-base">
                <Salad className="h-6 w-6 text-emerald-600" />
                <span>XÁC NHẬN GHI BỎ MÓN DÙNG TRONG NGÀY (CUỐI CA)</span>
              </div>
              <button
                onClick={() => setShowDailyWasteModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDailyWaste} className="space-y-4 mt-4">
              {/* Business Rule Explanation */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs leading-relaxed space-y-1">
                <p className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  <span>Quy Chuẩn ATTP & Chống Thất Thoát (Task 8.3):</span>
                </p>
                <p className="text-emerald-900/90 text-xs">
                  Món tươi sống chỉ dùng trong ngày (salad, nộm, kim chi, bánh bao...) không được lưu cữu qua đêm.
                  Số lượng ghi bỏ này được hạch toán vào cột <strong>"Hỏng/bỏ có báo"</strong> của Bảng cuối ngày
                  và <strong>KHÔNG phạt tiền nhân viên</strong>.
                </p>
              </div>

              {/* Shift & Date Controls */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CA GHI BỎ</label>
                  <select
                    value={dailyWasteShift}
                    onChange={(e) => setDailyWasteShift(e.target.value as 'CA_TOI' | 'CA_SANG')}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CA_TOI">🌙 Ca Tối (Cuối ngày / Đóng ca)</option>
                    <option value="CA_SANG">🌅 Ca Sáng (Chuyển giao trưa)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NGÀY XỬ LÝ</label>
                  <input
                    type="date"
                    value={dailyWasteDate}
                    onChange={(e) => setDailyWasteDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ CHUNG</label>
                <input
                  type="text"
                  placeholder="Ghi bỏ salad và nộm cuối ngày..."
                  value={dailyWasteGeneralNote}
                  onChange={(e) => setDailyWasteGeneralNote(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Danh Sách Món Tươi Chỉ Dùng Trong Ngày ({dailyItems.length})
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Nhập số lượng đĩa / kg ghi bỏ thực tế
                  </span>
                </div>

                {isLoadingDailyItems ? (
                  <div className="p-8 text-center text-slate-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                    <span className="text-xs">Đang quét danh sách món chỉ dùng trong ngày...</span>
                  </div>
                ) : dailyItems.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Salad className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                    <p className="text-xs font-semibold">Chưa có món nào được đánh dấu là "Chỉ dùng trong ngày"</p>
                    <p className="text-[11px] mt-0.5">
                      Bấm "+ Thêm món nhanh" trên màn hình Ra Line và tích chọn "Món chỉ dùng trong ngày".
                    </p>
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0">
                        <tr>
                          <th className="p-2.5">Món ăn</th>
                          <th className="p-2.5">Tồn hiện tại</th>
                          <th className="p-2.5">Số lượng ghi bỏ</th>
                          <th className="p-2.5">Ghi chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {dailyItems.map((it) => (
                          <tr key={it.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{it.itemName}</div>
                              <span className="text-[10px] text-slate-500">{it.category}</span>
                            </td>
                            <td className="p-2.5 font-mono text-slate-700 font-semibold">
                              {it.remainingStock ?? 0} {it.unit}
                            </td>
                            <td className="p-2.5">
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  value={dailyWasteQuantities[it.id] ?? 0}
                                  onChange={(e) => {
                                    const val = e.target.value.replace(',', '.');
                                    setDailyWasteQuantities({
                                      ...dailyWasteQuantities,
                                      [it.id]: parseFloat(val) || 0,
                                    });
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === ',') {
                                      e.preventDefault();
                                      const cur = String(dailyWasteQuantities[it.id] ?? '');
                                      if (!cur.includes('.')) {
                                        setDailyWasteQuantities({
                                          ...dailyWasteQuantities,
                                          [it.id]: ((cur ? cur : '0') + '.') as any,
                                        });
                                      }
                                    }
                                  }}
                                  className="w-20 h-9 px-2 rounded-lg border border-slate-300 font-mono font-extrabold text-sm focus:ring-2 focus:ring-emerald-500"
                                />
                                <span className="text-xs font-bold text-slate-600">{it.unit}</span>
                              </div>
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                placeholder="Lý do hủy..."
                                value={dailyWasteItemNotes[it.id] || ''}
                                onChange={(e) =>
                                  setDailyWasteItemNotes({
                                    ...dailyWasteItemNotes,
                                    [it.id]: e.target.value,
                                  })
                                }
                                className="w-full h-8 px-2 rounded border border-slate-200 text-xs"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDailyWasteModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDailyWaste || dailyItems.length === 0}
                  className="btn-touch h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2"
                >
                  {isSubmittingDailyWaste ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG XÁC NHẬN...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN GHI BỎ CUỐI CA</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* GIAI ĐOẠN 8: MODAL THÊM MÓN NHANH TRỰC TIẾP RA LINE            */}
      {/* ============================================================== */}
      {showQuickAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[65] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <Plus className="h-6 w-6" />
                <span>THÊM NHANH MÓN RA LINE BUFFET</span>
              </div>
              <button
                onClick={() => setShowQuickAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleQuickAddLineItem} className="space-y-4 mt-4">
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                Thêm món mới ngay tại quầy bếp để bấm nút ra line (+1) mà không cần vào menu cấu hình của Quản trị viên.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">TÊN MÓN ĂN MỚI *</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nộm hoa chuối tai heo, Bánh bao chiên..."
                  value={quickItemName}
                  onChange={(e) => setQuickItemName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NHÓM MÓN</label>
                  <select
                    value={quickItemCategory}
                    onChange={(e) => setQuickItemCategory(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MÓN KHAI VỊ / SALAD">Khai vị / Salad</option>
                    <option value="MÓN NẤU / RA LINE">Món nấu / Ra line</option>
                    <option value="MÓN NƯỚNG">Món nướng</option>
                    <option value="HẢI SẢN">Hải sản</option>
                    <option value="TRÁNG MIỆNG">Tráng miệng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">ĐƠN VỊ TÍNH</label>
                  <select
                    value={quickItemUnit}
                    onChange={(e) => setQuickItemUnit(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 text-xs focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Đĩa">Đĩa</option>
                    <option value="Khay">Khay</option>
                    <option value="Nồi">Nồi</option>
                    <option value="Tô">Tô</option>
                    <option value="Bát">Bát</option>
                    <option value="Suất">Suất</option>
                    <option value="con">Con</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GIÁ VỐN ƯỚC TÍNH (Đ)</label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={quickItemCostPrice}
                  onChange={(e) => setQuickItemCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono text-sm focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Checkbox is_daily_only */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="chk-daily-only"
                  checked={quickIsDailyOnly}
                  onChange={(e) => setQuickIsDailyOnly(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="chk-daily-only" className="text-xs text-slate-700 font-medium cursor-pointer">
                  <strong className="block font-bold text-emerald-800">Món tươi chỉ dùng trong ngày</strong>
                  Tự động đưa vào danh sách kiểm đếm hủy bỏ cuối ca (salad, nộm, rau củ...).
                </label>
              </div>

              {/* Submit Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddModal(false)}
                  className="btn-touch h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingQuickAdd}
                  className="btn-touch h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  {isSubmittingQuickAdd ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>THÊM VÀO MENU LINE</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KitchenModule;
