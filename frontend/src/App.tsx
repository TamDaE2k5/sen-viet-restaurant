import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { MobileShell } from './components/layout/MobileShell';
import { DesktopShell } from './components/layout/DesktopShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { KitchenModule } from './components/kitchen/KitchenModule';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading, isKitchen } = useAuth();
  // Nếu là tài khoản bếp thì tab mặc định là 'kitchen', ngược lại là 'dashboard'
  const [mobileTab, setMobileTab] = useState(isKitchen ? 'kitchen' : 'dashboard');
  const [desktopMenu, setDesktopMenu] = useState(isKitchen ? 'kitchen' : 'dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <span className="text-sm font-medium">Đang tải hệ thống Sen Việt Buffet...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Nếu là Nhân viên Bếp hoặc thiết bị di động thì ưu tiên MobileShell
  // Màn hình Desktop cho Quản lý & Kế toán dùng DesktopShell
  return (
    <>
      {/* Viewport Mobile / Tablet nhỏ */}
      <div className="block lg:hidden">
        <MobileShell activeTab={mobileTab} onTabChange={setMobileTab}>
          {mobileTab === 'kitchen' ? (
            <KitchenModule />
          ) : (
            <Dashboard onNavigateToKitchen={() => setMobileTab('kitchen')} />
          )}
        </MobileShell>
      </div>

      {/* Viewport Desktop */}
      <div className="hidden lg:block">
        <DesktopShell activeMenu={desktopMenu} onMenuChange={setDesktopMenu}>
          {desktopMenu === 'kitchen' ? (
            <KitchenModule />
          ) : (
            <Dashboard onNavigateToKitchen={() => setDesktopMenu('kitchen')} />
          )}
        </DesktopShell>
      </div>
    </>
  );
};

export default App;
