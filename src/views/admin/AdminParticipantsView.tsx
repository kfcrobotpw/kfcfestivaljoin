import React, { useState } from 'react';
import {
  Users,
  Search,
  RotateCcw,
  CheckCircle2,
  Clock,
  Trash2,
  Filter,
  Check,
  Gift,
} from 'lucide-react';
import { Participant, Booth } from '../../types';
import { resetParticipant, toggleSnackClaimed } from '../../services/firebaseService';

interface AdminParticipantsViewProps {
  participants: Participant[];
  booths: Booth[];
}

export const AdminParticipantsView: React.FC<AdminParticipantsViewProps> = ({
  participants,
  booths,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'in_progress'>('all');
  const [resetTargetId, setResetTargetId] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const filtered = participants.filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const cleanNum = p.id.replace('participant_', '');
    const matchesSearch =
      p.id.toLowerCase().includes(term) ||
      cleanNum.includes(term) ||
      `#${cleanNum}`.includes(term) ||
      `참가자 #${cleanNum}`.toLowerCase().includes(term);
    if (!matchesSearch) return false;
    if (statusFilter === 'completed') return p.isCompleted;
    if (statusFilter === 'in_progress') return !p.isCompleted;
    return true;
  });

  const handleConfirmReset = async () => {
    if (!resetTargetId) return;
    setIsResetting(true);
    try {
      await resetParticipant(resetTargetId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
      setResetTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>참가자 현황 관리 ({participants.length}명)</span>
          </h2>
          <p className="text-xs text-slate-400">
            참가자별 스탬프 진행률과 인증 상태를 확인하고 필요한 경우 개별 초기화할 수 있습니다.
          </p>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="참가자 ID 검색..."
              className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'
              }`}
            >
              전체
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-amber-500 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              완료자
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                statusFilter === 'in_progress'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400'
              }`}
            >
              진행 중
            </button>
          </div>
        </div>
      </div>

      {/* Participants Table / Cards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/80 text-[11px] font-semibold text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">참가자 ID</th>
                <th className="py-3.5 px-4">진행률</th>
                <th className="py-3.5 px-4">완료 부스</th>
                <th className="py-3.5 px-4">상태</th>
                <th className="py-3.5 px-4">간식 수령</th>
                <th className="py-3.5 px-4 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    검색 조건에 일치하는 참가자가 없습니다.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* ID & Registered Time */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-100 text-sm">
                          #{p.id.replace('participant_', '')}
                        </span>
                        <span className="block text-[10px] text-slate-500 mt-0.5">
                          {new Date(p.createdAt).toLocaleTimeString('ko-KR')}
                        </span>
                      </td>

                      {/* Progress Bar */}
                      <td className="py-3.5 px-4">
                        <div className="w-24">
                          <div className="flex justify-between text-[10px] mb-1 font-mono">
                            <span className="text-cyan-400 font-bold">{p.progress}%</span>
                            <span className="text-slate-500">
                              {p.completedBooths.length}/{booths.filter((b) => b.active).length}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.isCompleted ? 'bg-amber-400' : 'bg-cyan-500'
                              }`}
                              style={{ width: `${p.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Completed Booths Badges */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {p.completedBooths.map((bid) => {
                            const b = booths.find((x) => x.id === bid);
                            return (
                              <span
                                key={bid}
                                className="px-1.5 py-0.5 rounded bg-slate-950 text-[10px] text-slate-300 border border-slate-800"
                              >
                                {b ? b.name.split(' ')[0] : bid}
                              </span>
                            );
                          })}
                          {p.completedBooths.length === 0 && (
                            <span className="text-[10px] text-slate-600">미완료</span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {p.isCompleted ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80 text-[10px] font-bold">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>완료</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px]">
                            <Clock className="w-3 h-3" />
                            <span>진행 중</span>
                          </span>
                        )}
                      </td>

                      {/* Snack Claimed */}
                      <td className="py-3.5 px-4">
                        {p.isCompleted ? (
                          <button
                            onClick={() => toggleSnackClaimed(p.id, !!p.snackClaimed)}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold transition-colors ${
                              p.snackClaimed
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                            }`}
                          >
                            {p.snackClaimed ? '수령 완료 ✓' : '미수령 (지급하기)'}
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-600">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setResetTargetId(p.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-slate-400 hover:text-rose-300 text-[11px] font-medium transition-colors"
                          title="체험 기록 초기화"
                        >
                          초기화
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

      {/* Reset Participant Confirm Modal */}
      {resetTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">참가자 기록 초기화</h3>
            <p className="text-xs text-slate-300 mb-4">
              <strong>{resetTargetId}</strong> 참가자의 체험 기록을 초기화하시겠습니까?
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isResetting ? '초기화 중...' : '예, 초기화합니다'}
              </button>
              <button
                onClick={() => setResetTargetId(null)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
