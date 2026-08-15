import React, { useState } from 'react';
import {
  Award,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  QrCode,
  Sparkles,
} from 'lucide-react';
import { Booth } from '../../types';
import {
  saveBooth,
  deleteBooth,
  generateBoothToken,
} from '../../services/firebaseService';

interface AdminBoothsViewProps {
  booths: Booth[];
  onOpenQRModal: (booth: Booth) => void;
}

export const AdminBoothsView: React.FC<AdminBoothsViewProps> = ({
  booths,
  onOpenQRModal,
}) => {
  const [editingBooth, setEditingBooth] = useState<Booth | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const handleAddNew = () => {
    const newBooth: Booth = {
      id: `booth_${Date.now().toString(36)}`,
      name: '새로운 로봇 체험',
      description: '부스 설명 및 미션 안내를 입력해주세요.',
      icon: '🤖',
      order: booths.length + 1,
      active: true,
      qrToken: generateBoothToken('KFC-BOOTH'),
      location: '축제 행사장 부스',
      hint: '미션 완료 후 현장 QR 코드를 스캔하세요!',
      createdAt: Date.now(),
    };
    setEditingBooth(newBooth);
    setIsNew(true);
  };

  const handleEdit = (booth: Booth) => {
    setEditingBooth({ ...booth });
    setIsNew(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooth) return;
    await saveBooth(editingBooth);
    setEditingBooth(null);
    setIsNew(false);
  };

  const handleDelete = async (id: string) => {
    await deleteBooth(id);
    setDeleteConfirmId(null);
  };

  const handleToggleActive = async (booth: Booth) => {
    await saveBooth({
      ...booth,
      active: !booth.active,
    });
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= booths.length) return;

    const current = booths[index];
    const target = booths[targetIdx];

    const currentOrder = current.order || index + 1;
    const targetOrder = target.order || targetIdx + 1;

    await saveBooth({ ...current, order: targetOrder });
    await saveBooth({ ...target, order: currentOrder });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-cyan-400" />
            <span>체험 부스 관리 ({booths.length}개)</span>
          </h2>
          <p className="text-xs text-slate-400">
            축제 부스 정보를 실시간으로 추가, 수정 및 활성화/비활성화할 수 있습니다.
          </p>
        </div>

        <button
          onClick={handleAddNew}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25 transition-transform active:scale-95"
          id="btn-add-booth"
        >
          <Plus className="w-4 h-4" />
          <span>새 부스 추가</span>
        </button>
      </div>

      {/* Booths List */}
      <div className="grid grid-cols-1 gap-3">
        {booths.map((booth, idx) => (
          <div
            key={booth.id}
            className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              booth.active
                ? 'bg-slate-900 border-slate-800'
                : 'bg-slate-900/40 border-slate-800/50 opacity-65'
            }`}
            id={`admin-booth-row-${booth.id}`}
          >
            {/* Left: Icon & Info */}
            <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl flex-shrink-0">
                {booth.icon || '🤖'}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    순서 #{booth.order || idx + 1}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      booth.active
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                        : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                    }`}
                  >
                    {booth.active ? '운영 중 (활성)' : '일시 중단 (비활성)'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 truncate">{booth.name}</h3>
                <p className="text-xs text-slate-400 line-clamp-1">{booth.description}</p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono mt-1">
                  <span>인증코드: {booth.qrToken}</span>
                  {booth.location && <span>| 위치: {booth.location}</span>}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 self-end sm:self-center flex-shrink-0">
              {/* Order buttons */}
              <button
                onClick={() => handleMoveOrder(idx, 'up')}
                disabled={idx === 0}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                title="위로 이동"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleMoveOrder(idx, 'down')}
                disabled={idx === booths.length - 1}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 text-xs"
                title="아래로 이동"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>

              {/* QR Code view / print */}
              <button
                onClick={() => onOpenQRModal(booth)}
                className="p-2 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-400 border border-cyan-800/40 text-xs"
                title="QR 코드 보기/인쇄"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              {/* Toggle Active */}
              <button
                onClick={() => handleToggleActive(booth)}
                className={`p-2 rounded-lg text-xs ${
                  booth.active
                    ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
                title={booth.active ? '부스 비활성화하기' : '부스 활성화하기'}
              >
                {booth.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>

              {/* Edit */}
              <button
                onClick={() => handleEdit(booth)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                title="수정"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={() => setDeleteConfirmId(booth.id)}
                className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 text-xs"
                title="삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Modal */}
      {editingBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div
            className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]"
            id="modal-edit-booth"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h3 className="font-bold text-slate-100 text-base">
                {isNew ? '✨ 새 체험 부스 추가' : '✏️ 부스 정보 수정'}
              </h3>
              <button
                onClick={() => setEditingBooth(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5">
              <div className="grid grid-cols-4 gap-3">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    부스 이름 *
                  </label>
                  <input
                    type="text"
                    value={editingBooth.name}
                    onChange={(e) => setEditingBooth({ ...editingBooth, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">아이콘</label>
                  <input
                    type="text"
                    value={editingBooth.icon || '🤖'}
                    onChange={(e) => setEditingBooth({ ...editingBooth, icon: e.target.value })}
                    placeholder="🤖"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white text-center focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">부스 설명 *</label>
                <textarea
                  value={editingBooth.description}
                  onChange={(e) => setEditingBooth({ ...editingBooth, description: e.target.value })}
                  rows={2}
                  required
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">부스 위치</label>
                  <input
                    type="text"
                    value={editingBooth.location || ''}
                    onChange={(e) => setEditingBooth({ ...editingBooth, location: e.target.value })}
                    placeholder="예: A구역 1번 부스"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">순서 번호</label>
                  <input
                    type="number"
                    value={editingBooth.order || 1}
                    onChange={(e) =>
                      setEditingBooth({ ...editingBooth, order: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">QR 인증 힌트</label>
                <input
                  type="text"
                  value={editingBooth.hint || ''}
                  onChange={(e) => setEditingBooth({ ...editingBooth, hint: e.target.value })}
                  placeholder="예: 미션 완주 후 운영진 명찰의 QR을 스캔하세요."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  QR 인증 토큰
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingBooth.qrToken}
                    onChange={(e) => setEditingBooth({ ...editingBooth, qrToken: e.target.value })}
                    required
                    className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditingBooth({
                        ...editingBooth,
                        qrToken: generateBoothToken('KFC-BOOTH'),
                      })
                    }
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
                  >
                    랜덤 생성
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-booth-active"
                  checked={editingBooth.active}
                  onChange={(e) => setEditingBooth({ ...editingBooth, active: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                />
                <label htmlFor="chk-booth-active" className="text-xs text-slate-300 font-medium">
                  부스 활성화 (체험 방문객에게 표시)
                </label>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-800">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/25"
                >
                  <Check className="w-4 h-4" />
                  <span>저장하기</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingBooth(null)}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">부스 삭제 확인</h3>
            <p className="text-xs text-slate-400 mb-4">
              정말로 이 부스를 삭제하시겠습니까? 삭제된 부스는 방문객 화면에서도 즉시 제외됩니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                삭제
              </button>
              <button
                onClick={() => setDeleteConfirmId(null)}
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
