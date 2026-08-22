import React, { useState } from 'react';
import {
  Trophy,
  CheckCircle2,
  Gift,
  Clock,
  Download,
  Search,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Participant, Booth } from '../../types';
import { toggleSnackClaimed } from '../../services/firebaseService';

interface AdminCompletedViewProps {
  participants: Participant[];
  booths: Booth[];
}

export const AdminCompletedView: React.FC<AdminCompletedViewProps> = ({
  participants,
  booths,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [snackFilter, setSnackFilter] = useState<'all' | 'claimed' | 'unclaimed'>('all');

  // Filter 100% completed participants and sort by completedAt desc
  const completedList = participants
    .filter((p) => p.isCompleted)
    .sort((a, b) => (b.completedAt || 0) - (a.completedAt || 0));

  const filtered = completedList.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const cleanNum = p.id.replace('participant_', '');
    const matches =
      p.id.toLowerCase().includes(term) ||
      cleanNum.includes(term) ||
      `#${cleanNum}`.includes(term) ||
      `참가자 #${cleanNum}`.toLowerCase().includes(term);
    if (!matches) return false;
    if (snackFilter === 'claimed') return p.snackClaimed;
    if (snackFilter === 'unclaimed') return !p.snackClaimed;
    return true;
  });

  const claimedCount = completedList.filter((p) => p.snackClaimed).length;
  const unclaimedCount = completedList.length - claimedCount;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>🎯 퀘스트 완료자 목록 ({completedList.length}명)</span>
          </h2>
          <p className="text-xs text-slate-400">
            모든 활성화된 부스 체험을 100% 완료한 참가자 목록입니다. 간식 수령 여부를 체크할 수 있습니다.
          </p>
        </div>

        {/* Quick Stats Badges */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold font-mono">
            완료: {completedList.length}명
          </span>
          <span className="px-3 py-1 rounded-xl bg-emerald-950/80 border border-emerald-800 text-emerald-400 text-xs font-bold font-mono">
            간식 지급 완료: {claimedCount}명
          </span>
          <span className="px-3 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium font-mono">
            미지급: {unclaimedCount}명
          </span>
        </div>
      </div>

      {/* Filter controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="완료자 ID 검색..."
            className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
          <button
            onClick={() => setSnackFilter('all')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              snackFilter === 'all' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
            }`}
          >
            전체 ({completedList.length})
          </button>
          <button
            onClick={() => setSnackFilter('unclaimed')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              snackFilter === 'unclaimed'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'text-slate-400'
            }`}
          >
            간식 미지급 ({unclaimedCount})
          </button>
          <button
            onClick={() => setSnackFilter('claimed')}
            className={`px-3 py-1 rounded-lg font-medium transition-colors ${
              snackFilter === 'claimed'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400'
            }`}
          >
            지급 완료 ({claimedCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">순번</th>
                <th className="py-3.5 px-4">참가자 ID</th>
                <th className="py-3.5 px-4">완료 시간</th>
                <th className="py-3.5 px-4">소요 부스</th>
                <th className="py-3.5 px-4">간식 수령 상태</th>
                <th className="py-3.5 px-4 text-right">스태프 확인</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    완료자가 없거나 검색 조건에 맞는 항목이 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((p, idx) => {
                  const completedDate = p.completedAt ? new Date(p.completedAt) : null;
                  const timeFormatted = completedDate
                    ? completedDate.toLocaleTimeString('ko-KR', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '방금 전';

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Rank Number */}
                      <td className="py-3.5 px-4">
                        <span className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 font-mono font-bold text-xs flex items-center justify-center">
                          #{idx + 1}
                        </span>
                      </td>

                      {/* Participant ID */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          #{p.id.replace('participant_', '')}
                        </span>
                      </td>

                      {/* Completed Time */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{timeFormatted}</span>
                        </div>
                      </td>

                      {/* Booths Count */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 font-mono text-[11px] border border-slate-800">
                          {p.completedBooths.length}개 부스 완주
                        </span>
                      </td>

                      {/* Snack Claim Status */}
                      <td className="py-3.5 px-4">
                        {p.snackClaimed ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-[11px] font-semibold">
                            <Check className="w-3 h-3" />
                            <span>간식 수령 완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[11px] font-semibold animate-pulse">
                            <Gift className="w-3 h-3" />
                            <span>간식 미수령</span>
                          </span>
                        )}
                      </td>

                      {/* Action Button */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => toggleSnackClaimed(p.id, !!p.snackClaimed)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors ${
                            p.snackClaimed
                              ? 'bg-slate-800 hover:bg-slate-750 text-slate-300 border border-slate-700'
                              : 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-md shadow-amber-500/20'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{p.snackClaimed ? '지급 취소' : '간식 지급 확인'}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
