import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { db } from '../../db/schema';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileSpreadsheet,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Eye,
  Sliders,
  Send,
  Sparkles,
  Check,
  X,
  Building2,
  Search,
  Filter,
  MessageSquare,
  Package,
} from 'lucide-react';

export interface DamageReportItem {
  id: number;
  branchId: number;
  itemId?: number;
  item?: {
    itemName: string;
    unit?: string;
  };
  itemName?: string;
  unit?: string;
  supplierCode?: string;
  quantity: number;
  estimatedValue: number;
  reason: string;
  imageUrls?: string;
  status: 'CHO_DUYET' | 'TU_DONG_DUYET' | 'DA_DUYET' | 'TU_CHOI';
  note?: string;
  rejectReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

export interface BatchItem {
  id: number;
  batchCode: string;
  branchId: number;
  itemId: number;
  itemName: string;
  chefName?: string;
  inputWeight: number;
  outputWeight?: number;
  standardLossRate: number;
  lossRate?: number;
  status: 'DANG_LAM' | 'HOAN_THANH';
  overStandard?: boolean;
  warningMessage?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface RecipeItem {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  standardLossRate: number;
  note?: string;
}

export interface PurchaseOrderItem {
  itemName: string;
  unit: string;
  quantity: number;
  qualityNote: string;
}

export interface PurchaseOrder {
  id: string;
  supplierName: string;
  supplierCode: string;
  deliveryDate: string;
  deliveryShift: string;
  items: PurchaseOrderItem[];
  generalNote?: string;
  status: 'DA_GUI' | 'DA_XAC_NHAN' | 'DANG_GIAO';
  createdAt: string;
  createdByName: string;
}

const DEFAULT_SUPPLIERS = [
  { code: 'TNLIEUCUA', name: 'Liên Cua Cà Mau (Thái Nguyên)' },
  { code: 'TNPHUONGGHE', name: 'Cô Phượng Ghẹ Nghệ An (Thái Nguyên)' },
  { code: 'TNDUNGCP', name: 'Dũng Cẩm Phả - Hải Sản (Thái Nguyên)' },
  { code: 'TNCOTHUY', name: 'Cô Thúy đồ khô (Thái Nguyên)' },
  { code: 'TNPHUONGRAU', name: 'Chị Phượng rau sạch (Thái Nguyên)' },
  { code: 'QVKHANHCAHOI', name: 'Khanh Cá Hồi Nauy (Quế Võ)' },
  { code: 'QVCOTHAO', name: 'Cô Thảo đồ khô & gia vị (Quế Võ)' },
];

export const HeadChefDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();

  // Active Tab: 1 = Báo hỏng, 2 = Mẻ chế biến, 3 = Đặt hàng NCC
  const [activeTab, setActiveTab] = useState<'DAMAGE_APPROVAL' | 'BATCH_MONITOR' | 'ORDER_SUPPLIER'>('DAMAGE_APPROVAL');

  // --- TAB 1: PHÊ DUYỆT BÁO HỎNG ---
  const [damageReports, setDamageReports] = useState<DamageReportItem[]>([]);
  const [filterDamageStatus, setFilterDamageStatus] = useState<string>('ALL');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [rejectingReport, setRejectingReport] = useState<DamageReportItem | null>(null);
  const [rejectReasonInput, setRejectReasonInput] = useState<string>('');

