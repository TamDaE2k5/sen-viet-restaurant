import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, X, RefreshCw } from 'lucide-react';

/**
 * Component: NetworkStatusBar
 * Thanh trạng thái kết nối mạng thời gian thực:
 * - Cảnh báo màu vàng cam khi mất mạng (Offline): Báo hiệu dữ liệu được lưu tạm trên máy.
 * - Thông báo màu xanh lá khi có mạng lại (Online): Tự động biến mất sau 4 giây.
 */
export const NetworkStatusBar: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setDismissed(false);
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
      }, 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setDismissed(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Nếu mạng bình thường và không cần hiện thông báo vừa kết nối lại -> Ẩn
  if (isOnline && !showReconnected) {
    return null;
  }

  // Nếu người dùng đã chủ động tắt banner offline tạm thời
  if (!isOnline && dismissed) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`fixed top-0 left-0 right-0 z-[100] px-4 py-2.5 shadow-md flex items-center justify-between transition-all duration-300 ${
        !isOnline
          ? 'bg-amber-600 text-white border-b border-amber-700 animate-in slide-in-from-top'
          : 'bg-emerald-600 text-white border-b border-emerald-700 animate-in slide-in-from-top'
      }`}
    >
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 font-medium">
          {!isOnline ? (
            <>
              <div className="w-6 h-6 rounded-full bg-amber-500/80 flex items-center justify-center shrink-0 animate-pulse">
                <WifiOff className="w-4 h-4 text-white" />
              </div>
              <div>
                <strong className="font-extrabold uppercase mr-1">[NGOẠI TUYẾN]</strong>
                <span>Mất kết nối Internet — Dữ liệu cân mẻ và biểu mẫu sẽ được lưu tạm an toàn trên máy.</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-6 h-6 rounded-full bg-emerald-500/80 flex items-center justify-center shrink-0">
                <Wifi className="w-4 h-4 text-white" />
              </div>
              <div>
                <strong className="font-extrabold uppercase mr-1">[ĐÃ KẾT NỐI LẠI]</strong>
                <span>Internet đã sẵn sàng — Bạn có thể tiếp tục lưu và đồng bộ dữ liệu lên máy chủ.</span>
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {!isOnline && (
            <button
              onClick={() => window.location.reload()}
              className="px-2.5 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
              title="Kiểm tra lại kết nối"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden sm:inline">Tải lại</span>
            </button>
          )}
          <button
            onClick={() => {
              if (!isOnline) setDismissed(true);
              else setShowReconnected(false);
            }}
            className="p-1 hover:bg-white/20 rounded-md transition-colors"
            aria-label="Đóng thông báo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatusBar;
