import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, RoleName, LoginRequest } from '../types/auth';
import { loginApi, getMeApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleName) => boolean;
  isKitchen: boolean;
  isManager: boolean;
  isAccountant: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('senviet_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khi tải ứng dụng, nếu có token thì nạp thông tin user
  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const profile = await getMeApi();
          setUser(profile);
        } catch (error) {
          console.error('Không thể xác thực token lưu trữ:', error);
          localStorage.removeItem('senviet_token');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      const data = await loginApi(credentials);
      localStorage.setItem('senviet_token', data.accessToken);
      setToken(data.accessToken);

      // Nạp thông tin user profile đầy đủ
      const profile = await getMeApi();
      setUser(profile);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('senviet_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (role: RoleName): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.includes(role);
  };

  const isKitchen = hasRole('ROLE_KITCHEN_STAFF');
  const isManager = hasRole('ROLE_RESTAURANT_MANAGER');
  const isAccountant = hasRole('ROLE_BRANCH_ACCOUNTANT') || hasRole('ROLE_GENERAL_ACCOUNTANT');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        logout,
        hasRole,
        isKitchen,
        isManager,
        isAccountant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
