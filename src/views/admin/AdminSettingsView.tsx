import React, { useState } from 'react';
import {
  Settings,
  Save,
  Trash2,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { FestivalSettings } from '../../types';
import {
  resetAllParticipants,
  db,
} from '../../services/firebaseService';
import { doc, setDoc } from 'firebase/firestore';

interface AdminSettingsViewProps {
  settings: FestivalSettings;
  onSaveSettings: (settings: FestivalSettings) => void;
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<FestivalSettings>(settings);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showResetAllConfirm, setShowResetAllConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await setDoc(doc(db, 'settings', 'general'), formData);
    } catch (err) {
      console.warn('Settings save error:', err);
    }
    onSaveSettings(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleResetAllData = async () => {
    setIsResetting(true);
    try {
      await resetAllParticipants();
      setShowResetAllConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>축제 및 동아리 기본 설정</span>
        </h2>
        <p className="text-xs text-slate-400">
          방문객 화면에 표시되는 메인 문구, 간식 수령 안내 메시지를 변경할 수 있습니다.
        </p>
      </div>

      {/* Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4"
        id="form-festival-settings"
      >
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            축제 앱 이름 (메인 타이틀)
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            메인 슬로건 / 부제목
          </label>
          <input
            type="text"
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            소속 동아리 / 단체명
          </label>
          <input
            type="text"
            value={formData.clubName}
            onChange={(e) => setFormData({ ...formData, clubName: e.target.value })}
            required
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              간식 교환처 명칭
            </label>
            <input
              type="text"
              value={formData.snackStationName}
              onChange={(e) => setFormData({ ...formData, snackStationName: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowManualCode}
                onChange={(e) => setFormData({ ...formData, allowManualCode: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-cyan-500"
              />
              <span className="text-xs text-slate-300 font-medium">
                카메라 외 코드 수동 입력 허용
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            간식 교환 안내 메시지
          </label>
          <textarea
            value={formData.snackMessage}
            onChange={(e) => setFormData({ ...formData, snackMessage: e.target.value })}
            rows={3}
            className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-cyan-400"
          />
        </div>

        <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20"
            id="btn-save-settings"
          >
            {savedSuccess ? <Check className="w-4 h-4 text-slate-950" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? '저장 완료!' : '설정 저장하기'}</span>
          </button>
        </div>
      </form>

      {/* Danger Zone: Reset Participants */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-rose-900/40 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-rose-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>위험 구역: 데이터 초기화</span>
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          새로운 축제 일차를 시작하거나 테스트 데이터를 비우려면 모든 참가자 기록을 일괄 초기화할 수 있습니다.
          (부스 정보는 유지됩니다)
        </p>
        <button
          type="button"
          onClick={() => setShowResetAllConfirm(true)}
          className="px-4 py-2.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-800/60 text-xs font-bold flex items-center gap-2"
          id="btn-reset-all-participants"
        >
          <Trash2 className="w-4 h-4" />
          <span>모든 참가자 기록 초기화</span>
        </button>
      </div>

      {/* Reset All Modal */}
      {showResetAllConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/40 rounded-3xl p-6 shadow-2xl text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/40 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">전체 참가자 기록 초기화</h3>
            <p className="text-xs text-slate-300 mb-4">
              정말로 모든 참가자 데이터 및 스탬프 진행 현황을 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleResetAllData}
                disabled={isResetting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isResetting ? '초기화 중...' : '예, 모두 초기화합니다'}
              </button>
              <button
                onClick={() => setShowResetAllConfirm(false)}
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