  // --- TAB 2: GIÁM SÁT MẺ & ĐỊNH MỨC ---
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [recipes, setRecipes] = useState<RecipeItem[]>([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | ''>('');
  const [newStandardRate, setNewStandardRate] = useState<string>('');
  const [adjustNote, setAdjustNote] = useState<string>('');

  // --- TAB 3: ĐẶT HÀNG NCC (Sheet BAOHANG) ---
  const [orderSupplier, setOrderSupplier] = useState<string>(DEFAULT_SUPPLIERS[0].name);
  const [orderSupplierCode, setOrderSupplierCode] = useState<string>(DEFAULT_SUPPLIERS[0].code);
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [deliveryDate, setDeliveryDate] = useState<string>(tomorrowStr);
  const [deliveryShift, setDeliveryShift] = useState<string>('Sáng mai (06:00 - 07:30)');
  const [generalNote, setGeneralNote] = useState<string>('Giao sớm trước 06:30 để kịp sơ chế cho ca buffet trưa');
  const [orderItems, setOrderItems] = useState<PurchaseOrderItem[]>([
    { itemName: 'Cua Thịt Cà Mau', unit: 'kg', quantity: 30, qualityNote: 'Cua tươi sống khỏe, dây trói mỏng <50g' },
    { itemName: 'Ghẹ Sống Nghệ An', unit: 'kg', quantity: 25, qualityNote: 'Size 4-5 con/kg đanh chắc thịt' },
    { itemName: 'Cá Hồi Nauy Phi Lê', unit: 'kg', quantity: 15, qualityNote: 'Phi lê tươi nguyên miếng, không rỉ dịch' },
  ]);

  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const saved = localStorage.getItem('senviet_headchef_orders');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [
      {
        id: 'BH-20261120-001',
        supplierName: 'Liên Cua Cà Mau (Thái Nguyên)',
        supplierCode: 'TNLIEUCUA',
        deliveryDate: '2026-11-20',
        deliveryShift: 'Sáng (06:00 - 07:30)',
        items: [
          { itemName: 'Cua Thịt Cà Mau', unit: 'kg', quantity: 35, qualityNote: 'Dây trói mỏng' },
        ],
        generalNote: 'Đã nhận đủ 35kg sáng nay lúc 06:15',
        status: 'DA_GIAO',
        createdAt: '2026-11-19 16:30',
        createdByName: 'Trần Thị Bếp Trưởng',
      } as any,
    ];
  });

  // Load Damage Reports & Batches from Dexie
  const loadData = async () => {
    try {
      if (db.damageReports) {
        const list = await db.damageReports.toArray();
        setDamageReports(list.reverse());
      }
      if (db.batches) {
        const batchList = await db.batches.toArray();
        setBatches(batchList.reverse());
      }
      if (db.recipes) {
        const recipeList = await db.recipes.toArray();
        if (recipeList.length > 0) {
          setRecipes(recipeList);
        } else {
          // Fallback sample recipes
          setRecipes([
            { id: 1, itemId: 1, itemCode: 'HS-CAHOI', itemName: 'Cá hồi phi lê Nauy', standardLossRate: 4.0 },
            { id: 2, itemId: 2, itemCode: 'THIT-BO', itemName: 'Ba chỉ bò Mỹ nướng', standardLossRate: 8.0 },
            { id: 3, itemId: 3, itemCode: 'HS-GHE', itemName: 'Ghẹ hấp bia sả', standardLossRate: 5.0 },
            { id: 4, itemId: 4, itemCode: 'LAU-THAI', itemName: 'Nước dùng Lẩu Thái Tomyum', standardLossRate: 6.0 },
          ]);
        }
      }
    } catch (e) {
      console.error('Error loading head chef data:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    localStorage.setItem('senviet_headchef_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  // Duyệt báo hỏng
  const handleApproveReport = async (reportId: number) => {
    const approver = user?.fullName || 'Trần Thị Bếp Trưởng';
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setDamageReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'DA_DUYET',
              approvedBy: approver,
              approvedAt: nowStr,
            }
          : r
      )
    );

    try {
      if (db.damageReports) {
        await db.damageReports.update(reportId, {
          status: 'DA_DUYET',
          approvedBy: approver,
          approvedAt: nowStr,
        });
      }
      showSuccess(`Bếp trưởng đã ký duyệt đơn báo hỏng #${reportId} thành công!`);
    } catch (e) {
      showError('Có lỗi khi cập nhật trạng thái đơn báo hỏng');
    }
  };

