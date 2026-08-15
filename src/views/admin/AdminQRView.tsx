import React, { useState } from 'react';
import QRCode from 'qrcode';
import {
  QrCode,
  Download,
  Printer,
  RefreshCw,
  AlertTriangle,
  Sparkles,
  Check,
  Eye,
} from 'lucide-react';
import { Booth } from '../../types';
import { regenerateBoothToken } from '../../services/firebaseService';

interface AdminQRViewProps {
  booths: Booth[];
  onOpenQRModal: (booth: Booth) => void;
}

export const AdminQRView: React.FC<AdminQRViewProps> = ({
  booths,
  onOpenQRModal,
}) => {
  const [regenTargetBooth, setRegenTargetBooth] = useState<Booth | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCopy = (token: string) => {
    navigator.clipboard.writeText(token);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const handleConfirmRegen = async () => {
    if (!regenTargetBooth) return;
    setIsRegenerating(true);
    try {
      await regenerateBoothToken(regenTargetBooth.id);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRegenerating(false);
      setRegenTargetBooth(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-cyan-400" />
            <span>부스별 QR 코드 관리 및 인쇄</span>
          </h2>
          <p className="text-xs text-slate-400">
            축제 현장에 배치할 부스별 인증 QR 코드를 고화질로 다운로드하거나 A4 규격 스탠드로 인쇄할 수 있습니다.
          </p>
        </div>

        {booths.length > 0 && (
          <button
            onClick={() => onOpenQRModal(booths[0])}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
            id="btn-admin-batch-print-qr"
          >
            <Printer className="w-4 h-4" />
            <span>전체 부스 스탠드 A4 일괄 인쇄 ({booths.length}장)</span>
          </button>
        )}
      </div>

      {/* Grid of Booth QR Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {booths.map((booth) => (
          <div
            key={booth.id}
            className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col justify-between"
            id={`admin-qr-card-${booth.id}`}
          >
            {/* Card Header */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center text-xl">
                    {booth.icon || '🤖'}
                  </div>
                  <div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                      BOOTH {String(booth.order || 1).padStart(2, '0')}
                    </span>
                    <h3 className="text-base font-bold text-slate-100 mt-0.5">{booth.name}</h3>
                  </div>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    booth.active
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/80'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-800/80'
                  }`}
                >
                  {booth.active ? '활성' : '비활성'}
                </span>
              </div>

              {/* Token Display */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 block">인증 토큰 코드</span>
                  <span className="font-mono text-xs font-bold text-cyan-400">{booth.qrToken}</span>
                </div>
                <button
                  onClick={() => handleCopy(booth.qrToken)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 text-[11px] font-medium flex items-center gap-1 transition-colors"
                >
                  {copiedToken === booth.qrToken ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">복사됨</span>
                    </>
                  ) : (
                    <span>코드 복사</span>
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800/80">
              <button
                onClick={() => onOpenQRModal(booth)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-transform active:scale-95"
                id={`btn-view-qr-stand-${booth.id}`}
              >
                <Printer className="w-3.5 h-3.5" />
                <span>스탠드 인쇄 / 다운로드</span>
              </button>

              <button
                onClick={() => setRegenTargetBooth(booth)}
                className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-amber-300 hover:text-amber-200 text-xs font-medium flex items-center gap-1 border border-slate-700 transition-colors"
                title="QR 코드 재생성"
                id={`btn-regen-qr-${booth.id}`}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>재생성</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Regeneration Warning Confirmation Modal */}
      {regenTargetBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div
            className="w-full max-w-sm bg-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-2xl text-center"
            id="modal-regen-confirm"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="text-base font-bold text-white mb-2">QR 코드 재생성 확인</h3>

            <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-800/40 text-amber-200 text-xs mb-4 text-left">
              <p className="font-bold mb-1">⚠️ 주의사항</p>
              <p className="text-[11px] leading-relaxed">
                기존 QR 코드는 더 이상 사용할 수 없습니다.
                <br />
                정말 <strong>'{regenTargetBooth.name}'</strong>의 인증 코드를 재생성하시겠습니까?
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleConfirmRegen}
                disabled={isRegenerating}
                className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5"
                id="btn-confirm-regen"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                <span>{isRegenerating ? '재생성 중...' : '예, 재생성합니다'}</span>
              </button>
              <button
                onClick={() => setRegenTargetBooth(null)}
                disabled={isRegenerating}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
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
