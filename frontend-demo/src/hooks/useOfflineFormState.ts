import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom Hook: useOfflineFormState
 * Tự động lưu trữ tạm thời dữ liệu nhập liệu của biểu mẫu (form) vào localStorage/sessionStorage.
 * Khi xảy ra mất mạng (Network Error / Timeout / Offline), dữ liệu KHÔNG bị mất và người dùng có thể thử lại.
 * Dữ liệu lưu tạm chỉ bị xóa khi request gửi thành công (HTTP 200/201).
 *
 * @param formKey Khóa định danh duy nhất cho biểu mẫu (ví dụ: 'kitchen_start_batch', 'kitchen_finish_batch')
 * @param initialData Dữ liệu khởi tạo ban đầu của biểu mẫu
 */
export function useOfflineFormState<T extends Record<string, any>>(formKey: string, initialData: T) {
  const storageKey = `senviet_offline_form_${formKey}`;

  // Khởi tạo state với dữ liệu đã lưu trong storage nếu có
  const [formData, setFormDataState] = useState<T>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...initialData, ...parsed };
      }
    } catch (e) {
      console.warn(`[useOfflineFormState] Lỗi đọc draft từ storage cho form ${formKey}:`, e);
    }
    return initialData;
  });

  const [hasDraft, setHasDraft] = useState<boolean>(() => {
    return Boolean(localStorage.getItem(storageKey));
  });

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  // Tham chiếu giữ giá trị mới nhất để tránh stale closures
  const formDataRef = useRef<T>(formData);
  formDataRef.current = formData;

  // Tự động đồng bộ vào localStorage mỗi khi formData thay đổi
  const saveToStorage = useCallback(
    (data: T) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        setHasDraft(true);
      } catch (e) {
        console.warn(`[useOfflineFormState] Lỗi lưu draft cho form ${formKey}:`, e);
      }
    },
    [storageKey, formKey]
  );

  const setFormData = useCallback(
    (newDataOrUpdater: T | ((prev: T) => T)) => {
      setFormDataState((prev) => {
        const updated = typeof newDataOrUpdater === 'function' ? (newDataOrUpdater as (prev: T) => T)(prev) : newDataOrUpdater;
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormDataState((prev) => {
        const updated = { ...prev, [field]: value };
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Xóa draft khỏi storage (gọi khi hoàn tất thành công)
  const clearDraft = useCallback(() => {
    try {
      localStorage.removeItem(storageKey);
      setHasDraft(false);
      setOfflineError(null);
    } catch (e) {
      console.warn(`[useOfflineFormState] Lỗi xóa draft cho form ${formKey}:`, e);
    }
  }, [storageKey, formKey]);

  // Reset form về trạng thái ban đầu và xóa draft
  const resetForm = useCallback(() => {
    clearDraft();
    setFormDataState(initialData);
  }, [clearDraft, initialData]);

  /**
   * Bao bọc hàm submit với cơ chế bảo vệ ngoại tuyến.
   * Nếu có lỗi mạng hoặc mất kết nối:
   * - Giữ nguyên formData trên màn hình và trong storage.
   * - Đặt thông báo lỗi offline rõ ràng để người dùng biết bấm Thử lại.
   * Nếu thành công:
   * - Tự động xóa draft khỏi storage.
   */
  const submitWithOfflinePreserve = useCallback(
    async <R>(submitFn: (data: T) => Promise<R>): Promise<R> => {
      setIsSubmitting(true);
      setOfflineError(null);

      // Kiểm tra tình trạng kết nối trình duyệt
      if (!navigator.onLine) {
        setIsSubmitting(false);
        const errMsg = 'Mất kết nối mạng! Dữ liệu biểu mẫu đã được lưu tạm an toàn trên máy. Vui lòng kiểm tra Wi-Fi / 4G và bấm "Thử lại".';
        setOfflineError(errMsg);
        throw new Error(errMsg);
      }

      try {
        const result = await submitFn(formDataRef.current);
        // Thành công: Xóa dữ liệu lưu tạm
        clearDraft();
        return result;
      } catch (err: any) {
        // Phân loại lỗi mạng, timeout hoặc server tạm thời không phản hồi
        const isNetworkErr =
          !navigator.onLine ||
          err.code === 'ERR_NETWORK' ||
          err.message?.includes('Network Error') ||
          err.message?.includes('timeout') ||
          err.response?.status === 503 ||
          err.response?.status === 504 ||
          !err.response;

        if (isNetworkErr) {
          const errMsg = 'Mất kết nối mạng! Số liệu cân mẻ đã được lưu tạm an toàn trên máy. Vui lòng bấm "Thử lại" khi có mạng.';
          setOfflineError(errMsg);
        }
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [clearDraft]
  );

  return {
    formData,
    setFormData,
    updateField,
    clearDraft,
    resetForm,
    hasDraft,
    isSubmitting,
    offlineError,
    setOfflineError,
    submitWithOfflinePreserve,
  };
}

export default useOfflineFormState;
