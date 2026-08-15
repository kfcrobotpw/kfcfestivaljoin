import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Sparkles,
  Gift,
  Bot,
  CheckCircle2,
  Calendar,
  Home,
  QrCode,
  Check,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import { Participant, FestivalSettings, Booth } from '../types';
import { soundService } from '../services/soundService';
import { toggleSnackClaimed } from '../services/firebaseService';

interface CompletionViewProps {
  participant: Participant | null;
  settings: FestivalSettings;
  booths: Booth[];
  onNavigateHome: () => void;
  onOpenScanner: () => void;
}

export const CompletionView: React.FC<CompletionViewProps> = ({
  participant,
  settings,
  booths,
  onNavigateHome,
  onOpenScanner,
}) => {
  const [showSnackPass, setShowSnackPass] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    // Fire festive confetti barrage
    soundService.playFanfare();

    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }, []);

  const completedDateStr = participant?.completedAt
    ? new Date(participant.completedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '방금 전';

  const handleToggleClaim = async () => {
    if (!participant) return;
    setIsClaiming(true);
    try {
      await toggleSnackClaimed(participant.id, !!participant.snackClaimed);
      soundService.playSuccess();
    } catch {
      soundService.playError();
    } finally {
      setIsClaiming(false);
    }
  };

  const activeBooths = booths.filter((b) => b.active);

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-xl mx-auto px-4 py-8 pb-24 text-center">
      {/* Celebration Trophy Icon */}
      <div className="relative inline-block mb-4">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 p-1 shadow-2xl shadow-amber-500/30 mx-auto animate-in zoom-in-50 duration-300">
          <div className="w-full h-full bg-slate-950 rounded-[22px] flex items-center justify-center text-amber-400">
            <Trophy className="w-12 h-12 animate-pulse" />
          </div>
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-xs shadow-lg animate-bounce">
          <Sparkles className="w-4 h-4" />
        </div>
      </div>

      {/* Main Complete Headings */}
      <div className="mb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 text-xs font-semibold mb-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>MISSION ACCOMPLISHED</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          🎉 모든 체험 완료!
        </h1>

        <p className="text-base sm:text-lg text-cyan-300 font-bold mb-1">
          K.F.C.의 모든 체험을 완료했습니다!
        </p>

        <p className="text-xs sm:text-sm text-slate-400">
          로봇동아리 K.F.C. 축제 부스에 참여해주셔서 진심으로 감사드립니다.
        </p>
      </div>

      {/* Big Action Button: 🍪 간식 받으러 가기 */}
      <div className="my-6">
        <button
          onClick={() => setShowSnackPass(true)}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-lg shadow-2xl shadow-amber-500/30 flex items-center justify-center gap-3 transition-transform active:scale-[0.98] border border-amber-300/40 animate-pulse"
          id="btn-claim-snack"
        >
          <Gift className="w-6 h-6" />
          <span>🍪 간식 받으러 가기</span>
        </button>
      </div>

      {/* Digital Stamp Certificate Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-left mb-6">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-xs text-slate-200">K.F.C. 미션 완주 인증서</span>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-semibold">
            {participant?.id.replace('participant_', 'ID: ')}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-4">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">완료 시간</span>
            <span className="font-mono text-slate-200 font-medium">{completedDateStr}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 block mb-0.5">간식 수령 상태</span>
            <span
              className={`font-semibold ${
                participant?.snackClaimed ? 'text-slate-400 line-through' : 'text-amber-400'
              }`}
            >
              {participant?.snackClaimed ? '수령 완료 ✓' : '미수령 (교환 가능)'}
            </span>
          </div>
        </div>

        {/* Completed Booths Badges */}
        <div>
          <span className="text-[11px] font-medium text-slate-400 block mb-2">
            완료한 체험 부스 ({activeBooths.length}개)
          </span>
          <div className="grid grid-cols-2 gap-2">
            {activeBooths.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-2 p-2 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 text-xs font-semibold"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span className="truncate">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-2">
        <button
          onClick={onNavigateHome}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          id="btn-return-home"
        >
          <Home className="w-4 h-4" />
          <span>체험 메인으로</span>
        </button>

        <button
          onClick={onOpenScanner}
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center gap-1.5"
          id="btn-scanner-from-complete"
        >
          <QrCode className="w-4 h-4 text-cyan-400" />
          <span>QR 스캔</span>
        </button>
      </div>

      {/* Snack Pass Modal */}
      {showSnackPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 shadow-2xl relative text-center"
            id="modal-snack-pass"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-8 h-8" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>K.F.C. FESTIVAL SNACK VOUCHER</span>
            </div>

            <h3 className="text-xl font-black text-white mb-1">🎁 간식 교환권</h3>
            <p className="text-xs text-slate-300 mb-4">{settings.snackStationName}</p>

            {/* Instruction Box */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-300 mb-4">
              <p className="font-semibold text-amber-300 mb-1">수령 안내</p>
              <p className="text-[11px] leading-relaxed text-slate-400">
                {settings.snackMessage}
              </p>
            </div>

            {/* Verification Barcode / Stamp area */}
            <div className="p-4 rounded-2xl bg-white text-slate-950 mb-4">
              <div className="flex items-center justify-between text-xs font-mono mb-2">
                <span className="text-[10px] text-slate-500">인증 참가자</span>
                <strong className="text-slate-900">{participant?.id}</strong>
              </div>
              <div className="h-10 bg-slate-900 rounded flex items-center justify-center text-cyan-400 font-mono tracking-widest text-xs font-bold">
                |||||| | |||| ||||| ||| |||
              </div>
              <p className="text-[9px] text-slate-500 mt-1.5">KFC-VERIFIED-{completedDateStr}</p>
            </div>

            {/* Staff claim verification */}
            <div className="pt-2 border-t border-slate-800">
              <p className="text-[10px] text-slate-400 mb-2">
                운영진 확인용 (간식 전달 후 아래 버튼을 눌러주세요)
              </p>
              <button
                onClick={handleToggleClaim}
                disabled={isClaiming}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  participant?.snackClaimed
                    ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30'
                }`}
                id="btn-staff-claim-toggle"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {participant?.snackClaimed ? '간식 지급 완료됨 (취소하려면 클릭)' : '스태프 확인 (간식 지급 완료)'}
                </span>
              </button>
            </div>

            <button
              onClick={() => setShowSnackPass(false)}
              className="mt-3 text-xs text-slate-400 hover:text-slate-200 py-1"
              id="btn-close-snack-pass"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
