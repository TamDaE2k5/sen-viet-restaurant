import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { LoginPage } from './components/auth/LoginPage';
import { AdaptiveShell } from './components/layout/AdaptiveShell';
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

  // Khởi tạo phân hệ / view mặc định theo phân quyền người dùng (RBAC View Guard)
  const [activeView, setActiveView] = useState<string>('kitchen');

  // Tự động kiểm tra và chuyển về view mặc định hợp lệ khi thay đổi tài khoản
  useEffect(() => {
    if (user) {
      const defaultView = getDefaultAuthorizedView(user, false);
      if (!isViewAuthorized(activeView, user)) {
        setActiveView(defaultView);
      }
    }
  }, [user]);

  // Đồng bộ không gian làm việc khi người dùng chuyển đổi Context (Kitchen / Portal / Management)
  useEffect(() => {
    if (user) {
      if (activeContext === 'KITCHEN' && isViewAuthorized('kitchen', user)) {
        setActiveView('kitchen');
      } else if (activeContext === 'EMPLOYEE_PORTAL' && isViewAuthorized('hr-attendance', user)) {
        setActiveView('hr-attendance');
      } else if (activeContext === 'MANAGEMENT' && isViewAuthorized('dashboard', user)) {
        setActiveView('dashboard');
      }
    }
  }, [activeContext, user]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          <span className="text-sm font-semibold tracking-wide">
            Đang khởi động hệ thống Sen Việt Buffet...
          </span>
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
    <div className="p-8 bg-white rounded-2xl border border-rose-200 shadow-card text-center max-w-lg mx-auto my-12 animate-fade-in">
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
          setActiveView(getDefaultAuthorizedView(user, false));
        }}
        className="px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors shadow-sm active:scale-95"
      >
        Quay lại màn hình được cấp quyền
      </button>
    </div>
  );

  return (
    <>
      {/* Thanh công cụ Demo tương tác độc lập (DemoToolbar - Hỗ trợ Thu Gọn) */}
      <DemoToolbar />

      {/* Banner thông báo nổi bật (Task 12.2: Prominent Visual Alerts) */}
      <ProminentAlert />

      {/* Thanh trạng thái kết nối mạng (Phase 11: Offline Resilience) */}
      <NetworkStatusBar />

      {/* Khung Bố Cục Thích Ứng Đa Nền Tảng (Mobile, Tablet, Desktop PC) */}
      <AdaptiveShell activeView={activeView} onViewChange={setActiveView}>
        {!isViewAuthorized(activeView, user) ? (
          <AccessDeniedFallback targetView={activeView} />
        ) : activeView === 'kitchen' ? (
          <KitchenModule />
        ) : activeView === 'warehouse' ? (
          <WarehouseModule />
        ) : activeView === 'reconciliation' ? (
          <ReconciliationModule />
        ) : activeView === 'attendance' || activeView === 'exam' || activeView === 'hr-attendance' ? (
          <HRModule currentUser={user} />
        ) : activeView === 'payroll' || activeView === 'profile' ? (
          <PayrollModule currentUser={user} />
        ) : (
          <Dashboard
            onNavigateToKitchen={() => setActiveView('kitchen')}
            onNavigateToWarehouse={() => setActiveView('warehouse')}
            onNavigateToReconciliation={() => setActiveView('reconciliation')}
            onNavigateToHR={() => setActiveView('hr-attendance')}
            onNavigateToPayroll={() => setActiveView('payroll')}
          />
        )}
      </AdaptiveShell>
    </>
  );
};

export default App;
