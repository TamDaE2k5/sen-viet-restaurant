import React, { useState, useEffect } from 'react';
import { Camera, MapPin, X, RotateCw, ExternalLink, ShieldAlert, CheckCircle2, Smartphone, Apple } from 'lucide-react';

export interface PermissionGuideModalProps {
  isOpen: boolean;
  type: 'CAMERA' | 'GEOLOCATION';
  onClose: () => void;
  onRetry?: () => void;
}

/**
 * Component: PermissionGuideModal
 * Hướng dẫn 3 bước cực kỳ trực quan cách mở lại quyền Camera hoặc Vị trí GPS
 * khi nhân viên lỡ tay bấm "Chặn" (Block / Deny) trên trình duyệt iOS Safari hoặc Android Chrome.
 */
export const PermissionGuideModal: React.FC<PermissionGuideModalProps> = ({
  isOpen,
  type,
  onClose,
  onRetry,
}) => {
  // Tự động nhận diện thiết bị người dùng
  const [platform, setPlatform] = useState<'ANDROID' | 'IOS' | 'DESKTOP'>('ANDROID');

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPad|iPhone|iPod/.test(ua)) {
        setPlatform('IOS');
      } else if (/android/i.test(ua)) {
        setPlatform('ANDROID');
      } else {
        setPlatform('DESKTOP');
      }
    }
  }, []);

  if (!isOpen) return null;

  const isCamera = type === 'CAMERA';
  const permissionTitle = isCamera ? 'Máy Ảnh (Camera)' : 'Vị Trí GPS';
  const permissionIcon = isCamera ? (
    <Camera className="w-8 h-8 text-amber-600" />
  ) : (
    <MapPin className="w-8 h-8 text-amber-600" />
  );

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
              {permissionIcon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[11px] font-black rounded-md uppercase">
                  Bị Từ Chối Quyền
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                Cấp Lại Quyền {permissionTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason Alert */}
        <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            Trình duyệt ghi nhận bạn đã bấm <strong>"Chặn" (Block)</strong> quyền {permissionTitle}.
            Theo quy chế bảo mật, trình duyệt sẽ không hỏi lại tự động — bạn cần bật lại theo 3 bước bên dưới:
          </div>
        </div>

        {/* Platform Selector Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setPlatform('ANDROID')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              platform === 'ANDROID'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Smartphone className="w-4 h-4 text-emerald-600" />
            Android (Chrome)
          </button>
          <button
            type="button"
            onClick={() => setPlatform('IOS')}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              platform === 'IOS'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Apple className="w-4 h-4 text-slate-900" />
            iPhone / iPad (Safari)
          </button>
        </div>

        {/* 3-Step Guide */}
        <div className="space-y-3 pt-1">
          {platform === 'ANDROID' || platform === 'DESKTOP' ? (
            <>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Bấm biểu tượng Cài đặt trang web:</div>
                  Nhìn lên thanh địa chỉ trình duyệt, bấm vào biểu tượng <strong>ổ khóa 🔒</strong> hoặc thanh gạt ở góc trái cạnh URL.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Chọn mục "Quyền" (Permissions):</div>
                  Tìm mục <strong>{isCamera ? 'Máy ảnh (Camera)' : 'Vị trí (Location)'}</strong> và chuyển trạng thái từ <span className="text-rose-600 font-bold">Chặn</span> sang <span className="text-emerald-700 font-bold">"Cho phép" (Allow)</span>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Tải lại trang và tiếp tục:</div>
                  Bấm nút <strong>Tải lại trang (Reload)</strong> của trình duyệt hoặc bấm nút <strong>"Thử Lại Ngay"</strong> bên dưới.
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  1
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Bấm biểu tượng "aA":</div>
                  Trên thanh địa chỉ Safari, bấm vào biểu tượng <strong>aA</strong> (hoặc icon Cài đặt) ở góc trái thanh URL.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  2
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Chọn "Cài đặt trang web" (Website Settings):</div>
                  Chọn mục <strong>{isCamera ? 'Máy ảnh (Camera)' : 'Vị trí (Location)'}</strong> và đổi thành <span className="text-emerald-700 font-bold">"Cho phép" (Allow)</span>.
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="w-7 h-7 rounded-xl bg-brand-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                  3
                </div>
                <div className="text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Hoàn tất & Thử lại:</div>
                  Bấm <strong>Xong</strong> để lưu cài đặt, sau đó nhấn nút <strong>"Thử Lại Ngay"</strong> bên dưới để hoàn tất chấm công.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 text-slate-600 hover:text-slate-800 text-xs font-bold rounded-xl"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={() => {
              if (onRetry) {
                onRetry();
              } else {
                window.location.reload();
              }
            }}
            className="min-h-[44px] py-2.5 px-5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
          >
            <RotateCw className="w-4 h-4" />
            Thử Lại Ngay
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionGuideModal;
