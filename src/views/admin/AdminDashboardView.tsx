import React from 'react';
import {
  Users,
  Trophy,
  Activity,
  Percent,
  Sparkles,
  Award,
  ArrowRight,
  Clock,
  CheckCircle2,
  Gift,
  Download,
} from 'lucide-react';
import { Participant, Booth } from '../../types';
import { toggleSnackClaimed } from '../../services/firebaseService';

interface AdminDashboardViewProps {
  participants: Participant[];
  booths: Booth[];
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  participants,
  booths,
  onNavigateTab,
}) => {
  const totalCount = participants.length;
  const completedList = participants.filter((p) => p.isCompleted);
  const completedCount = completedList.length;
  const inProgressCount = Math.max(0, totalCount - completedCount);
  const completionRate = totalCount > 0 ? ((completedCount / totalCount) * 100).toFixed(1) : '0.0';
  const snackClaimedCount = participants.filter((p) => p.snackClaimed).length;

  // Active booths
  const activeBooths = booths.filter((b) => b.active);

  // Booth scan metrics
  const boothMetrics = activeBooths.map((booth) => {
    const scanCount = participants.filter((p) => p.completedBooths.includes(booth.id)).length;
    const pct = totalCount > 0 ? Math.round((scanCount / totalCount) * 100) : 0;
    return {
      booth,
      scanCount,
      pct,
    };
  });

  // Recent finishers sorted by completion time desc
  const recentFinishers = [...completedList]
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0))
    .slice(0, 8);

  const exportCSV = () => {
    const headers = ['참가자 ID', '진행률(%)', '완료여부', '완료시간', '간식수령여부', '등록일시'];
    const rows = participants.map((p) => [
      p.id,
      p.progress,
      p.isCompleted ? '완료' : '진행중',
      p.completedAt ? new Date(p.completedAt).toLocaleString('ko-KR') : '-',
      p.snackClaimed ? '수령' : '미수령',
      new Date(p.createdAt).toLocaleString('ko-KR'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `KFC_Festival_Participants_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: 전체 참여자 */}
        <div
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden"
          id="stat-card-total-participants"
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">👥 전체 참여자</span>
            <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">
              {totalCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">명</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">고유 익명 참가자 수</p>
        </div>

        {/* Card 2: 🎯 퀘스트 완료자 */}
        <div
          className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/40 shadow-lg relative overflow-hidden"
          id="stat-card-completed-finishers"
        >
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-semibold">🎯 퀘스트 완료자</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-amber-300 font-mono">
              {completedCount.toLocaleString()}
            </span>
            <span className="text-xs text-amber-400/80 font-medium">명</span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
            <span>간식 수령: {snackClaimedCount}명</span>
            <span className="text-amber-400 font-bold">100% 완료</span>
          </div>
        </div>

        {/* Card 3: 🔄 진행 중 */}
        <div
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden"
          id="stat-card-in-progress"
        >
          <div className="flex items-center justify-between text-cyan-400 mb-2">
            <span className="text-xs font-semibold">🔄 진행 중</span>
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono">
              {inProgressCount.toLocaleString()}
            </span>
            <span className="text-xs text-slate-400 font-medium">명</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">스탬프 수집 중</p>
        </div>

        {/* Card 4: 📊 전체 완료율 */}
        <div
          className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden"
          id="stat-card-completion-rate"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-semibold">📊 전체 완료율</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">
              {completionRate}%
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">완료자 / 전체 참여자</p>
        </div>
      </div>

      {/* Grid: Booth Metrics & Recent Finishers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Booth Visit Analytics */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200">부스별 체험 현황</h2>
            </div>
            <button
              onClick={() => onNavigateTab('booths')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
            >
              <span>부스 관리</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3">
            {boothMetrics.map(({ booth, scanCount, pct }) => (
              <div key={booth.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{booth.icon}</span>
                    <span className="text-xs font-bold text-slate-200">{booth.name}</span>
                  </div>
                  <div className="text-xs font-mono text-slate-400">
                    <strong className="text-cyan-400">{scanCount}명</strong> ({pct}%)
                  </div>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Finisher Feed */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200">
                실시간 퀘스트 완료자 ({completedCount}명)
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('completed')}
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>전체 보기</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-72">
            {recentFinishers.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                <Clock className="w-6 h-6 mb-2 text-slate-600" />
                <span>아직 완료자가 없습니다. 참가자가 미션을 완료하면 실시간 표시됩니다.</span>
              </div>
            ) : (
              recentFinishers.map((p, idx) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-mono font-bold text-slate-200">{p.id}</p>
                      <p className="text-[10px] text-slate-500">
                        {p.completedAt
                          ? new Date(p.completedAt).toLocaleTimeString('ko-KR')
                          : '방금 전'}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleSnackClaimed(p.id, !!p.snackClaimed)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold transition-colors ${
                      p.snackClaimed
                        ? 'bg-slate-800 text-slate-400 border border-slate-700'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                    }`}
                  >
                    {p.snackClaimed ? '간식 지급됨 ✓' : '간식 미지급 (클릭시 지급)'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Export / Quick Actions Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="text-xs text-slate-400">
          데이터 실시간 저장소: <strong className="text-slate-200">Firebase Firestore</strong>
        </div>
        <button
          onClick={exportCSV}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
          id="btn-export-csv"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>참가자 데이터 CSV 다운로드</span>
        </button>
      </div>
    </div>
  );
};
