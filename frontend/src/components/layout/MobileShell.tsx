import React, { ReactNode } from 'react';
import { Navbar } from './Navbar';
import { Flame, Clock, Award, UserCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface MobileShellProps {
  children: ReactNode;
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

export const MobileShell: React.FC<MobileShellProps> = ({
  children,
  activeTab = 'kitchen',
  onTabChange,
}) => {
  const { isKitchen } = useAuth();

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Header */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-3 pb-24 max-w-md mx-auto w-full">
        {children}
      </main>

      {/* Bottom Sticky Navigation (Mobile-first, nút bấm to) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-30 shadow-lg">
        <div className="max-w-md mx-auto grid grid-cols-4 h-16">
          <button
            onClick={() => onTabChange && onTabChange('kitchen')}
            className={`btn-touch flex flex-col items-center justify-center transition-colors ${
              activeTab === 'kitchen' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Flame className="h-6 w-6" />
            <span className="text-[11px] mt-1">{isKitchen ? 'Bếp 4 Nút' : 'Vận hành'}</span>
          </button>

          <button
            onClick={() => onTabChange && onTabChange('attendance')}
            className={`btn-touch flex flex-col items-center justify-center transition-colors ${
              activeTab === 'attendance' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="h-6 w-6" />
            <span className="text-[11px] mt-1">Chấm công</span>
          </button>

          <button
            onClick={() => onTabChange && onTabChange('exam')}
            className={`btn-touch flex flex-col items-center justify-center transition-colors ${
              activeTab === 'exam' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Award className="h-6 w-6" />
            <span className="text-[11px] mt-1">Thi nghề</span>
          </button>

          <button
            onClick={() => onTabChange && onTabChange('profile')}
            className={`btn-touch flex flex-col items-center justify-center transition-colors ${
              activeTab === 'profile' ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="h-6 w-6" />
            <span className="text-[11px] mt-1">Cá nhân</span>
          </button>
        </div>
      </nav>
    </div>
  );
};
