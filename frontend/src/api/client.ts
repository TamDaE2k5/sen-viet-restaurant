import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// API base URL - Mặc định chuyển tiếp qua Nginx proxy (/api) hoặc direct local
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request Interceptor: Tự động đính kèm Bearer token vào Header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('senviet_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Xử lý hết hạn phiên làm việc (401 Unauthorized)
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response && error.response.status === 401) {
      // Xóa token hết hạn và chuyển về trang đăng nhập
      localStorage.removeItem('senviet_token');
      localStorage.removeItem('senviet_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
