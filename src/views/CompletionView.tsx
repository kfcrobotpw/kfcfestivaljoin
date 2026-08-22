import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Trophy,
  Sparkles,
  Gift,
  Bot,
  CheckCircle2,
  Home,
  QrCode,
  Check,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { Participant, FestivalSettings, Booth } from '../types';
import { soundService } from '../services/soundService';
import { markSnackClaimed } from '../services/firebaseService';
import { KFCLogo } from '../components/KFCLogo';

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
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
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

  // Generate Visitor's Snack QR Code
  useEffect(() => {
    if (!participant) return;
    const payload = `KFC-SNACK:${participant.id}`;
    QRCode.toDataURL(payload, {
      width: 320,
      margin: 2,
      color: {
        dark: '#020617',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setQrCodeDataUrl(url))
      .catch((err) => console.error('Snack QR generation failed:', err));
  }, [participant?.id]);

  const completedDateStr = participant?.completedAt
    ? new Date(participant.completedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '방금 전';

  const claimedDateStr = participant?.snackClaimedAt
    ? new Date(participant.snackClaimedAt).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : null;

  // Manual snack claim handler (One-way only: cannot be reverted to unclaimed by individual)
  const handleManualClaim = async () => {
    if (!participant || participant.snackClaimed) return;
    setIsClaiming(true);
    try {
      await markSnackClaimed(participant.id);
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

      {/* Big Action Button: 🍪 간식 받으러 가기 (개인 QR 교환권 열기) */}
      <div className="my-6">
        <button
          onClick={() => setShowSnackPass(true)}
          className={`w-full py-4 px-6 rounded-2xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-transform active:scale-[0.98] border ${
            participant?.snackClaimed
              ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 shadow-slate-950/50'
              : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-slate-950 border-amber-300/40 shadow-amber-500/30 animate-pulse'
          }`}
          id="btn-claim-snack"
        >
          <Gift className="w-6 h-6" />
          <span>
            {participant?.snackClaimed ? '🎁 간식 교환권 확인 (수령 완료)' : '🍪 간식 받으러 가기 (QR 교환권)'}
          </span>
        </button>
      </div>

      {/* Embedded Quick Snack QR Card */}
      <div
        className={`p-5 rounded-3xl border shadow-2xl text-center mb-6 transition-all ${
          participant?.snackClaimed
            ? 'bg-slate-900/90 border-slate-800'
            : 'bg-gradient-to-b from-slate-900 via-slate-900 to-amber-950/30 border-amber-500/40 shadow-amber-500/10'
        }`}
        id="card-snack-qr-preview"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-amber-400" />
            <span className="font-bold text-sm text-slate-100">개인 간식 수령 QR 코드</span>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              participant?.snackClaimed
                ? 'bg-rose-950/80 border border-rose-800 text-rose-300'
                : 'bg-emerald-950/80 border border-emerald-800 text-emerald-400 animate-pulse'
            }`}
          >
            {participant?.snackClaimed ? '🚫 사용 완료' : '🟢 교환 가능 (1회용)'}
          </span>
        </div>

        {/* QR Display Area */}
        <div className="relative inline-block my-2 p-3 bg-white rounded-2xl shadow-xl">
          {qrCodeDataUrl ? (
            <img
              src={qrCodeDataUrl}
              alt="Snack Claim QR"
              className={`w-44 h-44 sm:w-48 sm:h-48 mx-auto rounded-lg transition-opacity ${
                participant?.snackClaimed ? 'opacity-25 grayscale' : 'opacity-100'
              }`}
            />
          ) : (
            <div className="w-44 h-44 bg-slate-100 flex items-center justify-center text-slate-400">
              QR 생성 중...
            </div>
          )}

          {/* Used Stamp Overlay */}
          {participant?.snackClaimed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-2">
              <div className="px-4 py-2 bg-rose-600/90 text-white font-black text-lg tracking-wider rounded-xl rotate-[-12deg] shadow-2xl border-2 border-white flex items-center gap-1.5 animate-in zoom-in-75">
                <Lock className="w-5 h-5" />
                <span>사용 완료</span>
              </div>
              {claimedDateStr && (
                <span className="mt-2 px-2 py-0.5 bg-slate-950/90 text-rose-300 text-[10px] font-mono rounded font-bold">
                  {claimedDateStr} 수령
                </span>
              )}
            </div>
          )}
        </div>

        {/* Guidance Text & Staff Action */}
        {participant?.snackClaimed ? (
          <div className="mt-3 p-3 rounded-2xl bg-rose-950/40 border border-rose-800/40 text-left">
            <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs mb-1">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>이미 간식 수령이 완료된 교환권입니다</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              본 교환권은 1회용으로 이미 간식을 수령하셨습니다. 중복 수령 방지를 위해 개인 기기에서는 지급 전 상태로 되돌릴 수 없습니다.
            </p>
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-left space-y-2.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-bold text-xs">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span>동아리 부스 운영진에게 이 QR 코드를 보여주세요!</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              운영진이 스마트폰으로 위 QR 코드를 스캔하면 즉시 맛있는 간식이 지급되며 교환권이 사용 완료 처리됩니다.
            </p>
            <div className="pt-2 border-t border-amber-800/30 flex items-center justify-between gap-2">
              <span className="text-[10px] text-amber-300/80">스캔이 어려우신가요?</span>
              <button
                onClick={handleManualClaim}
                disabled={isClaiming}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
                id="btn-card-manual-claim"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{isClaiming ? '처리 중...' : '스태프 수동 확인'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Digital Stamp Certificate Card */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-left mb-6">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-white p-0.5 shadow border border-cyan-400/50 flex items-center justify-center shrink-0">
              <KFCLogo className="w-full h-full" />
            </div>
            <span className="font-bold text-xs text-slate-200">K.F.C. 미션 완주 인증서</span>
          </div>
          <span className="font-mono text-xs text-cyan-400 font-semibold">
            참가자 #{participant?.id.replace('participant_', '')}
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
                participant?.snackClaimed ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              {participant?.snackClaimed ? `수령 완료 (${claimedDateStr || '완료'})` : '미수령 (교환 가능)'}
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

      {/* Fullscreen Snack Pass Modal */}
      {showSnackPass && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm bg-slate-900 border-2 rounded-3xl p-6 shadow-2xl relative text-center ${
              participant?.snackClaimed ? 'border-rose-500/50' : 'border-amber-500/70'
            }`}
            id="modal-snack-pass"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <Gift className="w-7 h-7" />
            </div>

            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              <span>K.F.C. FESTIVAL SNACK VOUCHER</span>
            </div>

            <h3 className="text-xl font-black text-white mb-0.5">🎁 1인 1회 간식 교환권</h3>
            <p className="text-xs text-slate-300 mb-4">{settings.snackStationName}</p>

            {/* QR Code Container */}
            <div className="relative p-4 bg-white rounded-2xl shadow-xl mb-4">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="Snack Claim QR"
                  className={`w-48 h-48 mx-auto rounded-lg ${
                    participant?.snackClaimed ? 'opacity-20 grayscale' : 'opacity-100'
                  }`}
                />
              ) : (
                <div className="w-48 h-48 bg-slate-100 flex items-center justify-center text-slate-400">
                  QR 생성 중...
                </div>
              )}

              {/* Overlaid Claimed Stamp */}
              {participant?.snackClaimed && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="px-4 py-2 bg-rose-600 text-white font-black text-xl tracking-wider rounded-xl rotate-[-12deg] shadow-2xl border-2 border-white flex items-center gap-1.5">
                    <Lock className="w-6 h-6" />
                    <span>사용 완료</span>
                  </div>
                  {claimedDateStr && (
                    <span className="mt-2 px-2.5 py-1 bg-slate-950 text-rose-300 text-xs font-mono rounded font-bold">
                      {claimedDateStr} 지급완료
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Status Information Box */}
            <div
              className={`p-3.5 rounded-2xl border text-left text-xs mb-4 ${
                participant?.snackClaimed
                  ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                  : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}
            >
              {participant?.snackClaimed ? (
                <div>
                  <p className="font-bold text-rose-300 mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    <span>이미 사용된 간식 교환권입니다</span>
                  </p>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    수령 일시: <strong className="text-white">{claimedDateStr}</strong>
                    <br />
                    1회용 교환권으로 재수령 및 줄서기는 제한됩니다.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-amber-300 mb-1">스태프 확인 안내</p>
                  <p className="text-[11px] leading-relaxed text-slate-400">
                    부스 스태프에게 이 QR 코드를 보여주세요. 스태프가 동아리 폰으로 스캔하면 사용 완료 처리됩니다.
                  </p>
                </div>
              )}
            </div>

            {/* Staff claim manual fallback */}
            <div className="pt-2 border-t border-slate-800">
              {participant?.snackClaimed ? (
                <div className="text-center py-1">
                  <div className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center gap-2 text-rose-400 text-xs font-bold">
                    <Lock className="w-4 h-4" />
                    <span>간식 지급 완료됨 (되돌리기 불가)</span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                    * 중복 수령 방지를 위해 개인 기기에서는 지급 전 상태로 되돌릴 수 없습니다.
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-[10px] text-slate-400 mb-2">
                    운영진 비상용 수동 버튼 (스태프가 직접 지급 완료 처리)
                  </p>
                  <button
                    onClick={handleManualClaim}
                    disabled={isClaiming}
                    className="w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition-all active:scale-95 disabled:opacity-50"
                    id="btn-staff-claim-manual-modal"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isClaiming ? '지급 처리 중...' : '스태프 수동 확인 (간식 지급 완료)'}</span>
                  </button>
                </div>
              )}
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
