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
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { kitchenApi, Item, Recipe, BatchResponse } from '../../api/kitchen';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';

export const KitchenModule: React.FC = () => {
  const { user } = useAuth();

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
  const [takeOutQty, setTakeOutQty] = useState<number>(5);
  const [takeOutNote, setTakeOutNote] = useState<string>('');
  const [isTakingOut, setIsTakingOut] = useState<boolean>(false);

  // --- Nút 2: Chế biến mẻ state ---
  const [batchTab, setBatchTab] = useState<'start' | 'finish'>('start');
  const [batchItemId, setBatchItemId] = useState<number | ''>('');
  const [batchInputWeight, setBatchInputWeight] = useState<number>(10);
  const [batchNote, setBatchNote] = useState<string>('');
  const [isStartingBatch, setIsStartingBatch] = useState<boolean>(false);
  // Cảnh báo mẻ thứ hai modal
  const [showSecondBatchWarning, setShowSecondBatchWarning] = useState<boolean>(false);
  const [pendingBatchRequest, setPendingBatchRequest] = useState<{ itemId: number; inputWeight: number; unit: string; note?: string } | null>(null);
  // Cân thành phẩm state
  const [selectedFinishBatch, setSelectedFinishBatch] = useState<BatchResponse | null>(null);
  const [finishOutputWeight, setFinishOutputWeight] = useState<number>(0);
  const [isFinishingBatch, setIsFinishingBatch] = useState<boolean>(false);

  // --- Nút 3: Ra line (+1) state & idempotency ---
  const [lineCounters, setLineCounters] = useState<{ [itemId: number]: number }>({});
  const [loadingLineButtons, setLoadingLineButtons] = useState<{ [itemId: number]: boolean }>({});

  // --- Nút 4: Báo hỏng state ---
  const [damageItemId, setDamageItemId] = useState<number | ''>('');
  const [damageQty, setDamageQty] = useState<number>(1);
  const [damageReason, setDamageReason] = useState<string>('HONG_DO_NHA_CUNG_CAP');
  const [damageSupplier, setDamageSupplier] = useState<string>('NCC_HAI_SAN_01');
  const [damageNote, setDamageNote] = useState<string>('');
  const [damageImage, setDamageImage] = useState<CompressionResult | null>(null);
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isSubmittingDamage, setIsSubmittingDamage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tải dữ liệu ban đầu
  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const [itemList, recipeList, batchList] = await Promise.all([
        kitchenApi.getBuffetItems(),
        kitchenApi.getRecipes(),
        kitchenApi.getActiveBatches()
      ]);
      setItems(itemList);
      setRecipes(recipeList);
      setActiveBatches(batchList);
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

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text });
    setTimeout(() => setStatusMessage(null), 4500);
  };

  // -------------------------------------------------------------
  // Xử lý Nút 1: LẤY HÀNG
  // -------------------------------------------------------------
  const handleTakeOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || takeOutQty <= 0) return;

    const item = items.find((i) => i.id === Number(selectedItemId));
    if (!item) return;

    try {
      setIsTakingOut(true);
      await kitchenApi.recordTakeOut({
        itemId: item.id,
        quantity: takeOutQty,
        unit: item.unit,
        note: takeOutNote || 'Lấy hàng ra bếp sơ chế',
      });
      showNotice('success', `Đã xuất kho ${takeOutQty} ${item.unit} ${item.itemName}`);
      setTakeOutNote('');
      setActiveModal(null);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || 'Lỗi khi lấy hàng');
    } finally {
      setIsTakingOut(false);
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 2: CHẾ BIẾN MẺ
  // -------------------------------------------------------------
  const handleStartBatchSubmit = async (force = false) => {
    if (!batchItemId || batchInputWeight <= 0) return;
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
      const res = await kitchenApi.startBatch(reqData);
      showNotice('success', `Đã khởi tạo mẻ [${res.data.batchCode}] cho món ${item.itemName}`);
      setShowSecondBatchWarning(false);
      setPendingBatchRequest(null);
      // Reload danh sách mẻ đang làm
      const updatedBatches = await kitchenApi.getActiveBatches();
      setActiveBatches(updatedBatches);
      setActiveModal(null);
    } catch (err: any) {
      if (err.response?.status === 409) {
        // Kích hoạt Modal Cảnh Báo Đỏ Mẻ Thứ Hai
        setPendingBatchRequest(reqData);
        setShowSecondBatchWarning(true);
      } else {
        showNotice('error', err.response?.data?.message || 'Lỗi khi tạo mẻ');
      }
    } finally {
      setIsStartingBatch(false);
    }
  };

  // Hoàn tất cân mẻ thành phẩm
  const handleFinishBatchSubmit = async () => {
    if (!selectedFinishBatch || finishOutputWeight <= 0) return;

    try {
      setIsFinishingBatch(true);
      const res = await kitchenApi.finishBatch({
        batchId: selectedFinishBatch.id,
        outputWeight: finishOutputWeight,
      });

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
      showNotice('error', err.response?.data?.message || 'Lỗi khi hoàn thành mẻ');
    } finally {
      setIsFinishingBatch(false);
    }
  };

  // -------------------------------------------------------------
  // Xử lý Nút 3: RA LINE (+1) kèm chống Double-Click
  // -------------------------------------------------------------
  const handleLineItemInc = async (item: Item) => {
    // Nếu nút đang loading thì lập tức bỏ qua (chặn bấm đúp phía client)
    if (loadingLineButtons[item.id]) return;

    // Khóa nút tức thì
    setLoadingLineButtons((prev) => ({ ...prev, [item.id]: true }));

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
      // Mở lại nút sau khi nhận kết quả từ backend
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

    try {
      setIsSubmittingDamage(true);
      const res = await kitchenApi.recordDamageReport({
        itemId: Number(damageItemId),
        quantity: damageQty,
        reason: damageReason,
        supplierCode: damageReason === 'HONG_DO_NHA_CUNG_CAP' ? damageSupplier : undefined,
        note: damageNote || undefined,
        imageUrls: damageImage?.dataUrl || undefined,
      });

      const report = res.data;
      if (report.status === 'TU_DONG_DUYET') {
        showNotice('success', `✅ Đơn báo hỏng đã được TỰ ĐỘNG DUYỆT (Giá trị: ${Number(report.estimatedValue).toLocaleString('vi-VN')} đ)`);
      } else {
        showNotice('error', `⚠️ Đơn báo hỏng giá trị cao (${Number(report.estimatedValue).toLocaleString('vi-VN')} đ) đang CHỜ QUẢN LÝ DUYỆT`);
      }

      setDamageNote('');
      setDamageImage(null);
      setActiveModal(null);
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || 'Lỗi khi gửi báo hỏng');
    } finally {
      setIsSubmittingDamage(false);
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

      {/* 4 NÚT BẤM CỰC LỚN (MOBILE-FIRST BUTTONS) */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* NÚT 1: LẤY HÀNG (Màu Xanh Dương) */}
        <button
          onClick={() => setActiveModal('takeOut')}
          className="btn-touch h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white p-4 flex flex-col justify-between shadow-lg shadow-blue-600/25 active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Package className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider">Nút 1</span>
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg leading-tight">LẤY HÀNG</div>
            <div className="text-xs text-blue-100 mt-0.5">Xuất kho sơ bộ ra bếp</div>
          </div>
        </button>

        {/* NÚT 2: CHẾ BIẾN MẺ (Màu Xanh Lá) */}
        <button
          onClick={() => {
            setBatchTab(activeBatches.length > 0 ? 'finish' : 'start');
            setActiveModal('batch');
          }}
          className="btn-touch h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white p-4 flex flex-col justify-between shadow-lg shadow-emerald-600/25 active:scale-[0.98] transition-all text-left relative overflow-hidden"
        >
          {activeBatches.length > 0 && (
            <span className="absolute top-3 right-3 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-300"></span>
            </span>
          )}
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <Flame className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider">Nút 2</span>
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg leading-tight">CHẾ BIẾN MẺ</div>
            <div className="text-xs text-emerald-100 mt-0.5">
              {activeBatches.length > 0 ? `${activeBatches.length} mẻ cần cân` : 'Mở mẻ & cân hụt'}
            </div>
          </div>
        </button>

        {/* NÚT 3: RA LINE (+1) (Màu Vàng / Hổ Phách) */}
        <button
          onClick={() => setActiveModal('lineItem')}
          className="btn-touch h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white p-4 flex flex-col justify-between shadow-lg shadow-amber-500/25 active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <PlusCircle className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider">Nút 3</span>
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg leading-tight">RA LINE (+1)</div>
            <div className="text-xs text-amber-100 mt-0.5">Ghi nhận đĩa ra buffet</div>
          </div>
        </button>

        {/* NÚT 4: BÁO HỎNG (Màu Đỏ Rose) */}
        <button
          onClick={() => setActiveModal('damage')}
          className="btn-touch h-28 sm:h-32 rounded-2xl bg-gradient-to-br from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white p-4 flex flex-col justify-between shadow-lg shadow-rose-600/25 active:scale-[0.98] transition-all text-left"
        >
          <div className="flex items-center justify-between w-full">
            <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-black/20 uppercase tracking-wider">Nút 4</span>
          </div>
          <div>
            <div className="font-extrabold text-base sm:text-lg leading-tight">BÁO HỎNG</div>
            <div className="text-xs text-rose-100 mt-0.5">Kèm ảnh chụp nén &lt;200KB</div>
          </div>
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
                    setFinishOutputWeight(b.inputWeight ? Math.round(b.inputWeight * 0.8 * 10) / 10 : 0);
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
                    step="0.5"
                    min="0.1"
                    value={takeOutQty}
                    onChange={(e) => setTakeOutQty(parseFloat(e.target.value) || 0)}
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
                    <label className="block text-xs font-bold text-slate-600">KHỐI LƯỢNG NGUYÊN LIỆU ĐẦU VÀO (KG)</label>
                    <span className="text-xs font-semibold text-emerald-600">Cân đầu vào</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={batchInputWeight}
                      onChange={(e) => setBatchInputWeight(parseFloat(e.target.value) || 0)}
                      className="flex-1 h-12 px-4 rounded-xl border border-slate-300 font-extrabold text-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                    <div className="flex gap-1.5">
                      {[10, 15, 20].map((inc) => (
                        <button
                          type="button"
                          key={inc}
                          onClick={() => setBatchInputWeight(inc)}
                          className="btn-touch px-3 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-xs text-slate-700"
                        >
                          {inc} kg
                        </button>
                      ))}
                    </div>
                  </div>
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
                              setFinishOutputWeight(b.inputWeight ? Math.round(b.inputWeight * 0.8 * 10) / 10 : 0);
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
                          <span className="text-xs text-slate-500">Cân đầu ra</span>
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max={selectedFinishBatch.inputWeight}
                          value={finishOutputWeight}
                          onChange={(e) => setFinishOutputWeight(parseFloat(e.target.value) || 0)}
                          className="w-full h-12 px-4 rounded-xl border border-slate-300 font-extrabold text-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
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
              <button onClick={() => setActiveModal(null)} className="p-2 text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Mỗi lần nhấn nút <strong className="text-amber-700">+1 ĐĨA / KHAY</strong>, hệ thống tự động ghi nhận đĩa đưa ra line và loại bỏ hoàn toàn hiện tượng bấm đúp (chống double-click).
            </p>

            <div className="space-y-3 mt-4">
              {items.map((item) => {
                const isLoadingBtn = !!loadingLineButtons[item.id];
                const countToday = lineCounters[item.id] || 0;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-bold text-sm sm:text-base text-slate-900">{item.itemName}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Đã ra hôm nay: <span className="font-extrabold text-amber-700">{countToday}</span> {item.unit}
                      </div>
                    </div>

                    <button
                      onClick={() => handleLineItemInc(item)}
                      disabled={isLoadingBtn}
                      className="btn-touch px-4 h-12 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-extrabold text-sm flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                    >
                      {isLoadingBtn ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>ĐANG GHI...</span>
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
                    step="0.5"
                    min="0.1"
                    value={damageQty}
                    onChange={(e) => setDamageQty(parseFloat(e.target.value) || 0)}
                    className="w-full h-12 px-3 rounded-xl border border-slate-300 font-extrabold text-lg text-slate-900 focus:ring-2 focus:ring-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">LÝ DO BÁO HỎNG</label>
                  <select
                    value={damageReason}
                    onChange={(e) => setDamageReason(e.target.value)}
                    className="w-full h-12 px-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="HONG_DO_NHA_CUNG_CAP">Do Nhà Cung Cấp</option>
                    <option value="HONG_CHE_BIEN">Trong Chế Biến</option>
                    <option value="HONG_BAO_QUAN">Do Bảo Quản / Tủ Đông</option>
                    <option value="HET_HAN_SU_DUNG">Hết Hạn Sử Dụng</option>
                  </select>
                </div>
              </div>

              {damageReason === 'HONG_DO_NHA_CUNG_CAP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">MÃ NHÀ CUNG CẤP</label>
                  <input
                    type="text"
                    value={damageSupplier}
                    onChange={(e) => setDamageSupplier(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              )}

              {/* UPLOAD & NÉN ẢNH CANVAS */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">CHỤP ẢNH MINH CHỨNG (NÉN TỰ ĐỘNG)</label>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isCompressing}
                    className="btn-touch w-full h-14 rounded-xl border-2 border-dashed border-slate-300 hover:border-rose-400 text-slate-600 hover:text-rose-600 flex items-center justify-center gap-2 font-bold text-xs"
                  >
                    {isCompressing ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Camera className="h-5 w-5" />
                        <span>CHỤP ẢNH / TẢI ẢNH BÁO HỎNG</span>
                      </>
                    )}
                  </button>
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
    </div>
  );
};

export default KitchenModule;
