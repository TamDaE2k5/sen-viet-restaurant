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

/**
 * Lấy danh sách người dùng trong hệ thống (dành cho Kế toán tổng / Quản trị viên).
 */
export async function getUsersApi(): Promise<User[]> {
  try {
    const response = await apiClient.get<ApiResponse<User[]>>('/v1/admin/users');
    return response.data.data;
  } catch (err: any) {
    if (err.response?.status === 404) {
      const response = await apiClient.get<ApiResponse<User[]>>('/v1/users');
      return response.data.data;
    }
    throw err;
  }
}

/**
 * Gán danh sách vai trò cho người dùng (/api/v1/admin/users/{userId}/roles).
 */
export async function assignUserRolesApi(userId: number, roles: string[]): Promise<User> {
  const response = await apiClient.post<ApiResponse<User>>(`/v1/admin/users/${userId}/roles`, { roles });
  return response.data.data;
}
