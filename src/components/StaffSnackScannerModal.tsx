import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Gift,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Keyboard,
  ShieldCheck,
  Lock,
  Camera,
} from 'lucide-react';
import { redeemSnackQR } from '../services/firebaseService';
import { soundService } from '../services/soundService';
import { requestCameraAccess } from '../services/cameraService';
import { SnackRedeemResult } from '../types';
import confetti from 'canvas-confetti';

interface StaffSnackScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StaffSnackScannerModal: React.FC<StaffSnackScannerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [redeemResult, setRedeemResult] = useState<SnackRedeemResult | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#10b981', '#06b6d4', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  const startScanner = async () => {
    setPermissionError(null);
    setRedeemResult(null);

    setTimeout(async () => {
      const element = document.getElementById('staff-snack-reader-box');
      if (!element) return;

      try {
        if (scannerRef.current && isScanningRef.current) {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }

        const html5QrCode = new Html5Qrcode('staff-snack-reader-box', {
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
          verbose: false,
        });
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: cameraFacing },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        );

        isScanningRef.current = true;
        setScannerActive(true);
      } catch (err: unknown) {
        console.warn('Staff camera start error:', err);
        const errMsg = err instanceof Error ? err.message : String(err);
        if (errMsg.includes('NotAllowedError') || errMsg.includes('Permission denied')) {
          setPermissionError('카메라 권한이 거부되었습니다. 브라우저 설정에서 카메라 권한을 허용해주세요.');
        } else {
          setPermissionError('카메라 접근 권한이 필요합니다.');
        }
        setScannerActive(false);
      }
    }, 150);
  };

  const handleReRequestPermission = async () => {
    setIsRequestingPermission(true);
    const result = await requestCameraAccess();
    setIsRequestingPermission(false);

    if (result.success) {
      setPermissionError(null);
      startScanner();
    } else {
      setPermissionError(result.errorMessage || '카메라 권한이 허용되지 않았습니다.');
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
      isScanningRef.current = false;
    }
    setScannerActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
      setRedeemResult(null);
      setPermissionError(null);
      setShowManualInput(false);
    }

    return () => {
      stopScanner();
    };
  }, [isOpen, cameraFacing]);

  const handleScanSuccess = async (decodedText: string) => {
    const now = Date.now();
    if (now - lastScannedTimeRef.current < 2000 || isProcessing) return;
    lastScannedTimeRef.current = now;
    setIsProcessing(true);

    try {
      const res = await redeemSnackQR(decodedText);
      setRedeemResult(res);

      if (res.success) {
        soundService.playSuccess();
        fireConfetti();
      } else if (res.alreadyClaimed) {
        soundService.playError();
      } else {
        soundService.playError();
      }
    } catch (err) {
      console.error('Staff redeem error:', err);
      soundService.playError();
      setRedeemResult({
        success: false,
        message: '서버 통신 오류가 발생했습니다. 다시 시도해주세요.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim() || isProcessing) return;

    setIsProcessing(true);
    try {
      const res = await redeemSnackQR(manualInput.trim());
      setRedeemResult(res);

      if (res.success) {
        soundService.playSuccess();
        fireConfetti();
        setManualInput('');
      } else {
        soundService.playError();
      }
    } catch {
      soundService.playError();
      setRedeemResult({
        success: false,
        message: '오류가 발생했습니다.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-amber-500/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="modal-staff-snack-scanner"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-black text-white">스태프 간식 QR 검증기</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-950 border border-amber-800 text-amber-300 font-bold">
                  동아리용
                </span>
              </div>
              <p className="text-[11px] text-slate-400">방문객의 간식 교환권 QR 코드를 비춰주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            id="btn-close-staff-scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center justify-center">
          {redeemResult ? (
            <div className="w-full py-4 px-2 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              {redeemResult.success && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-4 shadow-xl shadow-emerald-500/30 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mb-2">
                    간식 교환 승인 완료
                  </span>
                  <h3 className="text-2xl font-black text-white mb-1">🎁 간식 지급 완료!</h3>
                  <p className="text-xs font-mono text-cyan-300 mb-4">
                    참가자 ID: {redeemResult.participant?.id}
                  </p>

                  <div className="w-full p-4 rounded-2xl bg-emerald-950/40 border border-emerald-800/60 text-left text-xs text-emerald-200 mb-4 space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-400">체험 완료 시간:</span>
                      <span className="font-mono text-slate-200">
                        {redeemResult.participant?.completedAt
                          ? new Date(redeemResult.participant.completedAt).toLocaleTimeString('ko-KR')
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">간식 처리 시각:</span>
                      <span className="font-mono text-emerald-300 font-bold">
                        {redeemResult.participant?.snackClaimedAt
                          ? new Date(redeemResult.participant.snackClaimedAt).toLocaleTimeString('ko-KR')
                          : '방금'}
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-400/80 pt-1 border-t border-emerald-800/40">
                      ✓ 해당 교환권은 사용 완료 처리되어 중복 수령이 자동 차단됩니다.
                    </p>
                  </div>
                </>
              )}

              {redeemResult.alreadyClaimed && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-4 shadow-xl shadow-rose-500/30">
                    <Lock className="w-12 h-12" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 mb-2">
                    중복 수령 차단 (재사용 불가)
                  </span>
                  <h3 className="text-xl font-black text-rose-200 mb-1">
                    ⚠️ 이미 수령 완료된 교환권
                  </h3>
                  <p className="text-xs font-mono text-slate-400 mb-3">
                    참가자 ID: {redeemResult.participant?.id}
                  </p>

                  <div className="w-full p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-left text-xs text-rose-200 mb-4 space-y-1.5">
                    <p className="font-bold text-rose-300 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>{redeemResult.message}</span>
                    </p>
                    <p className="text-[11px] text-slate-300">
                      기존 수령 일시:{' '}
                      <strong className="text-white font-mono">
                        {redeemResult.claimedAtStr ||
                          (redeemResult.claimedAt
                            ? new Date(redeemResult.claimedAt).toLocaleTimeString('ko-KR')
                            : '이전')}
                      </strong>
                    </p>
                  </div>
                </>
              )}

              {redeemResult.isIncomplete && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 mb-4">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-amber-200 mb-2">
                    부스 미션 미완료
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">{redeemResult.message}</p>
                </>
              )}

              {!redeemResult.success && !redeemResult.alreadyClaimed && !redeemResult.isIncomplete && (
                <>
                  <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-4">
                    <AlertTriangle className="w-12 h-12" />
                  </div>
                  <h3 className="text-xl font-bold text-rose-200 mb-2">인식 실패</h3>
                  <p className="text-xs text-slate-300 mb-4">{redeemResult.message}</p>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => {
                    setRedeemResult(null);
                    startScanner();
                  }}
                  className="flex-1 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 transition-colors shadow-lg shadow-amber-500/25"
                  id="btn-staff-scan-next"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>다음 참가자 스캔</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors"
                  id="btn-staff-close-result"
                >
                  닫기
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center">
              {permissionError ? (
                <div className="p-4 rounded-2xl bg-slate-800/90 border border-slate-700 text-center w-full my-4 max-w-[320px]">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <h4 className="text-xs font-bold text-slate-100 mb-1">카메라 권한 필요</h4>
                  <p className="text-xs font-semibold text-slate-200 mb-3">{permissionError}</p>
                  <button
                    onClick={handleReRequestPermission}
                    disabled={isRequestingPermission}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRequestingPermission ? 'animate-spin' : ''}`} />
                    <span>카메라 권한 다시 수락</span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border-2 border-amber-500/50 bg-black shadow-inner flex items-center justify-center">
                  <div id="staff-snack-reader-box" className="w-full h-full" />
                  
                  {/* Scanner overlay corners & animated beam */}
                  <div className="pointer-events-none absolute inset-0 border-[3px] border-amber-400/30 rounded-2xl">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-amber-400" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-amber-400" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-amber-400" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-amber-400" />
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_12px_#f59e0b]" />
                  </div>
                </div>
              )}

              {/* Camera Switch / Helper Controls */}
              {!permissionError && (
                <div className="flex items-center justify-between w-full max-w-[280px] mt-3">
                  <button
                    onClick={() => setCameraFacing((p) => (p === 'environment' ? 'user' : 'environment'))}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800/60"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>카메라 전환</span>
                  </button>

                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 px-2 py-1 rounded-lg bg-amber-950/40 border border-amber-800/40"
                  >
                    <Keyboard className="w-3 h-3" />
                    <span>수동 ID 입력</span>
                  </button>
                </div>
              )}

              {/* Manual Input Fallback */}
              {showManualInput && (
                <div className="w-full mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 animate-in slide-in-from-top-2 duration-150">
                  <p className="text-[11px] text-slate-300 font-semibold mb-2">
                    참가자 ID 수동 입력 (예: participant_A82F91)
                  </p>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={manualInput}
                      onChange={(e) => setManualInput(e.target.value)}
                      placeholder="participant_..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
                      id="input-staff-manual-id"
                    />
                    <button
                      type="submit"
                      disabled={!manualInput.trim() || isProcessing}
                      className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
                      id="btn-staff-submit-manual-id"
                    >
                      지급확인
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>K.F.C. 축제 본부 스낵 교환처</span>
          <span className="text-amber-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>중복 수령 방지 시스템 가동중</span>
          </span>
        </div>
      </div>
    </div>
  );
};
