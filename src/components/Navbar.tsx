import React from 'react';
import { Bot, Shield, QrCode, Home, Sparkles, Camera } from 'lucide-react';
import { isFirebaseConfigured } from '../lib/firebase';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  participantId?: string;
  isCompleted?: boolean;
  onOpenPermissionModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  participantId,
  isCompleted,
  onOpenPermissionModal,
}) => {
  const isAdminView = currentView.startsWith('admin');

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate(isAdminView ? 'admin/dashboard' : 'home')}
          className="flex items-center gap-2.5 text-left focus:outline-none group"
          id="btn-brand-home"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center group-hover:bg-slate-900 transition-colors">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black tracking-wider text-base bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
                K.F.C.
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
                ROBOT
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">용인시청소년수련관 로봇동아리</p>
          </div>
        </button>

        {/* Right Action / Participant Status */}
        <div className="flex items-center gap-2">
          {!isAdminView ? (
            <>
              {/* Camera Re-request Quick Button in Top Bar */}
              {onOpenPermissionModal && (
                <button
                  onClick={onOpenPermissionModal}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-750 text-slate-300 hover:text-cyan-300 text-xs font-medium transition-colors"
                  title="카메라 권한 다시 수락하기"
                  id="btn-nav-camera-permission"
                >
                  <Camera className="w-3.5 h-3.5 text-cyan-400" />
                  <span>카메라 권한</span>
                </button>
              )}

              {participantId && (
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>ID: {participantId.replace('participant_', '')}</span>
                </div>
              )}

              {isCompleted && (
                <button
                  onClick={() => onNavigate('complete')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold hover:bg-amber-500/30 transition-all animate-bounce"
                  id="btn-nav-snack-pass"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>간식 수령권</span>
                </button>
              )}

              <button
                onClick={() => onNavigate('scan')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/25 active:scale-95 transition-all"
                id="btn-nav-scan"
              >
                <QrCode className="w-4 h-4" />
                <span>QR 스캔</span>
              </button>

              <button
                onClick={() => onNavigate('admin')}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent hover:border-slate-800 transition-colors"
                title="관리자 모드"
                id="btn-nav-admin"
              >
                <Shield className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-750 font-medium text-xs transition-colors"
                id="btn-nav-exit-admin"
              >
                <Home className="w-4 h-4 text-cyan-400" />
                <span>체험 화면으로</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

