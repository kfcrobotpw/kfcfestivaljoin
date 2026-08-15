import React from 'react';
import {
  LayoutDashboard,
  Award,
  QrCode,
  Users,
  CheckCircle,
  Settings,
  LogOut,
  Eye,
  Radio,
} from 'lucide-react';
import { isFirebaseConfigured } from '../../lib/firebase';

interface AdminLayoutProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onViewAsVisitor: () => void;
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({
  currentTab,
  onTabChange,
  onLogout,
  onViewAsVisitor,
  children,
}) => {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'completed', label: '완료자 목록', icon: CheckCircle },
    { id: 'booths', label: '부스 관리', icon: Award },
    { id: 'qr', label: 'QR 코드 관리', icon: QrCode },
    { id: 'participants', label: '참가자 관리', icon: Users },
    { id: 'settings', label: '설정', icon: Settings },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-6xl mx-auto px-4 py-6 pb-24">
      {/* Top Banner with Realtime Status */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center font-black">
            KFC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black text-white">K.F.C. ADMIN DASHBOARD</h1>
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-semibold">실시간 동기화 중</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              용인시청소년수련관 로봇동아리 축제 운영 관제 시스템
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onViewAsVisitor}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium flex items-center gap-1.5 border border-slate-700 transition-colors"
            id="btn-admin-preview-visitor"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" />
            <span>방문객 화면 보기</span>
          </button>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs font-medium flex items-center gap-1.5 border border-rose-800/50 transition-colors"
            id="btn-admin-logout"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>로그아웃</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              id={`tab-admin-${item.id}`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Pane */}
      <main className="space-y-6">{children}</main>
    </div>
  );
};
