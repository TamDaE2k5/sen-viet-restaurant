import React, { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react';

export type NotificationType = 'error' | 'warning' | 'success' | 'info';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  actionLabel?: string;
  onAction?: () => void;
}

interface NotificationContextType {
  notification: NotificationItem | null;
  showNotification: (options: Omit<NotificationItem, 'id'>) => void;
  showError: (message: string, title?: string, options?: Partial<NotificationItem>) => void;
  showWarning: (message: string, title?: string, options?: Partial<NotificationItem>) => void;
  showSuccess: (message: string, title?: string, options?: Partial<NotificationItem>) => void;
  showInfo: (message: string, title?: string, options?: Partial<NotificationItem>) => void;
  closeNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notification, setNotification] = useState<NotificationItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeNotification = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback(
    ({ type, title, message, duration = 5000, actionLabel, onAction }: Omit<NotificationItem, 'id'>) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      const id = Date.now().toString();
      const item: NotificationItem = {
        id,
        type,
        title,
        message,
        duration,
        actionLabel,
        onAction,
      };

      setNotification(item);

      if (duration > 0) {
        timerRef.current = setTimeout(() => {
          setNotification((curr) => (curr?.id === id ? null : curr));
          timerRef.current = null;
        }, duration);
      }
    },
    []
  );

  const showError = useCallback(
    (message: string, title?: string, options?: Partial<NotificationItem>) => {
      showNotification({
        type: 'error',
        title: title || 'LỖI THAO TÁC / TỪ CHỐI TRUY CẬP',
        message,
        duration: options?.duration ?? 5000,
        ...options,
      });
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (message: string, title?: string, options?: Partial<NotificationItem>) => {
      showNotification({
        type: 'warning',
        title: title || 'CẢNH BÁO NGHIỆP VỤ',
        message,
        duration: options?.duration ?? 5000,
        ...options,
      });
    },
    [showNotification]
  );

  const showSuccess = useCallback(
    (message: string, title?: string, options?: Partial<NotificationItem>) => {
      showNotification({
        type: 'success',
        title: title || 'THAO TÁC THÀNH CÔNG',
        message,
        duration: options?.duration ?? 4000,
        ...options,
      });
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (message: string, title?: string, options?: Partial<NotificationItem>) => {
      showNotification({
        type: 'info',
        title: title || 'THÔNG BÁO HỆ THỐNG',
        message,
        duration: options?.duration ?? 4000,
        ...options,
      });
    },
    [showNotification]
  );

  return (
    <NotificationContext.Provider
      value={{
        notification,
        showNotification,
        showError,
        showWarning,
        showSuccess,
        showInfo,
        closeNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
