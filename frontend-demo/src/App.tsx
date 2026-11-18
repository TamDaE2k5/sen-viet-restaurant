import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { MobileShell } from './components/layout/MobileShell';
import { DesktopShell } from './components/layout/DesktopShell';
import { Dashboard } from './components/dashboard/Dashboard';
import { KitchenModule } from './components/kitchen/KitchenModule';
import { ReconciliationModule } from './components/reconciliation/ReconciliationModule';
import { WarehouseModule } from './components/warehouse/WarehouseModule';
import { HRModule } from './components/hr/HRModule';
import { PayrollModule } from './components/payroll/PayrollModule';
import { NetworkStatusBar } from './components/common/NetworkStatusBar';
import { ProminentAlert } from './components/common/ProminentAlert';
import { DemoToolbar } from './components/demo/DemoToolbar';
import { isViewAuthorized, getDefaultAuthorizedView } from './utils/rbac';
import { Loader2, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const { user, isAuthenticated, isLoading, activeContext } = useAuth();

  // Khởi tạo tab/menu mặc định theo phân quyền của người dùng (Task 12.1)
  const [mobileTab, setMobileTab] = useState<string>('kitchen');
  const [desktopMenu, setDesktopMenu] = useState<string>('kitchen');

  // Khởi tạo và đồng bộ màn hình ban đầu sau khi nạp xong thông tin người dùng
  useEffect(() => {
    if (user) {
      const defaultDesktop = getDefaultAuthorizedView(user, false);
      const defaultMobile = getDefaultAuthorizedView(user, true);

      // Nếu menu hiện tại chưa được cấp quyền thì tự động chuyển về view mặc định
      if (!isViewAuthorized(desktopMenu, user)) {
        setDesktopMenu(defaultDesktop);
      }
      if (!isViewAuthorized(mobileTab, user)) {
        setMobileTab(defaultMobile);
      }
    }
  }, [user]);

  // Giai đoạn 9: Tự động đồng bộ không gian làm việc khi người dùng chuyển đổi Context
  useEffect(() => {
    if (user) {
      if (activeContext === 'KITCHEN' && isViewAuthorized('kitchen', user)) {
        setMobileTab('kitchen');
        setDesktopMenu('kitchen');
      } else if (activeContext === 'EMPLOYEE_PORTAL' && isViewAuthorized('hr-attendance', user)) {
        setMobileTab('attendance');
        setDesktopMenu('hr-attendance');
      } else if (activeContext === 'MANAGEMENT' && isViewAuthorized('dashboard', user)) {
        setMobileTab('dashboard');
        setDesktopMenu('dashboard');
      }
    }
  }, [activeContext, user]);

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
    return (
      <>
        <DemoToolbar />
        <LoginPage />
      </>
    );
  }

  // Component chặn truy cập trái phép khi người dùng cố tình can thiệp state
  const AccessDeniedFallback = ({ targetView }: { targetView: string }) => (
    <div className="p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center max-w-lg mx-auto my-12">
      <div className="h-14 w-14 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <ShieldAlert className="h-8 w-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-900 mb-1">
        Từ chối truy cập phân hệ ({targetView})
      </h3>
      <p className="text-sm text-slate-600 mb-6">
        Tài khoản của bạn không có vai trò phù hợp để truy cập chức năng này.
      </p>
      <button
        onClick={() => {
          setDesktopMenu(getDefaultAuthorizedView(user, false));
          setMobileTab(getDefaultAuthorizedView(user, true));
        }}
        className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
      >
        Quay lại màn hình được cấp quyền
      </button>
    </div>
  );

  return (
    <>
      {/* Thanh công cụ Demo tương tác độc lập (DemoToolbar) */}
      <DemoToolbar />

      {/* Banner thông báo nổi bật (Task 12.2: Prominent Visual Alerts) */}
      <ProminentAlert />

      {/* Thanh trạng thái kết nối mạng (Phase 11: Offline Resilience) */}
      <NetworkStatusBar />

      {/* Viewport Mobile / Tablet nhỏ */}
      <div className="block lg:hidden">
        <MobileShell activeTab={mobileTab} onTabChange={setMobileTab}>
          {!isViewAuthorized(mobileTab, user) ? (
            <AccessDeniedFallback targetView={mobileTab} />
          ) : mobileTab === 'kitchen' ? (
            <KitchenModule />
          ) : mobileTab === 'warehouse' ? (
            <WarehouseModule />
          ) : mobileTab === 'reconciliation' ? (
            <ReconciliationModule />
          ) : mobileTab === 'attendance' || mobileTab === 'exam' || mobileTab === 'hr-attendance' ? (
            <HRModule currentUser={user} />
          ) : mobileTab === 'payroll' || mobileTab === 'profile' ? (
            <PayrollModule currentUser={user} />
          ) : (
            <Dashboard
              onNavigateToKitchen={() => setMobileTab('kitchen')}
              onNavigateToWarehouse={() => setMobileTab('warehouse')}
              onNavigateToReconciliation={() => setMobileTab('reconciliation')}
              onNavigateToHR={() => setMobileTab('hr-attendance')}
              onNavigateToPayroll={() => setMobileTab('payroll')}
            />
          )}
        </MobileShell>
      </div>

      {/* Viewport Desktop */}
      <div className="hidden lg:block">
        <DesktopShell activeMenu={desktopMenu} onMenuChange={setDesktopMenu}>
          {!isViewAuthorized(desktopMenu, user) ? (
            <AccessDeniedFallback targetView={desktopMenu} />
          ) : desktopMenu === 'kitchen' ? (
            <KitchenModule />
          ) : desktopMenu === 'warehouse' ? (
            <WarehouseModule />
          ) : desktopMenu === 'reconciliation' ? (
            <ReconciliationModule />
          ) : desktopMenu === 'hr-attendance' ? (
            <HRModule currentUser={user} />
          ) : desktopMenu === 'payroll' ? (
            <PayrollModule currentUser={user} />
          ) : (
            <Dashboard
              onNavigateToKitchen={() => setDesktopMenu('kitchen')}
              onNavigateToWarehouse={() => setDesktopMenu('warehouse')}
              onNavigateToReconciliation={() => setDesktopMenu('reconciliation')}
              onNavigateToHR={() => setDesktopMenu('hr-attendance')}
              onNavigateToPayroll={() => setDesktopMenu('payroll')}
            />
          )}
        </DesktopShell>
      </div>
    </>
  );
};

export default App;
