import apiClient from './client';
import { ApiResponse, JwtAuthResponse, LoginRequest, User } from '../types/auth';

/**
 * Gửi yêu cầu đăng nhập và nhận JWT Token.
 */
export async function loginApi(data: LoginRequest): Promise<JwtAuthResponse> {
  const response = await apiClient.post<ApiResponse<JwtAuthResponse>>('/v1/auth/login', data);
  if (!response.data.success) {
    throw new Error(response.data.message || 'Đăng nhập không thành công');
  }
  return response.data.data;
}

/**
 * Lấy thông tin người dùng đang đăng nhập hiện tại (/api/v1/auth/me).
 */
export async function getMeApi(): Promise<User> {
  const response = await apiClient.get<ApiResponse<User>>('/v1/auth/me');
  if (!response.data.success) {
    throw new Error(response.data.message || 'Không thể lấy thông tin người dùng');
  }
  return response.data.data;
}
