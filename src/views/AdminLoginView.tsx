import React, { useState } from 'react';
import { Shield, KeyRound, User, ArrowRight, Bot, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../services/adminAuthService';

interface AdminLoginViewProps {
  onLoginSuccess: () => void;
  onNavigateHome: () => void;
}

export const AdminLoginView: React.FC<AdminLoginViewProps> = ({
  onLoginSuccess,
  onNavigateHome,
}) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      const res = loginAdmin(username, password);
      if (res.success) {
        onLoginSuccess();
      } else {
        setError(res.error || '아이디 또는 비밀번호가 올바르지 않습니다.');
      }
      setLoading(false);
    }, 150);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden"
        id="card-admin-login"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/10 blur-[60px] rounded-full pointer-events-none" />

        {/* Brand Icon */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-cyan-500/15">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-black text-white">K.F.C. 축제 관리자 로그인</h2>
          <p className="text-xs text-slate-400 mt-1">부스 및 QR 코드 관리, 완료자 통계 대시보드</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              관리자 아이디
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ID 입력"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
                id="input-admin-username"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              관리자 비밀번호
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호 입력"
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
                required
                id="input-admin-password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
            id="btn-admin-login-submit"
          >
            <span>{loading ? '로그인 중...' : '대시보드 접속'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <button
            onClick={onNavigateHome}
            className="hover:text-slate-200 transition-colors"
            id="btn-back-to-visitor-home"
          >
            ← 방문객 화면으로
          </button>
          <span className="text-[11px] text-slate-500 font-mono">기본: admin / 1234</span>
        </div>
      </div>
    </div>
  );
};
