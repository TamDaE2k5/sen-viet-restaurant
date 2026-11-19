import React from 'react';
import { useNotification, NotificationItem } from '../../context/NotificationContext';
import { ShieldAlert, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

interface ProminentAlertProps {
  customNotification?: NotificationItem | null;
  onClose?: () => void;
}

export const ProminentAlert: React.FC<ProminentAlertProps> = ({
  customNotification,
  onClose,
}) => {
  const { notification: contextNotification, closeNotification } = useNotification();
  const activeNotification = customNotification !== undefined ? customNotification : contextNotification;
  const handleClose = onClose || closeNotification;

  if (!activeNotification) return null;

  const { type, title, message, actionLabel, onAction } = activeNotification;

  const config = {
    error: {
      bg: 'bg-rose-600',
      border: 'border-rose-700',
      ring: 'ring-rose-200',
      shadow: 'shadow-rose-900/30',
      badgeBg: 'bg-rose-700',
      defaultTitle: 'LỖI THAO TÁC / TỪ CHỐI TRUY CẬP',
      icon: ShieldAlert,
    },
    warning: {
      bg: 'bg-amber-500',
      border: 'border-amber-600',
      ring: 'ring-amber-200',
      shadow: 'shadow-amber-900/30',
      badgeBg: 'bg-amber-600',
      defaultTitle: 'CẢNH BÁO NGHIỆP VỤ',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-600',
      border: 'border-emerald-700',
      ring: 'ring-emerald-200',
      shadow: 'shadow-emerald-900/30',
      badgeBg: 'bg-emerald-700',
      defaultTitle: 'THAO TÁC THÀNH CÔNG',
      icon: CheckCircle2,
    },
    info: {
      bg: 'bg-blue-600',
      border: 'border-blue-700',
      ring: 'ring-blue-200',
      shadow: 'shadow-blue-900/30',
      badgeBg: 'bg-blue-700',
      defaultTitle: 'THÔNG BÁO HỆ THỐNG',
      icon: Info,
    },
  }[type] || {
    bg: 'bg-slate-800',
    border: 'border-slate-900',
    ring: 'ring-slate-300',
    shadow: 'shadow-slate-900/30',
    badgeBg: 'bg-slate-900',
    defaultTitle: 'THÔNG BÁO',
    icon: Info,
  };

  const Icon = config.icon;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-xl transition-all duration-300 ease-out transform animate-in fade-in slide-in-from-top-4"
    >
      <div
        className={`${config.bg} ${config.border} border-2 rounded-2xl p-4 text-white shadow-2xl ${config.shadow} ring-4 ${config.ring} flex items-start gap-3.5 backdrop-blur-md`}
      >
        {/* Large 24px Icon */}
        <div className="p-1 rounded-xl bg-white/20 shrink-0 mt-0.5 shadow-sm">
          <Icon className="w-6 h-6 text-white" />
        </div>

        {/* Content body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${config.badgeBg} text-white/95 inline-block shadow-inner`}
            >
              {title || config.defaultTitle}
            </span>
          </div>
          <p className="text-sm font-bold text-white leading-snug break-words">
            {message}
          </p>

          {actionLabel && onAction && (
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => {
                  onAction();
                  handleClose();
                }}
                className="px-3 py-1 bg-white text-slate-900 font-bold text-xs rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
              >
                {actionLabel}
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          aria-label="Đóng thông báo"
          className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white transition-colors shrink-0 -mr-1 -mt-1 active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
