import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  Info,
  RefreshCw,
  Sparkles,
  Keyboard,
  ArrowRight,
  WifiOff,
  Gift,
  Lock,
} from 'lucide-react';
import { verifyAndCompleteBooth, redeemSnackQR } from '../services/firebaseService';
import { soundService } from '../services/soundService';
import { ScanResult, Booth, SnackRedeemResult } from '../types';
import confetti from 'canvas-confetti';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  onSuccess: (result: ScanResult) => void;
  onNavigateToComplete?: () => void;
  availableBooths?: Booth[];
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  participantId,
  onSuccess,
  onNavigateToComplete,
  availableBooths = [],
}) => {
  const [scannerActive, setScannerActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [snackResult, setSnackResult] = useState<SnackRedeemResult | null>(null);
  const [manualCode, setManualCode] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);

  const fireConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // ignore
    }
  };

  const startScanner = async () => {
    setPermissionError(null);
    setScanResult(null);
    setSnackResult(null);

    setTimeout(async () => {
      const element = document.getElementById('qr-reader-box');
      if (!element) return;

      try {
        if (scannerRef.current && isScanningRef.current) {
          await scannerRef.current.stop();
          isScanningRef.current = false;
        }

        const html5QrCode = new Html5Qrcode('qr-reader-box', {
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
        console.warn('Camera start error:', err);
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
      setScanResult(null);
      setSnackResult(null);
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

    // Case 1: Snack Voucher QR scanned (e.g. KFC-SNACK:participant_...)
    if (decodedText.startsWith('KFC-SNACK:')) {
      try {
        const res = await redeemSnackQR(decodedText);
        setSnackResult(res);
        if (res.success) {
          soundService.playSuccess();
          fireConfetti();
        } else {
          soundService.playError();
        }
      } catch {
        soundService.playError();
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // Case 2: Standard Booth QR scanned
    try {
      const result = await verifyAndCompleteBooth(participantId, decodedText);
      setScanResult(result);

      if (result.status === 'success') {
        if (result.allCompleted) {
          soundService.playFanfare();
          fireConfetti();
        } else {
          soundService.playSuccess();
          fireConfetti();
        }
        onSuccess(result);
      } else if (result.status === 'already_completed') {
        soundService.playInfo();
      } else {
        soundService.playError();
      }
    } catch (err) {
      console.error('Scan verification error:', err);
      soundService.playError();
      setScanResult({
        status: 'error',
        message: '인터넷 연결을 확인한 후 다시 시도해주세요.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!manualCode.trim() || isProcessing) return;

    if (manualCode.trim().startsWith('KFC-SNACK:')) {
      return handleScanSuccess(manualCode.trim());
    }

    setIsProcessing(true);
    try {
      const result = await verifyAndCompleteBooth(participantId, manualCode.trim());
      setScanResult(result);

      if (result.status === 'success') {
        if (result.allCompleted) {
          soundService.playFanfare();
          fireConfetti();
        } else {
          soundService.playSuccess();
          fireConfetti();
        }
        onSuccess(result);
        setManualCode('');
      } else if (result.status === 'already_completed') {
        soundService.playInfo();
      } else {
        soundService.playError();
      }
    } catch {
      soundService.playError();
      setScanResult({
        status: 'error',
        message: '인터넷 연결을 확인한 후 다시 시도해주세요.',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        id="modal-qr-scanner"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">QR 코드 스캔</h2>
              <p className="text-[11px] text-slate-400">체험 부스 또는 간식 교환권 QR 코드를 비춰주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
            id="btn-close-scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col items-center justify-center">
          {/* Snack Redeem Result */}
          {snackResult ? (
            <div className="w-full py-4 px-2 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              {snackResult.success ? (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-500/25 animate-bounce">
                    <Gift className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 mb-2">
                    간식 교환 완료
                  </span>
                  <h3 className="text-xl font-black text-slate-100 mb-1">🎁 간식 지급 처리 완료!</h3>
                  <p className="text-xs text-slate-300 mb-4">{snackResult.message}</p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 mb-3">
                    <Lock className="w-8 h-8" />
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-950 text-rose-300 border border-rose-800 mb-2">
                    {snackResult.alreadyClaimed ? '중복 수령 불가' : '수령 불가'}
                  </span>
                  <h3 className="text-xl font-black text-rose-200 mb-1">
                    {snackResult.alreadyClaimed ? '⚠️ 이미 사용된 교환권입니다' : '확인 실패'}
                  </h3>
                  <p className="text-xs text-slate-300 mb-4">{snackResult.message}</p>
                </>
              )}

              <div className="flex gap-2 w-full mt-3">
                <button
                  onClick={() => {
                    setSnackResult(null);
                    startScanner();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 스캔하기</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  확인
                </button>
              </div>
            </div>
          ) : scanResult ? (
            /* Booth Result */
            <div className="w-full py-4 px-2 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              {scanResult.status === 'success' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-4 shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 mb-2">
                    인증 성공
                  </span>
                  <h3 className="text-xl font-black text-slate-100 mb-1">🎉 체험 완료!</h3>
                  <p className="text-sm text-slate-300 font-medium mb-3">
                    <strong className="text-cyan-400">{scanResult.booth?.name}</strong> 체험을 완료했습니다.
                  </p>

                  {scanResult.allCompleted ? (
                    <div className="w-full mt-2 p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-yellow-500/20 border border-amber-500/40 text-center">
                      <div className="flex items-center justify-center gap-1.5 text-amber-400 font-bold text-sm mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>모든 퀘스트 완료 달성!</span>
                      </div>
                      <p className="text-xs text-slate-300 mb-3">
                        모든 부스 체험을 완료했습니다! 간식을 받으러 가볼까요?
                      </p>
                      <button
                        onClick={() => {
                          onClose();
                          if (onNavigateToComplete) onNavigateToComplete();
                        }}
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2"
                        id="btn-goto-complete-modal"
                      >
                        <span>간식 받으러 가기</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 mt-1">
                      다음 부스로 이동하여 계속해서 스탬프를 모아보세요!
                    </p>
                  )}
                </>
              )}

              {scanResult.status === 'already_completed' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border-2 border-cyan-500/40 flex items-center justify-center text-cyan-400 mb-3">
                    <Info className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">✓ 이미 완료한 체험입니다</h3>
                  <p className="text-xs text-slate-300 mb-4">{scanResult.message}</p>
                </>
              )}

              {scanResult.status === 'invalid' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 mb-3">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">⚠️ 유효하지 않은 QR 코드입니다</h3>
                  <p className="text-xs text-slate-300 mb-4">
                    K.F.C. 축제 부스에 설치된 공식 QR 코드를 스캔해주세요.
                  </p>
                </>
              )}

              {scanResult.status === 'inactive' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 mb-3">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">부스 일시 중단 안내</h3>
                  <p className="text-xs text-slate-300 mb-4">{scanResult.message}</p>
                </>
              )}

              {scanResult.status === 'error' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 flex items-center justify-center text-rose-400 mb-3">
                    <WifiOff className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-100 mb-1">네트워크 오류</h3>
                  <p className="text-xs text-slate-300 mb-4">{scanResult.message}</p>
                </>
              )}

              <div className="flex gap-2 w-full mt-3">
                <button
                  onClick={() => {
                    setScanResult(null);
                    startScanner();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  id="btn-scan-again"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>다시 스캔하기</span>
                </button>
                <button
                  onClick={onClose}
                  className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                  id="btn-close-result"
                >
                  확인
                </button>
              </div>
            </div>
          ) : (
            /* Camera Live View */
            <div className="w-full flex flex-col items-center">
              {permissionError ? (
                <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-center w-full my-4">
                  <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-200 mb-2">{permissionError}</p>
                  <p className="text-[11px] text-slate-400 mb-4">
                    브라우저 주소창 왼쪽의 카메라 아이콘을 눌러 권한을 허용해주세요.
                  </p>
                  <button
                    onClick={startScanner}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>권한 다시 요청</span>
                  </button>
                </div>
              ) : (
                <div className="relative w-full aspect-square max-w-[280px] rounded-2xl overflow-hidden border-2 border-cyan-500/40 bg-black shadow-inner flex items-center justify-center">
                  <div id="qr-reader-box" className="w-full h-full" />
                  
                  {/* Scanner overlay corners & animated beam */}
                  <div className="pointer-events-none absolute inset-0 border-[3px] border-cyan-400/30 rounded-2xl">
                    <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-cyan-400" />
                    <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-cyan-400" />
                    <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-cyan-400" />
                    <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-cyan-400" />
                    <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent top-1/2 -translate-y-1/2 animate-pulse shadow-[0_0_12px_#22d3ee]" />
                  </div>
                </div>
              )}

              {/* Camera Switch / Helper Controls */}
              {!permissionError && (
                <div className="flex items-center justify-between w-full max-w-[280px] mt-3">
                  <button
                    onClick={toggleCameraFacing}
                    className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg bg-slate-800/60"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>카메라 전환 ({cameraFacing === 'environment' ? '후면' : '전면'})</span>
                  </button>

                  <button
                    onClick={() => setShowManualInput(!showManualInput)}
                    className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded-lg bg-cyan-950/40 border border-cyan-800/40"
                  >
                    <Keyboard className="w-3 h-3" />
                    <span>코드 직접 입력</span>
                  </button>
                </div>
              )}

              {/* Manual Input Fallback */}
              {showManualInput && (
                <div className="w-full mt-4 p-3 rounded-2xl bg-slate-800/80 border border-slate-700 animate-in slide-in-from-top-2 duration-150">
                  <p className="text-[11px] text-slate-300 font-semibold mb-2">
                    인증 코드 직접 입력
                  </p>
                  <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                      placeholder="예: KFC-ROBOT-A7F29 또는 KFC-SNACK:..."
                      className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 uppercase font-mono"
                      id="input-manual-token"
                    />
                    <button
                      type="submit"
                      disabled={!manualCode.trim() || isProcessing}
                      className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold text-xs transition-colors"
                      id="btn-submit-manual-token"
                    >
                      확인
                    </button>
                  </form>

                  {/* Quick test buttons for active booths */}
                  {availableBooths.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-700/60">
                      <p className="text-[10px] text-slate-400 mb-1.5">테스트용 빠른 입력:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {availableBooths.map((b) => (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() => {
                              setManualCode(b.qrToken);
                            }}
                            className="px-2 py-1 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-[10px] text-slate-300 transition-colors"
                          >
                            {b.name.split(' ')[0]} {b.qrToken}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-between text-[11px] text-slate-400">
          <span>K.F.C. 축제 부스 체험 인증</span>
          <span className="font-mono text-slate-500">ID: {participantId.replace('participant_', '')}</span>
        </div>
      </div>
    </div>
  );
};