  // Từ chối báo hỏng
  const handleOpenRejectModal = (report: DamageReportItem) => {
    setRejectingReport(report);
    setRejectReasonInput('Nguyên liệu vẫn có thể tái sử dụng cho nước dùng / sơ chế bù');
  };

  const handleConfirmReject = async () => {
    if (!rejectingReport) return;
    const rejecter = user?.fullName || 'Trần Thị Bếp Trưởng';
    const nowStr = new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

    setDamageReports((prev) =>
      prev.map((r) =>
        r.id === rejectingReport.id
          ? {
              ...r,
              status: 'TU_CHOI',
              rejectReason: rejectReasonInput.trim(),
              approvedBy: rejecter,
              approvedAt: nowStr,
            }
          : r
      )
    );

    try {
      if (db.damageReports) {
        await db.damageReports.update(rejectingReport.id, {
          status: 'TU_CHOI',
          rejectReason: rejectReasonInput.trim(),
          approvedBy: rejecter,
          approvedAt: nowStr,
        });
      }
      showSuccess(`Đã từ chối đơn báo hỏng #${rejectingReport.id}`);
    } catch (e) {
      showError('Có lỗi khi từ chối đơn báo hỏng');
    }

    setRejectingReport(null);
  };

  // Điều chỉnh định mức chuẩn mẻ
  const handleUpdateStandardRate = async () => {
    if (!selectedRecipeId || !newStandardRate) {
      showError('Vui lòng chọn món ăn và nhập định mức chuẩn mới');
      return;
    }

    const rateNum = parseFloat(newStandardRate);
    if (isNaN(rateNum) || rateNum <= 0 || rateNum > 50) {
      showError('Định mức hao hụt chuẩn phải từ 0.1% đến 50%');
      return;
    }

    setRecipes((prev) =>
      prev.map((rec) =>
        rec.id === Number(selectedRecipeId)
          ? { ...rec, standardLossRate: rateNum, note: adjustNote.trim() }
          : rec
      )
    );

    try {
      if (db.recipes) {
        await db.recipes.update(Number(selectedRecipeId), {
          standardLossRate: rateNum,
          note: adjustNote.trim(),
        });
      }
      showSuccess(`Đã cập nhật định mức hao hụt chuẩn thành ${rateNum}%`);
      setSelectedRecipeId('');
      setNewStandardRate('');
      setAdjustNote('');
    } catch (e) {
      showError('Có lỗi khi lưu định mức vào cơ sở dữ liệu');
    }
  };

