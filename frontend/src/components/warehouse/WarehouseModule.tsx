import React, { useState, useEffect, useRef } from 'react';
import {
  Boxes,
  PackagePlus,
  ClipboardCheck,
  Building2,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  Download,
  Upload,
  Plus,
  Trash2,
  Search,
  Eye,
  Camera,
  X,
  Loader2,
  RotateCw,
  Clock,
  ChevronRight,
  ShieldAlert,
  FileSpreadsheet,
  Award,
  Layers,
  ArrowUpDown,
  Phone,
  MapPin,
  Tag
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  warehouseApi,
  Supplier,
  ImportBatch,
  WarehouseDocument,
  InventoryStock,
  InventoryCheck,
  SupplierLossReport,
  CreateDocumentRequest,
  CreateSupplierRequest,
  CreateInventoryCheckRequest,
} from '../../api/warehouse';
import { kitchenApi, Item } from '../../api/kitchen';
import { compressImage, CompressionResult } from '../../utils/imageCompressor';

type WarehouseTab = 'documents' | 'batches' | 'suppliers' | 'inventory-check' | 'loss-report';

export const WarehouseModule: React.FC = () => {
  const { user } = useAuth();

  // Active top tab
  const [activeTab, setActiveTab] = useState<WarehouseTab>('documents');

  // Common notification
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotice({ type, text });
    setTimeout(() => setNotice(null), 6000);
  };

  // Common data
  const [buffetItems, setBuffetItems] = useState<Item[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [documents, setDocuments] = useState<WarehouseDocument[]>([]);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [stocks, setStocks] = useState<InventoryStock[]>([]);
  const [checks, setChecks] = useState<InventoryCheck[]>([]);
  const [lossReports, setLossReports] = useState<SupplierLossReport[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [docTypeFilter, setDocTypeFilter] = useState<string>('ALL');
  const [batchSearchTerm, setBatchSearchTerm] = useState<string>('');
  const [reportMonth, setReportMonth] = useState<number>(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState<number>(new Date().getFullYear());

  // =========================================================================
  // MODAL STATES
  // =========================================================================
  // Modal Tạo Phiếu Nhập / Huỷ Kho
  const [showDocModal, setShowDocModal] = useState<boolean>(false);
  const [docType, setDocType] = useState<'NHAP' | 'XUAT_CHUYEN' | 'HUY'>('NHAP');
  const [selectedSupplierId, setSelectedSupplierId] = useState<number | undefined>(undefined);
  const [docNote, setDocNote] = useState<string>('');
  const [docItems, setDocItems] = useState<
    { itemId: number; quantity: number; unitPrice: number; expiryDate: string; batchId?: number }[]
  >([]);
  const [docImages, setDocImages] = useState<CompressionResult[]>([]);
  const [isSubmittingDoc, setIsSubmittingDoc] = useState<boolean>(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  // Modal Chi Tiết Phiếu Kho
  const [viewingDoc, setViewingDoc] = useState<WarehouseDocument | null>(null);

  // Modal Thêm / Sửa Nhà Cung Cấp
  const [showSupplierModal, setShowSupplierModal] = useState<boolean>(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierCode, setSupplierCode] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierPhone, setSupplierPhone] = useState<string>('');
  const [supplierAddress, setSupplierAddress] = useState<string>('');
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState<boolean>(false);

  // Modal / Form Kiểm Kê Kho Đầu Ca / Cuối Ca
  const [showCheckModal, setShowCheckModal] = useState<boolean>(false);
  const [checkShift, setCheckShift] = useState<string>('CA_TOI');
  const [checkDate, setCheckDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [checkNote, setCheckNote] = useState<string>('');
  const [checkItemRows, setCheckItemRows] = useState<
    {
      itemId: number;
      itemName: string;
      itemCode: string;
      unit: string;
      batchId?: number;
      batchCode?: string;
      systemStock: number;
      actualStock: number;
      reason: string;
    }[]
  >([]);
  const [isSubmittingCheck, setIsSubmittingCheck] = useState<boolean>(false);
  const [viewingCheck, setViewingCheck] = useState<InventoryCheck | null>(null);

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState<boolean>(false);

  // =========================================================================
  // LOAD DATA
  // =========================================================================
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [itemsRes, suppliersRes, docsRes, batchesRes, stocksRes, checksRes, lossRes] =
        await Promise.allSettled([
          kitchenApi.getBuffetItems(),
          warehouseApi.getSuppliers(),
          warehouseApi.getDocuments(),
          warehouseApi.getAllBatches(),
          warehouseApi.getStocks(),
          warehouseApi.getInventoryChecks(),
          warehouseApi.getSupplierLossReport({ month: reportMonth, year: reportYear }),
        ]);

      if (itemsRes.status === 'fulfilled') setBuffetItems(itemsRes.value);
      if (suppliersRes.status === 'fulfilled') setSuppliers(suppliersRes.value);
      if (docsRes.status === 'fulfilled') setDocuments(docsRes.value);
      if (batchesRes.status === 'fulfilled') setBatches(batchesRes.value);
      if (stocksRes.status === 'fulfilled') setStocks(stocksRes.value);
      if (checksRes.status === 'fulfilled') setChecks(checksRes.value);
      if (lossRes.status === 'fulfilled') setLossReports(lossRes.value);
    } catch (err) {
      console.error('Lỗi khi nạp dữ liệu phân hệ kho:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [reportMonth, reportYear]);

  // =========================================================================
  // HANDLERS: WAREHOUSE DOCUMENTS
  // =========================================================================
  const handleOpenDocModal = (type: 'NHAP' | 'XUAT_CHUYEN' | 'HUY') => {
    setDocType(type);
    setSelectedSupplierId(suppliers.length > 0 ? suppliers[0].id : undefined);
    setDocNote('');
    setDocImages([]);

    // Default 1 line item
    if (buffetItems.length > 0) {
      setDocItems([
        {
          itemId: buffetItems[0].id,
          quantity: 10,
          unitPrice: buffetItems[0].costPrice || 250000,
          expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
        },
      ]);
    } else {
      setDocItems([]);
    }
    setShowDocModal(true);
  };

  const handleAddDocItem = () => {
    if (buffetItems.length === 0) return;
    setDocItems([
      ...docItems,
      {
        itemId: buffetItems[0].id,
        quantity: 10,
        unitPrice: buffetItems[0].costPrice || 200000,
        expiryDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      },
    ]);
  };

  const handleRemoveDocItem = (index: number) => {
    setDocItems(docItems.filter((_, i) => i !== index));
  };

  const handleDocItemChange = (index: number, field: string, value: any) => {
    const updated = [...docItems];
    if (field === 'itemId') {
      const selectedItem = buffetItems.find((i) => i.id === Number(value));
      updated[index] = {
        ...updated[index],
        itemId: Number(value),
        unitPrice: selectedItem?.costPrice || updated[index].unitPrice,
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setDocItems(updated);
  };

  const handleDocPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (docImages.length + files.length > 5) {
      showNotice('error', 'Chỉ được đính kèm tối đa 5 ảnh hóa đơn/chứng từ');
      return;
    }

    try {
      const compressedList: CompressionResult[] = [];
      for (let i = 0; i < files.length; i++) {
        const res = await compressImage(files[i], 1280, 720, 0.75);
        compressedList.push(res);
      }
      setDocImages([...docImages, ...compressedList]);
      showNotice('success', `Đã nén và thêm ${files.length} ảnh chứng từ thành công`);
    } catch (err) {
      console.error('Lỗi khi nén ảnh phiếu kho:', err);
      showNotice('error', 'Lỗi khi nén ảnh chứng từ');
    } finally {
      if (docFileInputRef.current) docFileInputRef.current.value = '';
    }
  };

  const calculateDocTotal = () => {
    return docItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  };

  const handleSubmitDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docItems.length === 0) {
      showNotice('error', 'Vui lòng thêm ít nhất một mặt hàng vào phiếu');
      return;
    }

    try {
      setIsSubmittingDoc(true);
      const payload: CreateDocumentRequest = {
        docType,
        supplierId: docType === 'NHAP' ? selectedSupplierId : undefined,
        note: docNote || undefined,
        imageUrls: docImages.map((img) => img.dataUrl).join(';'),
        items: docItems.map((item) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          expiryDate: item.expiryDate || undefined,
          batchId: item.batchId,
        })),
      };

      const res = await warehouseApi.createDocument(payload);
      showNotice('success', `✅ Đã tạo ${res.docCode || 'phiếu kho'} thành công! Tồn kho và Lô hàng đã được cập nhật.`);
      setShowDocModal(false);
      loadAllData();
    } catch (err: any) {
      console.error('Lỗi tạo phiếu kho:', err);
      showNotice('error', err.response?.data?.message || 'Không thể tạo phiếu kho. Vui lòng kiểm tra lại');
    } finally {
      setIsSubmittingDoc(false);
    }
  };

  // =========================================================================
  // HANDLERS: SUPPLIERS
  // =========================================================================
  const handleOpenSupplierModal = (sup?: Supplier) => {
    if (sup) {
      setEditingSupplier(sup);
      setSupplierCode(sup.supplierCode);
      setSupplierName(sup.supplierName);
      setSupplierPhone(sup.phone || '');
      setSupplierAddress(sup.address || '');
    } else {
      setEditingSupplier(null);
      setSupplierCode(`NCC-${Math.floor(100 + Math.random() * 900)}`);
      setSupplierName('');
      setSupplierPhone('');
      setSupplierAddress('');
    }
    setShowSupplierModal(true);
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierCode.trim() || !supplierName.trim()) {
      showNotice('error', 'Mã và Tên Nhà Cung Cấp không được để trống');
      return;
    }

    try {
      setIsSubmittingSupplier(true);
      const req: CreateSupplierRequest = {
        supplierCode: supplierCode.trim(),
        supplierName: supplierName.trim(),
        phone: supplierPhone.trim() || undefined,
        address: supplierAddress.trim() || undefined,
        status: 'ACTIVE',
      };

      if (editingSupplier) {
        await warehouseApi.updateSupplier(editingSupplier.id, req);
        showNotice('success', `Cập nhật NCC "${req.supplierName}" thành công`);
      } else {
        await warehouseApi.createSupplier(req);
        showNotice('success', `Đã thêm Nhà Cung Cấp "${req.supplierName}" thành công`);
      }
      setShowSupplierModal(false);
      loadAllData();
    } catch (err: any) {
      showNotice('error', err.response?.data?.message || 'Lỗi khi lưu thông tin NCC');
    } finally {
      setIsSubmittingSupplier(false);
    }
  };

  // =========================================================================
  // HANDLERS: INVENTORY CHECKS (KIỂM KÊ CA)
  // =========================================================================
  const handleOpenCheckModal = () => {
    setCheckShift('CA_TOI');
    setCheckDate(new Date().toISOString().split('T')[0]);
    setCheckNote('');

    // Pre-populate items from current stocks or buffet items
    const rows = (stocks.length > 0 ? stocks : buffetItems).map((item: any) => {
      const currentQty = item.quantity !== undefined ? Number(item.quantity) : 25;
      return {
        itemId: item.itemId || item.id,
        itemName: item.itemName,
        itemCode: item.itemCode,
        unit: item.unit,
        batchId: item.batchId,
        batchCode: item.batchCode,
        systemStock: currentQty,
        actualStock: currentQty, // default equal
        reason: '',
      };
    });

    setCheckItemRows(rows);
    setShowCheckModal(true);
  };

  const handleActualStockChange = (index: number, val: number) => {
    const updated = [...checkItemRows];
    updated[index].actualStock = val;
    setCheckItemRows(updated);
  };

  const handleReasonChange = (index: number, reason: string) => {
    const updated = [...checkItemRows];
    updated[index].reason = reason;
    setCheckItemRows(updated);
  };

  const handleSubmitInventoryCheck = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check validation: any difference must have reason
    const unreasonedItems = checkItemRows.filter(
      (r) => r.actualStock !== r.systemStock && !r.reason.trim()
    );

    if (unreasonedItems.length > 0) {
      showNotice(
        'error',
        `⚠️ Có ${unreasonedItems.length} mặt hàng chênh lệch chưa điền lý do! Quy chuẩn kiểm kê bắt buộc phải giải trình lý do lệch.`
      );
      return;
    }

    try {
      setIsSubmittingCheck(true);
      const payload: CreateInventoryCheckRequest = {
        shift: checkShift,
        checkDate: checkDate,
        note: checkNote || undefined,
        items: checkItemRows.map((r) => ({
          itemId: r.itemId,
          batchId: r.batchId,
          systemStock: r.systemStock,
          actualStock: r.actualStock,
          reason: r.actualStock !== r.systemStock ? r.reason : undefined,
        })),
      };

      const res = await warehouseApi.createInventoryCheck(payload);
      showNotice('success', `✅ Đã lưu Biên Bản Kiểm Kê ${res.checkCode || ''} thành công!`);
      setShowCheckModal(false);
      loadAllData();
    } catch (err: any) {
      console.error('Lỗi khi lưu biên bản kiểm kê:', err);
      showNotice('error', err.response?.data?.message || 'Không thể lưu biên bản kiểm kê');
    } finally {
      setIsSubmittingCheck(false);
    }
  };

  // =========================================================================
  // HANDLERS: EXPORT EXCEL
  // =========================================================================
  const handleExportLossExcel = async () => {
    try {
      setIsExportingExcel(true);
      const blob = await warehouseApi.exportSupplierLossExcel({
        month: reportMonth,
        year: reportYear,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Bao_Cao_Ty_Le_Hong_NCC_T${reportMonth}_${reportYear}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showNotice('success', '✅ Đã tải file Excel báo cáo % hỏng NCC thành công!');
    } catch (err) {
      console.error('Lỗi xuất Excel:', err);
      showNotice('error', 'Không thể xuất file Excel. Vui lòng thử lại');
    } finally {
      setIsExportingExcel(false);
    }
  };

  // =========================================================================
  // FILTERED DATA
  // =========================================================================
  const filteredDocs = documents.filter((doc) => {
    if (docTypeFilter === 'ALL') return true;
    return doc.docType === docTypeFilter;
  });

  const filteredBatches = batches.filter((b) => {
    if (!batchSearchTerm.trim()) return true;
    const term = batchSearchTerm.toLowerCase();
    return (
      b.batchCode.toLowerCase().includes(term) ||
      (b.itemName && b.itemName.toLowerCase().includes(term)) ||
      (b.supplierName && b.supplierName.toLowerCase().includes(term))
    );
  });

  // Calculate Loss Report stats
  const totalImportedKg = lossReports.reduce(
    (s, r) => s + Number(r.totalPurchasedQty ?? r.importedQuantity ?? 0),
    0
  );
  const totalDamagedKg = lossReports.reduce(
    (s, r) => s + Number(r.totalDamagedQty ?? r.damagedQuantity ?? 0),
    0
  );
  const avgLossRate = totalImportedKg > 0 ? (totalDamagedKg / totalImportedKg) * 100 : 0;
  const highRiskSuppliersCount = lossReports.filter(
    (r) => Number(r.damageRatePercentage ?? r.lossRate ?? 0) > 5.0
  ).length;

  return (
    <div className="space-y-6">
      {/* =================================================================== */}
      {/* HEADER BANNER & BREADCRUMB                                         */}
      {/* =================================================================== */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold backdrop-blur-sm mb-2 border border-indigo-500/30">
              <Boxes className="h-3.5 w-3.5" />
              <span>Giai Đoạn 7: Phân Hệ Kho Cơ Sở & Lô Hàng</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>QUẢN TRỊ KHO, LÔ NHẬP & NHÀ CUNG CẤP</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">
              Chi nhánh: <span className="font-bold text-amber-400">{user?.branchName || 'Chi nhánh Thái Nguyên'}</span> |
              Theo dõi Lô hàng (Lots), Chứng từ kho, Kiểm kê ca & Báo cáo % Hỏng NCC
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenDocModal('NHAP')}
              className="btn-touch px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-95 transition-all"
            >
              <PackagePlus className="h-4 w-4" />
              <span>+ NHẬP KHO</span>
            </button>
            <button
              onClick={handleOpenCheckModal}
              className="btn-touch px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <ClipboardCheck className="h-4 w-4" />
              <span>KIỂM KÊ CA</span>
            </button>
            <button
              onClick={loadAllData}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all"
              title="Tải lại dữ liệu"
            >
              <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* TOP TAB NAVIGATION */}
        <div className="flex items-center gap-1 mt-6 border-t border-slate-800 pt-4 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'documents'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Phiếu Kho & Chứng Từ ({documents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('batches')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'batches'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Tag className="h-4 w-4" />
            <span>Lô Hàng & Tồn Kho ({batches.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'suppliers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Nhà Cung Cấp ({suppliers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory-check')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory-check'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>Kiểm Kê Đầu / Cuối Ca ({checks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('loss-report')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'loss-report'
                ? 'bg-amber-500 text-slate-900 shadow-md shadow-amber-500/30 font-extrabold'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingDown className="h-4 w-4" />
            <span>Báo Cáo % Hỏng NCC</span>
          </button>
        </div>
      </div>

      {/* NOTIFICATION TOAST */}
      {notice && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2 border ${
            notice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {notice.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-semibold">{notice.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 1: PHIẾU KHO & CHỨNG TỪ (DOCUMENTS)                            */}
      {/* =================================================================== */}
      {activeTab === 'documents' && (
        <div className="space-y-4">
          {/* Action & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              <span className="text-xs font-bold text-slate-400 uppercase">Loại phiếu:</span>
              {(['ALL', 'NHAP', 'HUY', 'XUAT_CHUYEN'] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => setDocTypeFilter(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    docTypeFilter === type
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {type === 'ALL'
                    ? 'Tất cả'
                    : type === 'NHAP'
                    ? '📥 Nhập kho'
                    : type === 'HUY'
                    ? '🗑️ Xuất huỷ'
                    : '🔄 Xuất chuyển'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenDocModal('NHAP')}
                className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>Lập Phiếu Nhập</span>
              </button>
              <button
                onClick={() => handleOpenDocModal('HUY')}
                className="btn-touch px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" />
                <span>Lập Phiếu Huỷ</span>
              </button>
            </div>
          </div>

          {/* Documents Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="p-8 text-center text-slate-500">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-indigo-600 mb-2" />
                <span>Đang tải danh sách phiếu kho...</span>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="p-10 text-center text-slate-400">
                <Boxes className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">Chưa có chứng từ kho nào được tạo</p>
                <p className="text-xs mt-1">Bấm nút "Lập Phiếu Nhập" để nhập lô hàng mới từ nhà cung cấp</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                      <th className="p-3.5">Mã Phiếu</th>
                      <th className="p-3.5">Loại</th>
                      <th className="p-3.5">Nhà Cung Cấp / Đối Tác</th>
                      <th className="p-3.5">Số Mặt Hàng</th>
                      <th className="p-3.5">Tổng Giá Trị</th>
                      <th className="p-3.5">Người Lập</th>
                      <th className="p-3.5">Thời Gian</th>
                      <th className="p-3.5 text-center">Ảnh CT</th>
                      <th className="p-3.5 text-right">Chi Tiết</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredDocs.map((doc) => {
                      const imageCount = doc.imageUrls ? doc.imageUrls.split(';').filter(Boolean).length : 0;
                      return (
                        <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-indigo-700">{doc.docCode}</td>
                          <td className="p-3.5">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                doc.docType === 'NHAP'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : doc.docType === 'HUY'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {doc.docType === 'NHAP'
                                ? 'Nhập kho'
                                : doc.docType === 'HUY'
                                ? 'Xuất huỷ'
                                : 'Xuất chuyển'}
                            </span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-900">
                            {doc.supplierName || doc.supplierCode || 'Nội bộ chi nhánh'}
                          </td>
                          <td className="p-3.5 font-medium">{doc.items ? doc.items.length : 0} mặt hàng</td>
                          <td className="p-3.5 font-bold text-slate-900">
                            {Number(doc.totalAmount || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3.5 text-slate-600">{doc.createdBy || 'Bếp trưởng'}</td>
                          <td className="p-3.5 text-slate-500 font-mono text-xs">
                            {doc.createdAt
                              ? new Date(doc.createdAt).toLocaleString('vi-VN', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                })
                              : '--'}
                          </td>
                          <td className="p-3.5 text-center">
                            {imageCount > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-bold text-xs">
                                <Camera className="h-3 w-3" />
                                <span>{imageCount} ảnh</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">--</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setViewingDoc(doc)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1 transition-all"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: LÔ HÀNG (BATCHES / LOTS) & TỒN KHO                          */}
      {/* =================================================================== */}
      {activeTab === 'batches' && (
        <div className="space-y-4">
          {/* Search bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm mã lô (VD: LOT-202611-001) hoặc tên hàng..."
                value={batchSearchTerm}
                onChange={(e) => setBatchSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Đang quản lý <strong className="text-indigo-600">{batches.length}</strong> lô nhập tại chi nhánh
            </div>
          </div>

          {/* Batches Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Tag className="h-4 w-4 text-indigo-600" />
                <span>Danh Sách Lô Hàng Nhập Kho (Lot Tracking)</span>
              </span>
              <span className="text-[11px] text-slate-500 font-normal">
                Tự động sinh khi tạo phiếu nhập kho
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã Lô</th>
                    <th className="p-3.5">Tên Nguyên Liệu</th>
                    <th className="p-3.5">Nhà Cung Cấp</th>
                    <th className="p-3.5">Nhập Ban Đầu</th>
                    <th className="p-3.5">Tồn Hiện Tại</th>
                    <th className="p-3.5">Đơn Giá Nhập</th>
                    <th className="p-3.5">Ngày Nhập</th>
                    <th className="p-3.5">Hạn Sử Dụng</th>
                    <th className="p-3.5 text-center">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredBatches.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Chưa có lô hàng nào phù hợp với bộ lọc
                      </td>
                    </tr>
                  ) : (
                    filteredBatches.map((batch) => {
                      const isOutOfStock = Number(batch.currentStock) <= 0;
                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-black text-indigo-700">{batch.batchCode}</td>
                          <td className="p-3.5 font-bold text-slate-900">{batch.itemName || 'Cua Cà Mau'}</td>
                          <td className="p-3.5 text-slate-600 font-medium">
                            {batch.supplierName || batch.supplierCode || 'Hải Sản Quảng Ninh'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-700">
                            {batch.initialQuantity} {batch.unit}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`font-mono font-black text-sm ${
                                isOutOfStock ? 'text-slate-400 line-through' : 'text-emerald-700'
                              }`}
                            >
                              {batch.currentStock} {batch.unit}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-800">
                            {Number(batch.unitPrice || 0).toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3.5 font-mono text-xs text-slate-500">
                            {batch.importDate || '--'}
                          </td>
                          <td className="p-3.5 font-mono text-xs text-slate-500">
                            {batch.expiryDate || 'Không có'}
                          </td>
                          <td className="p-3.5 text-center">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-500">
                                Đã hết
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Đang dùng
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: QUẢN LÝ NHÀ CUNG CẤP (SUPPLIERS)                            */}
      {/* =================================================================== */}
      {activeTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Danh Sách Đối Tác & Nhà Cung Cấp</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quản lý thông tin nhà cung cấp phục vụ truy vết chất lượng và đối soát % hỏng
              </p>
            </div>
            <button
              onClick={() => handleOpenSupplierModal()}
              className="btn-touch px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
            >
              <Plus className="h-4 w-4" />
              <span>Thêm Nhà Cung Cấp</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã NCC</th>
                    <th className="p-3.5">Tên Nhà Cung Cấp</th>
                    <th className="p-3.5">Số Điện Thoại</th>
                    <th className="p-3.5">Địa Chỉ Kho Hàng</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {suppliers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        Chưa có Nhà cung cấp nào được cấu hình
                      </td>
                    </tr>
                  ) : (
                    suppliers.map((sup) => (
                      <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-indigo-700">{sup.supplierCode}</td>
                        <td className="p-3.5 font-bold text-slate-900">{sup.supplierName}</td>
                        <td className="p-3.5 font-mono text-slate-600">
                          {sup.phone ? (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3 text-slate-400" />
                              <span>{sup.phone}</span>
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {sup.address ? (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{sup.address}</span>
                            </span>
                          ) : (
                            '--'
                          )}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              sup.status === 'ACTIVE'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {sup.status === 'ACTIVE' ? 'Đang hợp tác' : 'Tạm dừng'}
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleOpenSupplierModal(sup)}
                            className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
                          >
                            Chỉnh sửa
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: KIỂM KÊ KHO ĐẦU / CUỐI CA (INVENTORY CHECKS)                 */}
      {/* =================================================================== */}
      {activeTab === 'inventory-check' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
            <ClipboardCheck className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-amber-900">
              <strong className="font-bold">Quy Chuẩn Chống Thất Thoát Bằng Kiểm Kê Ca:</strong>
              <p className="mt-0.5 text-amber-800 leading-relaxed">
                Nhân viên kiểm kê nhập số lượng thực tế đếm được. Mọi chênh lệch giữa Tồn Hệ Thống và Tồn Thực Tế
                bắt buộc phải có lý do giải trình (rã đông hao hụt, hỏng tủ đông, rơi vãi...). Dữ liệu kiểm kê sẽ được
                tự động tích hợp vào Bảng Đối Soát Cuối Ngày (I.5).
              </p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Lịch Sử Các Biên Bản Kiểm Kê Ca</h3>
            <button
              onClick={handleOpenCheckModal}
              className="btn-touch px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus className="h-4 w-4" />
              <span>Lập Biên Bản Kiểm Kê</span>
            </button>
          </div>

          {/* Checks History Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5">Mã Biên Bản</th>
                    <th className="p-3.5">Ca Làm Việc</th>
                    <th className="p-3.5">Ngày Kiểm Kê</th>
                    <th className="p-3.5">Người Kiểm Kê</th>
                    <th className="p-3.5">Số Mặt Hàng Lệch</th>
                    <th className="p-3.5">Trạng Thái</th>
                    <th className="p-3.5 text-right">Chi Tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {checks.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-400">
                        Chưa có biên bản kiểm kê ca nào được lập
                      </td>
                    </tr>
                  ) : (
                    checks.map((c) => {
                      const diffCount = c.items
                        ? c.items.filter((i) => Number(i.difference || 0) !== 0).length
                        : 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-amber-700">{c.checkCode}</td>
                          <td className="p-3.5 font-bold">
                            {c.shift === 'CA_SANG' || c.shift === 'SANG'
                              ? '🌅 Ca Sáng (Đầu ca)'
                              : c.shift === 'CA_TOI' || c.shift === 'TOI'
                              ? '🌙 Ca Tối (Cuối ca)'
                              : '☀️ Cả ngày (Đột xuất)'}
                          </td>
                          <td className="p-3.5 font-mono text-slate-600">{c.checkDate}</td>
                          <td className="p-3.5 text-slate-900 font-medium">{c.checkedByName || c.checkedBy || 'Bếp ca trưởng'}</td>
                          <td className="p-3.5">
                            {diffCount > 0 ? (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                {diffCount} món lệch tồn
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                Khớp 100%
                              </span>
                            )}
                          </td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700">
                              {c.status || 'ĐÃ LƯU'}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => setViewingCheck(c)}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold inline-flex items-center gap-1"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>Xem</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: BÁO CÁO % HỎNG THEO NHÀ CUNG CẤP (SUPPLIER LOSS REPORT)       */}
      {/* =================================================================== */}
      {activeTab === 'loss-report' && (
        <div className="space-y-4">
          {/* Controls & Filter */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Tháng</label>
                <select
                  value={reportMonth}
                  onChange={(e) => setReportMonth(Number(e.target.value))}
                  className="mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Tháng {m}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase">Năm</label>
                <select
                  value={reportYear}
                  onChange={(e) => setReportYear(Number(e.target.value))}
                  className="mt-0.5 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-bold text-slate-800"
                >
                  {[2025, 2026, 2027].map((y) => (
                    <option key={y} value={y}>
                      Năm {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleExportLossExcel}
              disabled={isExportingExcel}
              className="btn-touch px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {isExportingExcel ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>ĐANG XUẤT EXCEL...</span>
                </>
              ) : (
                <>
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>XUẤT BÁO CÁO EXCEL (POI)</span>
                </>
              )}
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Nhà Cung Cấp Giao</span>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                {lossReports.length} <span className="text-xs font-normal text-slate-500">đơn vị</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tổng Lượng Nhập</span>
              <div className="text-xl sm:text-2xl font-black text-indigo-700 mt-1">
                {totalImportedKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Tổng Lượng Hỏng</span>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {totalDamagedKg.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">kg</span>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase">% Hỏng Bình Quân</span>
              <div
                className={`text-xl sm:text-2xl font-black mt-1 ${
                  avgLossRate > 5.0 ? 'text-rose-600' : avgLossRate > 2.0 ? 'text-amber-500' : 'text-emerald-600'
                }`}
              >
                {avgLossRate.toFixed(2)}%
              </div>
            </div>
          </div>

          {/* Ranking Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700 flex items-center justify-between">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <Award className="h-4 w-4 text-amber-500" />
                <span>Bảng Xếp Hạng Tỷ Lệ Hỏng Theo Nhà Cung Cấp (Cao nhất lên đầu)</span>
              </span>
              {highRiskSuppliersCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  <span>{highRiskSuppliersCount} NCC vượt ngưỡng 5%</span>
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[11px] uppercase tracking-wider">
                    <th className="p-3.5 text-center">Hạng</th>
                    <th className="p-3.5">Mã NCC</th>
                    <th className="p-3.5">Tên Nhà Cung Cấp</th>
                    <th className="p-3.5">Tổng Nhập (kg)</th>
                    <th className="p-3.5">Tổng Hỏng (kg)</th>
                    <th className="p-3.5">% Hỏng Thực Tế</th>
                    <th className="p-3.5">Tiền Thiệt Hại</th>
                    <th className="p-3.5">Khuyến Nghị Xử Lý</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {lossReports.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-400">
                        Chưa có dữ liệu báo hỏng theo NCC trong tháng {reportMonth}/{reportYear}
                      </td>
                    </tr>
                  ) : (
                    lossReports.map((report, idx) => {
                      const importedQty = Number(report.totalPurchasedQty ?? report.importedQuantity ?? 0);
                      const damagedQty = Number(report.totalDamagedQty ?? report.damagedQuantity ?? 0);
                      const lossRate = Number(
                        report.damageRatePercentage ??
                        report.lossRate ??
                        (importedQty > 0 ? (damagedQty / importedQty) * 100 : 0)
                      );
                      const damagedAmount = Number(report.totalEstimatedLossAmount ?? report.damagedAmount ?? 0);
                      const rankDisplay = report.rank ?? report.ranking ?? (idx + 1);
                      const isHighRisk = lossRate > 5.0;
                      const isWarning = lossRate > 2.0 && !isHighRisk;

                      return (
                        <tr
                          key={report.supplierCode || idx}
                          className={`hover:bg-slate-50 transition-colors ${
                            isHighRisk ? 'bg-rose-50/40' : ''
                          }`}
                        >
                          <td className="p-3.5 text-center">
                            {rankDisplay === 1 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-400 text-slate-900 font-black text-xs shadow-sm">
                                1
                              </span>
                            ) : rankDisplay === 2 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-300 text-slate-800 font-black text-xs">
                                2
                              </span>
                            ) : rankDisplay === 3 ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-700/30 text-amber-900 font-black text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-400 font-semibold">{rankDisplay}</span>
                            )}
                          </td>
                          <td className="p-3.5 font-mono font-bold text-indigo-700">
                            {report.supplierCode}
                          </td>
                          <td className="p-3.5 font-bold text-slate-900">{report.supplierName}</td>
                          <td className="p-3.5 font-mono font-semibold">
                            {importedQty.toLocaleString('vi-VN')} kg
                          </td>
                          <td className="p-3.5 font-mono font-bold text-rose-600">
                            {damagedQty.toLocaleString('vi-VN')} kg
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <span
                                className={`font-mono font-black text-sm ${
                                  isHighRisk
                                    ? 'text-rose-600'
                                    : isWarning
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {lossRate.toFixed(2)}%
                              </span>
                              <div className="w-16 h-2 rounded-full bg-slate-200 overflow-hidden">
                                <div
                                  className={`h-full ${
                                    isHighRisk
                                      ? 'bg-rose-600'
                                      : isWarning
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${Math.min(100, lossRate * 10)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5 font-mono font-bold text-slate-900">
                            {damagedAmount.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="p-3.5">
                            {isHighRisk ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                                <ShieldAlert className="h-3 w-3" />
                                <span>Vượt ngưỡng (&gt;5%) - Khiếu nại/Phạt</span>
                              </span>
                            ) : isWarning ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                                <AlertTriangle className="h-3 w-3" />
                                <span>Cần theo dõi (2-5%)</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="h-3 w-3" />
                                <span>Chất lượng đạt chuẩn</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: TẠO PHIẾU NHẬP / XUẤT HUỶ KHO                               */}
      {/* =================================================================== */}
      {showDocModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-2xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <PackagePlus className="h-6 w-6" />
                <span>
                  {docType === 'NHAP'
                    ? 'LẬP PHIẾU NHẬP KHO & SINH LÔ HÀNG (LOT)'
                    : 'LẬP PHIẾU XUẤT HUỶ KHO'}
                </span>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitDoc} className="space-y-4 mt-4">
              {docType === 'NHAP' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    CHỌN NHÀ CUNG CẤP GIAO HÀNG
                  </label>
                  <select
                    value={selectedSupplierId || ''}
                    onChange={(e) => setSelectedSupplierId(Number(e.target.value) || undefined)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  >
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.supplierName} ({s.supplierCode})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ / MỤC ĐÍCH</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Nhập 100kg cua Cà Mau tươi phục vụ line buffet..."
                  value={docNote}
                  onChange={(e) => setDocNote(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* LIST OF ITEMS */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-600">
                    DANH SÁCH MẶT HÀNG TRÊN PHIẾU
                  </label>
                  <button
                    type="button"
                    onClick={handleAddDocItem}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Thêm Dòng</span>
                  </button>
                </div>

                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {docItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-12 gap-2 items-center text-xs"
                    >
                      <div className="col-span-4">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Nguyên liệu
                        </span>
                        <select
                          value={item.itemId}
                          onChange={(e) => handleDocItemChange(idx, 'itemId', e.target.value)}
                          className="w-full h-9 px-2 rounded-lg border border-slate-300 font-semibold text-slate-800"
                        >
                          {buffetItems.map((bi) => (
                            <option key={bi.id} value={bi.id}>
                              {bi.itemName} ({bi.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Số lượng
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min="0.1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleDocItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 px-2 rounded-lg border border-slate-300 font-bold"
                        />
                      </div>

                      <div className="col-span-3">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Đơn giá (đ)
                        </span>
                        <input
                          type="number"
                          step="1000"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleDocItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)
                          }
                          className="w-full h-9 px-2 rounded-lg border border-slate-300 font-mono text-xs"
                        />
                      </div>

                      <div className="col-span-2">
                        <span className="text-[10px] text-slate-500 font-semibold block mb-0.5">
                          Hạn dùng
                        </span>
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={(e) => handleDocItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-full h-9 px-1 rounded-lg border border-slate-300 text-[11px]"
                        />
                      </div>

                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveDocItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded"
                          disabled={docItems.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end items-center gap-2 pt-2 text-sm font-extrabold text-slate-900">
                  <span>Tổng tiền phiếu:</span>
                  <span className="text-indigo-700 font-mono text-base">
                    {calculateDocTotal().toLocaleString('vi-VN')} đ
                  </span>
                </div>
              </div>

              {/* UPLOAD ẢNH HÓA ĐƠN / CHỨNG TỪ */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  ẢNH HÓA ĐƠN / CHỨNG TỪ GIAO HÀNG (TỐI ĐA 5 ẢNH, NÉN TỰ ĐỘNG)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={docFileInputRef}
                  onChange={handleDocPhotoUpload}
                  className="hidden"
                />

                <div className="grid grid-cols-5 gap-2 mt-2">
                  {docImages.map((img, i) => (
                    <div key={i} className="relative group rounded-xl border border-slate-300 overflow-hidden">
                      <img src={img.dataUrl} alt={`Doc ${i}`} className="h-20 w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setDocImages(docImages.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white text-center py-0.5">
                        {img.compressedSizeKb} KB
                      </div>
                    </div>
                  ))}

                  {docImages.length < 5 && (
                    <button
                      type="button"
                      onClick={() => docFileInputRef.current?.click()}
                      className="h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-500 text-slate-500 hover:text-indigo-600 flex flex-col items-center justify-center gap-1 font-bold text-[11px] transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                      <span>Thêm ảnh</span>
                    </button>
                  )}
                </div>
              </div>

              {/* SUBMIT BUTTON */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowDocModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDoc}
                  className="btn-touch h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
                >
                  {isSubmittingDoc ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG LƯU PHIẾU...</span>
                    </>
                  ) : (
                    <span>XÁC NHẬN LƯU PHIẾU</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: XEM CHI TIẾT PHIẾU KHO                                      */}
      {/* =================================================================== */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-black text-base">
                <Eye className="h-5 w-5" />
                <span>CHI TIẾT PHIẾU: {viewingDoc.docCode}</span>
              </div>
              <button
                onClick={() => setViewingDoc(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Loại phiếu</span>
                  <span className="font-bold text-slate-800">{viewingDoc.docType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Nhà cung cấp</span>
                  <span className="font-bold text-slate-800">
                    {viewingDoc.supplierName || viewingDoc.supplierCode || 'Nội bộ'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người tạo</span>
                  <span className="font-bold text-slate-800">{viewingDoc.createdBy}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày tạo</span>
                  <span className="font-mono text-slate-800">{viewingDoc.createdAt}</span>
                </div>
              </div>

              {viewingDoc.note && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Ghi chú</span>
                  <p className="text-slate-700 font-medium">{viewingDoc.note}</p>
                </div>
              )}

              {/* Items List */}
              <div>
                <span className="font-bold text-slate-700 block mb-2">Chi Tiết Mặt Hàng:</span>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600">
                      <tr>
                        <th className="p-2.5">Nguyên liệu</th>
                        <th className="p-2.5">Mã Lô</th>
                        <th className="p-2.5">Số lượng</th>
                        <th className="p-2.5">Đơn giá</th>
                        <th className="p-2.5 text-right">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewingDoc.items || []).map((it, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800">{it.itemName || it.itemCode}</td>
                          <td className="p-2.5 font-mono text-indigo-600 font-semibold">{it.batchCode || '--'}</td>
                          <td className="p-2.5 font-mono">
                            {it.quantity} {it.unit || 'kg'}
                          </td>
                          <td className="p-2.5 font-mono">{Number(it.unitPrice).toLocaleString('vi-VN')} đ</td>
                          <td className="p-2.5 font-mono font-bold text-right">
                            {(it.quantity * it.unitPrice).toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Photos */}
              {viewingDoc.imageUrls && (
                <div>
                  <span className="font-bold text-slate-700 block mb-2">Ảnh Hóa Đơn / Chứng Từ:</span>
                  <div className="grid grid-cols-3 gap-2">
                    {viewingDoc.imageUrls
                      .split(';')
                      .filter(Boolean)
                      .map((url, i) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer">
                          <img
                            src={url}
                            alt={`Invoice ${i}`}
                            className="h-28 w-full object-cover rounded-xl border border-slate-200 hover:opacity-90"
                          />
                        </a>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: THÊM / CHỈNH SỬA NHÀ CUNG CẤP                                */}
      {/* =================================================================== */}
      {showSupplierModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
                <Building2 className="h-5 w-5" />
                <span>{editingSupplier ? 'CHỈNH SỬA NHÀ CUNG CẤP' : 'THÊM NHÀ CUNG CẤP MỚI'}</span>
              </div>
              <button
                onClick={() => setShowSupplierModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">MÃ NHÀ CUNG CẤP</label>
                <input
                  type="text"
                  value={supplierCode}
                  onChange={(e) => setSupplierCode(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">TÊN NHÀ CUNG CẤP</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Hải Sản Quảng Ninh..."
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">SỐ ĐIỆN THOẠI</label>
                <input
                  type="text"
                  placeholder="0987..."
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">ĐỊA CHỈ KHO / CƠ SỞ</label>
                <input
                  type="text"
                  placeholder="Hạ Long, Quảng Ninh..."
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSupplierModal(false)}
                  className="btn-touch h-11 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                >
                  HỦY
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSupplier}
                  className="btn-touch h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  {isSubmittingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : <span>LƯU THÔNG TIN</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: LẬP BIÊN BẢN KIỂM KÊ KHO CA (INVENTORY CHECK FORM)          */}
      {/* =================================================================== */}
      {showCheckModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-3xl rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-600 font-black text-base">
                <ClipboardCheck className="h-6 w-6" />
                <span>LẬP BIÊN BẢN KIỂM KÊ KHO (ĐỐI SOÁT TỒN THỰC TẾ)</span>
              </div>
              <button
                onClick={() => setShowCheckModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitInventoryCheck} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CA KIỂM KÊ</label>
                  <select
                    value={checkShift}
                    onChange={(e) => setCheckShift(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-bold text-slate-800 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CA_TOI">Ca Tối (Cuối ca / Bàn giao)</option>
                    <option value="CA_SANG">Ca Sáng (Đầu ca / Nhận ca)</option>
                    <option value="CA_NGAY">Cả ngày (Đột xuất)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">NGÀY KIỂM KÊ</label>
                  <input
                    type="date"
                    value={checkDate}
                    onChange={(e) => setCheckDate(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 font-mono font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">GHI CHÚ CHUNG</label>
                  <input
                    type="text"
                    placeholder="Bàn giao ca tối..."
                    value={checkNote}
                    onChange={(e) => setCheckNote(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* Items Entry Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Bảng Đối Soát Tồn Kho ({checkItemRows.length} mặt hàng)
                  </label>
                  <span className="text-[11px] text-rose-600 font-bold">
                    * Bắt buộc giải trình lý do khi chênh lệch
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-600 sticky top-0 z-10">
                      <tr>
                        <th className="p-2.5">Nguyên liệu</th>
                        <th className="p-2.5">Tồn Hệ Thống</th>
                        <th className="p-2.5">Tồn Thực Tế Đếm Được</th>
                        <th className="p-2.5">Chênh Lệch</th>
                        <th className="p-2.5">Lý Do Chênh Lệch</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {checkItemRows.map((row, idx) => {
                        const diff = row.actualStock - row.systemStock;
                        const hasDiff = diff !== 0;

                        return (
                          <tr key={idx} className={hasDiff ? 'bg-amber-50/50' : ''}>
                            <td className="p-2.5">
                              <div className="font-bold text-slate-900">{row.itemName}</div>
                              {row.batchCode && (
                                <span className="font-mono text-[10px] text-indigo-600">
                                  {row.batchCode}
                                </span>
                              )}
                            </td>
                            <td className="p-2.5 font-mono font-bold text-slate-700">
                              {row.systemStock} {row.unit}
                            </td>
                            <td className="p-2.5">
                              <input
                                type="number"
                                step="0.1"
                                value={row.actualStock}
                                onChange={(e) =>
                                  handleActualStockChange(idx, parseFloat(e.target.value) || 0)
                                }
                                className="w-24 h-9 px-2 rounded-lg border border-slate-300 font-mono font-extrabold text-sm focus:ring-2 focus:ring-amber-500"
                              />
                            </td>
                            <td className="p-2.5">
                              {diff === 0 ? (
                                <span className="text-emerald-600 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Khớp</span>
                                </span>
                              ) : diff < 0 ? (
                                <span className="text-rose-600 font-extrabold">
                                  {diff} {row.unit} (Thiếu)
                                </span>
                              ) : (
                                <span className="text-amber-600 font-extrabold">
                                  +{diff} {row.unit} (Thừa)
                                </span>
                              )}
                            </td>
                            <td className="p-2.5">
                              {hasDiff ? (
                                <div className="space-y-1">
                                  <select
                                    value={row.reason}
                                    onChange={(e) => handleReasonChange(idx, e.target.value)}
                                    className="w-full h-8 px-2 rounded border border-rose-300 bg-white text-[11px] font-semibold text-rose-900 focus:ring-1 focus:ring-rose-500"
                                  >
                                    <option value="">-- Chọn lý do chênh lệch --</option>
                                    <option value="Hao hụt rã đông / sơ chế">Hao hụt rã đông / sơ chế</option>
                                    <option value="Hàng hỏng do bảo quản tủ đông">
                                      Hàng hỏng do bảo quản tủ đông
                                    </option>
                                    <option value="Rơi vãi / thất thoát tại bếp">
                                      Rơi vãi / thất thoát tại bếp
                                    </option>
                                    <option value="Bếp quên chưa bấm phiếu lấy hàng">
                                      Bếp quên chưa bấm phiếu lấy hàng
                                    </option>
                                    <option value="Kiểm đếm sai ở ca trước">Kiểm đếm sai ở ca trước</option>
                                    <option value="Khác (ghi rõ trong ghi chú)">Khác</option>
                                  </select>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">-- Không lệch --</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCheckModal(false)}
                  className="btn-touch h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm"
                >
                  HỦY BỎ
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCheck}
                  className="btn-touch h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                >
                  {isSubmittingCheck ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>ĐANG LƯU BIÊN BẢN...</span>
                    </>
                  ) : (
                    <span>LƯU BIÊN BẢN KIỂM KÊ</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: XEM CHI TIẾT BIÊN BẢN KIỂM KÊ                               */}
      {/* =================================================================== */}
      {viewingCheck && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-amber-700 font-black text-base">
                <Eye className="h-5 w-5" />
                <span>BIÊN BẢN KIỂM KÊ: {viewingCheck.checkCode}</span>
              </div>
              <button
                onClick={() => setViewingCheck(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 mt-4 text-xs sm:text-sm">
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ca làm việc</span>
                  <span className="font-bold text-slate-800">
                    {viewingCheck.shift === 'CA_SANG' || viewingCheck.shift === 'SANG'
                      ? 'Ca Sáng'
                      : viewingCheck.shift === 'CA_TOI' || viewingCheck.shift === 'TOI'
                      ? 'Ca Tối'
                      : 'Cả ngày'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Ngày kiểm kê</span>
                  <span className="font-mono text-slate-800">{viewingCheck.checkDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Người kiểm kê</span>
                  <span className="font-bold text-slate-800">{viewingCheck.checkedBy}</span>
                </div>
              </div>

              {viewingCheck.note && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block text-[11px]">Ghi chú</span>
                  <p className="text-slate-700 font-medium">{viewingCheck.note}</p>
                </div>
              )}

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 font-bold text-slate-600">
                    <tr>
                      <th className="p-2.5">Nguyên liệu</th>
                      <th className="p-2.5">Tồn Hệ Thống</th>
                      <th className="p-2.5">Tồn Thực Tế</th>
                      <th className="p-2.5">Chênh Lệch</th>
                      <th className="p-2.5">Lý Do Lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(viewingCheck.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">{it.itemName || it.itemCode}</td>
                        <td className="p-2.5 font-mono">{it.systemStock}</td>
                        <td className="p-2.5 font-mono font-bold">{it.actualStock}</td>
                        <td className="p-2.5 font-mono font-extrabold text-rose-600">
                          {it.difference}
                        </td>
                        <td className="p-2.5 text-slate-700 font-medium">{it.reason || '--'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