  // Thêm dòng đặt hàng NCC
  const handleAddOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      { itemName: '', unit: 'kg', quantity: 10, qualityNote: 'Tươi mới chuẩn chất lượng' },
    ]);
  };

  // Xóa dòng đặt hàng
  const handleRemoveOrderItem = (index: number) => {
    setOrderItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Gửi đơn báo hàng NCC
  const handleSubmitPurchaseOrder = () => {
    if (orderItems.length === 0) {
      showError('Vui lòng thêm ít nhất một mặt hàng để đặt');
      return;
    }

    const invalidItem = orderItems.find((i) => !i.itemName.trim() || i.quantity <= 0);
    if (invalidItem) {
      showError('Vui lòng điền đầy đủ tên món và số lượng > 0 cho tất cả các dòng');
      return;
    }

    const newOrder: PurchaseOrder = {
      id: `BH-${Date.now().toString().slice(-8)}`,
      supplierName: orderSupplier,
      supplierCode: orderSupplierCode,
      deliveryDate,
      deliveryShift,
      items: [...orderItems],
      generalNote: generalNote.trim(),
      status: 'DA_GUI',
      createdAt: new Date().toLocaleDateString('vi-VN') + ' ' + new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      createdByName: user?.fullName || 'Trần Thị Bếp Trưởng',
    };

    setPurchaseOrders((prev) => [newOrder, ...prev]);
    showSuccess(`Đã lập và gửi đơn báo hàng ${newOrder.id} cho nhà cung cấp [${orderSupplier}]!`);

    // Reset items to initial
    setOrderItems([
      { itemName: '', unit: 'kg', quantity: 10, qualityNote: 'Tươi mới chuẩn chất lượng' },
    ]);
  };

  // Filter damage reports
  const filteredReports = damageReports.filter((r) => {
    if (filterDamageStatus === 'ALL') return true;
    return r.status === filterDamageStatus;
  });

  const pendingReportCount = damageReports.filter((r) => r.status === 'CHO_DUYET').length;
  const overStandardBatchCount = batches.filter((b) => b.overStandard).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER BANNER: BẾP TRƯỞNG ĐIỀU HÀNH
      ───────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-amber-700 via-orange-800 to-amber-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-amber-950/20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-white text-xs font-bold">
              <ChefHat className="h-4 w-4 text-amber-300" />
              <span>TRUNG TÂM CHỈ HUY BẾP TRƯỞNG • HEAD CHEF CENTER</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Quản Trị Bếp, Duyệt Hỏng & Đặt Hàng NCC
            </h1>

            <p className="text-amber-100 text-xs sm:text-sm leading-relaxed max-w-2xl">
              Phê duyệt trực quan báo hỏng nguyên liệu, theo dõi tỷ lệ hao hụt mẻ chế biến của nhân viên và lập đơn đặt hàng giao sớm ngày mai theo sheet BAOHANG.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-amber-200">
              <span className="flex items-center gap-1 font-semibold">
                <Building2 className="w-3.5 h-3.5" /> Bếp Trưởng: {user?.fullName || 'Trần Thị Bếp Trưởng'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Ca Làm Việc Hiện Tại (Ca Trưa 10:00 - 14:30)
              </span>
            </div>
          </div>

          {/* Quick Counter Pills */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3 min-w-[200px]">
              <div className="h-9 w-9 rounded-xl bg-amber-400 text-amber-950 flex items-center justify-center font-black">
                {pendingReportCount}
              </div>
              <div className="text-xs">
                <div className="text-amber-200 font-semibold">Báo Hỏng Cần Duyệt</div>
                <div className="text-white font-bold">{pendingReportCount > 0 ? 'Cần xử lý ngay' : 'Đã duyệt hết'}</div>
              </div>
            </div>

            <div className="bg-black/20 backdrop-blur-md rounded-2xl p-3 border border-white/10 flex items-center gap-3 min-w-[200px]">
              <div className="h-9 w-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-black">
                {overStandardBatchCount}
              </div>
              <div className="text-xs">
                <div className="text-amber-200 font-semibold">Mẻ Vượt Hao Hụt</div>
                <div className="text-white font-bold">{overStandardBatchCount} mẻ cần nhắc nhở</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. NAV TABS CHỈ HUY (3 PHÂN HỆ)
      ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <button
          onClick={() => setActiveTab('DAMAGE_APPROVAL')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'DAMAGE_APPROVAL'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>1. Phê Duyệt Báo Hỏng</span>
          {pendingReportCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-white text-amber-800 text-[11px] font-black">
              {pendingReportCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('BATCH_MONITOR')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'BATCH_MONITOR'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>2. Giám Sát Mẻ & Định Mức</span>
          {overStandardBatchCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[11px] font-black">
              {overStandardBatchCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('ORDER_SUPPLIER')}
          className={`flex-1 min-w-[180px] py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${
            activeTab === 'ORDER_SUPPLIER'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>3. Đặt Hàng NCC (BAOHANG)</span>
        </button>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 1: PHÊ DUYỆT BÁO HỎNG (HẢI SẢN CHẾT / NẤU HỎNG)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'DAMAGE_APPROVAL' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Danh Sách Đơn Báo Hỏng Chờ Bếp Trưởng Duyệt
              </h3>
              <p className="text-xs text-slate-500">
                Xem hình ảnh minh chứng thực tế, phân loại lỗi NCC hay lỗi sơ chế và phê duyệt xuất hủy.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
              <button
                onClick={() => setFilterDamageStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterDamageStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                Tất cả ({damageReports.length})
              </button>
              <button
                onClick={() => setFilterDamageStatus('CHO_DUYET')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterDamageStatus === 'CHO_DUYET'
                    ? 'bg-amber-500 text-white shadow-xs font-extrabold'
                    : 'text-amber-700'
                }`}
              >
                Chờ duyệt ({pendingReportCount})
              </button>
              <button
                onClick={() => setFilterDamageStatus('DA_DUYET')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterDamageStatus === 'DA_DUYET' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-700'
                }`}
              >
                Đã duyệt
              </button>
              <button
                onClick={() => setFilterDamageStatus('TU_CHOI')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filterDamageStatus === 'TU_CHOI' ? 'bg-rose-600 text-white shadow-xs' : 'text-rose-700'
                }`}
              >
                Đã từ chối
              </button>
            </div>
          </div>

          {/* Grid danh sách các đơn */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredReports.length === 0 ? (
              <div className="col-span-2 text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200 text-slate-400 text-sm">
                Không có đơn báo hỏng nào theo trạng thái này.
              </div>
            ) : (
              filteredReports.map((report) => {
                const itemName = report.item?.itemName || report.itemName || 'Hải sản / Thực phẩm';
                const unit = report.item?.unit || report.unit || 'kg';
                return (
                  <div
                    key={report.id}
                    className={`bg-white rounded-3xl p-5 border shadow-card space-y-4 transition-all ${
                      report.status === 'CHO_DUYET'
                        ? 'border-amber-200 ring-2 ring-amber-500/10'
                        : report.status === 'DA_DUYET' || report.status === 'TU_DONG_DUYET'
                        ? 'border-emerald-200'
                        : 'border-rose-200'
                    }`}
                  >
                    {/* Header đơn */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{itemName}</h4>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-extrabold text-xs">
                            {report.quantity} {unit}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-0.5 block">
                          Mã phiếu: #{report.id} • Lô: {report.supplierCode || 'NCC'} • {report.createdAt}
                        </span>
                      </div>

                      {/* Status Badges */}
                      {report.status === 'CHO_DUYET' && (
                        <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Chờ Bếp trưởng duyệt
                        </span>
                      )}
                      {(report.status === 'DA_DUYET' || report.status === 'TU_DONG_DUYET') && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã duyệt
                        </span>
                      )}
                      {report.status === 'TU_CHOI' && (
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px] font-extrabold shrink-0 flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Từ chối
                        </span>
                      )}
                    </div>

                    {/* Image & Details */}
                    <div className="flex gap-4 items-center">
                      {report.imageUrls ? (
                        <div
                          onClick={() => setSelectedImage(report.imageUrls!)}
                          className="h-20 w-24 rounded-2xl overflow-hidden border border-slate-200 cursor-pointer relative group shrink-0 shadow-xs"
                        >
                          <img
                            src={report.imageUrls}
                            alt="Minh chứng báo hỏng"
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                            <Eye className="w-4 h-4 mr-1" /> Phóng to
                          </div>
                        </div>
                      ) : (
                        <div className="h-20 w-24 rounded-2xl bg-slate-100 border border-slate-200 flex flex-col items-center justify-center text-slate-400 text-[10px] font-semibold shrink-0">
                          <AlertTriangle className="w-5 h-5 mb-1 text-slate-300" />
                          Không có ảnh
                        </div>
                      )}

                      <div className="space-y-1.5 flex-1 min-w-0 text-xs">
                        <div className="text-slate-700 leading-snug">
                          <span className="font-bold text-slate-900">Lý do: </span>
                          <span className="text-slate-600">{report.reason}</span>
                        </div>
                        <div className="text-slate-600">
                          <span>Thiệt hại ước tính: </span>
                          <strong className="text-rose-600 font-extrabold">
                            {(report.estimatedValue || 0).toLocaleString('vi-VN')} đ
                          </strong>
                        </div>
                        {report.note && (
                          <div className="text-[11px] text-slate-400 italic truncate">
                            Ghi chú: {report.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Result Info if decided */}
                    {report.approvedBy && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                        <span>
                          {report.status === 'TU_CHOI' ? 'Từ chối bởi: ' : 'Người duyệt: '}
                          <strong className="text-slate-800">{report.approvedBy}</strong>
                        </span>
                        <span>{report.approvedAt}</span>
                      </div>
                    )}

                    {report.rejectReason && (
                      <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-800">
                        <strong>Lý do từ chối:</strong> {report.rejectReason}
                      </div>
                    )}

                    {/* Action buttons if CHO_DUYET */}
                    {report.status === 'CHO_DUYET' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleApproveReport(report.id)}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" /> Duyệt Xuất Hủy
                        </button>
                        <button
                          onClick={() => handleOpenRejectModal(report)}
                          className="py-2 px-3 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" /> Từ Chối
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 2: GIÁM SÁT MẺ CHẾ BIẾN & ĐIỀU CHỈNH ĐỊNH MỨC
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'BATCH_MONITOR' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Lịch sử và Giám sát Mẻ - 8 cột */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-orange-100 text-orange-700">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Theo Dõi Tỷ Lệ Hao Hụt Mẻ Chế Biến
                  </h3>
                  <p className="text-xs text-slate-500">Giám sát tay nghề nhân viên và đối soát hao hụt với định mức chuẩn</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                {batches.length} Mẻ
              </span>
            </div>

            {/* Batch Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 uppercase font-semibold text-[10px]">
                    <th className="pb-2">Mã Mẻ</th>
                    <th className="pb-2">Tên Món Chế Biến</th>
                    <th className="pb-2 text-right">Đầu Vào (kg)</th>
                    <th className="pb-2 text-right">Thành Phẩm (kg)</th>
                    <th className="pb-2 text-right">Hao Hụt Thực Tế</th>
                    <th className="pb-2 text-right">Chuẩn</th>
                    <th className="pb-2 text-center">Đánh Giá</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {batches.map((batch) => {
                    const isOver = batch.overStandard;
                    return (
                      <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 font-mono font-bold text-slate-700">
                          {batch.batchCode}
                        </td>
                        <td className="py-3 font-bold text-slate-900">
                          {batch.itemName}
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Đầu bếp: {batch.chefName || 'Nguyễn Văn Bếp'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-700">
                          {batch.inputWeight} kg
                        </td>
                        <td className="py-3 text-right font-bold text-slate-900">
                          {batch.outputWeight ? `${batch.outputWeight} kg` : <span className="text-amber-600 italic">Đang nấu</span>}
                        </td>
                        <td className="py-3 text-right">
                          {batch.lossRate !== undefined ? (
                            <span className={`font-black ${isOver ? 'text-rose-600' : 'text-emerald-700'}`}>
                              {batch.lossRate}%
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="py-3 text-right font-semibold text-slate-500">
                          {batch.standardLossRate}%
                        </td>
                        <td className="py-3 text-center">
                          {batch.status === 'DANG_LAM' ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                              Đang làm
                            </span>
                          ) : isOver ? (
                            <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold flex items-center justify-center gap-0.5">
                              <AlertTriangle className="w-3 h-3" /> Vượt chuẩn
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center justify-center gap-0.5">
                              <Check className="w-3 h-3" /> Đạt chuẩn
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Công cụ Chỉnh Định Mức Chuẩn - 4 cột */}
          <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Điều Chỉnh Định Mức Chuẩn
                </h3>
                <p className="text-xs text-slate-500">Bếp trưởng cập nhật % hao hụt chuẩn</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Món Ăn:</label>
                <select
                  value={selectedRecipeId}
                  onChange={(e) => {
                    const id = e.target.value ? Number(e.target.value) : '';
                    setSelectedRecipeId(id);
                    const found = recipes.find((r) => r.id === id);
                    if (found) {
                      setNewStandardRate(String(found.standardLossRate));
                    } else {
                      setNewStandardRate('');
                    }
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">-- Chọn công thức món --</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.itemName} (Hiện tại: {r.standardLossRate}%)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Định Mức Hao Hụt Chuẩn Mới (%):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="50"
                    value={newStandardRate}
                    onChange={(e) => setNewStandardRate(e.target.value)}
                    placeholder="VD: 4.5"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 pr-8"
                  />
                  <span className="absolute right-3 top-2.5 text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Lý Do Điều Chỉnh:</label>
                <textarea
                  rows={3}
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="VD: Điều chỉnh quy cách pha lóc tiết kiệm hơn cho mùa đông..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={handleUpdateStandardRate}
                className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" /> Cập Nhật Định Mức Chuẩn
              </button>
            </div>

            {/* Danh mục định mức hiện hành */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-extrabold uppercase text-slate-400 block tracking-wider">
                Định mức chuẩn đang áp dụng
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {recipes.map((r) => (
                  <div key={r.id} className="flex justify-between items-center p-2 rounded-xl bg-slate-50 text-xs">
                    <span className="font-medium text-slate-800">{r.itemName}</span>
                    <span className="font-black text-amber-700">{r.standardLossRate}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 3: LẬP ĐƠN BÁO HÀNG NCC (SHEET BAOHANG)
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'ORDER_SUPPLIER' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Form Lập đơn báo hàng - 7 cột */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Lập Đơn Báo Hàng Nhà Cung Cấp
                  </h3>
                  <p className="text-xs text-slate-500">Mẫu biểu chuẩn theo sheet BAOHANG (đặt hàng giao sớm ngày mai)</p>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                Sheet BAOHANG
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Chọn Nhà Cung Cấp:</label>
                <select
                  value={orderSupplierCode}
                  onChange={(e) => {
                    const code = e.target.value;
                    setOrderSupplierCode(code);
                    const found = DEFAULT_SUPPLIERS.find((s) => s.code === code);
                    if (found) setOrderSupplier(found.name);
                  }}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {DEFAULT_SUPPLIERS.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Ngày Giao Hàng Dự Kiến:</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Khung Giờ / Ca Nhận Hàng:</label>
                <select
                  value={deliveryShift}
                  onChange={(e) => setDeliveryShift(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Sáng mai (06:00 - 07:30)">Sáng mai (06:00 - 07:30) - Trước ca buffet trưa</option>
                  <option value="Chiều mai (14:00 - 15:30)">Chiều mai (14:00 - 15:30) - Chuẩn bị ca tối</option>
                </select>
              </div>
            </div>

            {/* Bảng Mặt Hàng Đặt */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">
                  Danh Sách Mặt Hàng Yêu Cầu ({orderItems.length} món)
                </label>
                <button
                  type="button"
                  onClick={handleAddOrderItem}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Thêm Mặt Hàng
                </button>
              </div>

              <div className="space-y-2">
                {orderItems.map((item, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center gap-2 text-xs"
                  >
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setOrderItems((prev) =>
                          prev.map((i, idx) => (idx === index ? { ...i, itemName: val } : i))
                        );
                      }}
                      placeholder="Tên mặt hàng (VD: Cua thịt, Rau muống...)"
                      className="flex-1 p-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-800"
                    />

                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        step="any"
                        min="0.1"
                        value={item.quantity || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setOrderItems((prev) =>
                            prev.map((i, idx) => (idx === index ? { ...i, quantity: val } : i))
                          );
                        }}
                        placeholder="SL"
                        className="w-20 p-2 bg-white rounded-xl border border-slate-200 font-bold text-slate-900 text-right"
                      />

                      <select
                        value={item.unit}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOrderItems((prev) =>
                            prev.map((i, idx) => (idx === index ? { ...i, unit: val } : i))
                          );
                        }}
                        className="w-16 p-2 bg-white rounded-xl border border-slate-200 font-medium text-slate-700"
                      >
                        <option value="kg">kg</option>
                        <option value="con">con</option>
                        <option value="túi">túi</option>
                        <option value="thùng">thùng</option>
                        <option value="chai">chai</option>
                      </select>

                      <input
                        type="text"
                        value={item.qualityNote}
                        onChange={(e) => {
                          const val = e.target.value;
                          setOrderItems((prev) =>
                            prev.map((i, idx) => (idx === index ? { ...i, qualityNote: val } : i))
                          );
                        }}
                        placeholder="Quy cách / Chất lượng..."
                        className="flex-1 sm:w-44 p-2 bg-white rounded-xl border border-slate-200 text-slate-600"
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveOrderItem(index)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl"
                        title="Xóa dòng"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* General Note & Submit */}
            <div className="space-y-2 pt-2">
              <label className="font-bold text-xs text-slate-700 block">Ghi Chú Đơn Hàng Cho NCC:</label>
              <textarea
                rows={2}
                value={generalNote}
                onChange={(e) => setGeneralNote(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <button
              onClick={handleSubmitPurchaseOrder}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Gửi Đơn Báo Hàng Cho Nhà Cung Cấp
            </button>
          </div>

          {/* Lịch Sử Đơn Báo Hàng Đã Lập - 5 cột */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900">
                Lịch Sử Đơn Báo Hàng
              </h3>
              <span className="text-xs text-slate-400 font-semibold">{purchaseOrders.length} đơn</span>
            </div>

            <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
              {purchaseOrders.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Chưa có đơn đặt hàng nào được lập.
                </div>
              ) : (
                purchaseOrders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono font-extrabold text-slate-800">{order.id}</span>
                        <h5 className="font-bold text-slate-900 mt-0.5">{order.supplierName}</h5>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        {order.status === 'DA_GUI' ? 'Đã gửi NCC' : 'Đã nhận hàng'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500">
                      Giao: <strong>{order.deliveryDate}</strong> ({order.deliveryShift})
                    </div>

                    <div className="p-2 rounded-xl bg-white border border-slate-100 space-y-1">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between items-center text-slate-700">
                          <span>{it.itemName}</span>
                          <span className="font-bold text-slate-900">
                            {it.quantity} {it.unit}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.generalNote && (
                      <div className="text-[11px] text-slate-500 italic">
                        &quot;{order.generalNote}&quot;
                      </div>
                    )}

                    <div className="text-[10px] text-slate-400 pt-1 flex justify-between border-t border-slate-200/60">
                      <span>Người lập: {order.createdByName}</span>
                      <span>{order.createdAt}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL PHÓNG TO HÌNH ẢNH MINH CHỨNG
      ───────────────────────────────────────────────────────────── */}
      {selectedImage && (
        <div
          onClick={() => setSelectedImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div className="relative max-w-2xl w-full bg-slate-900 rounded-3xl overflow-hidden p-2 shadow-2xl">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 text-white rounded-full hover:bg-black"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={selectedImage}
              alt="Minh chứng chi tiết"
              className="w-full max-h-[80vh] object-contain rounded-2xl"
            />
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          MODAL TỪ CHỐI BÁO HỎNG
      ───────────────────────────────────────────────────────────── */}
      {rejectingReport && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="font-bold text-base text-slate-900">Từ Chối Đơn Báo Hỏng #{rejectingReport.id}</h4>
              <button onClick={() => setRejectingReport(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Vui lòng nhập lý do từ chối để nhân viên bếp và kế toán nắm được thông tin xử lý:
            </p>

            <textarea
              rows={3}
              value={rejectReasonInput}
              onChange={(e) => setRejectReasonInput(e.target.value)}
              className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectingReport(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl"
              >
                Xác Nhận Từ Chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HeadChefDashboard;
