import React, { useState } from 'react';
import { Bot, ArrowLeft, Sparkles, CheckCircle2 } from 'lucide-react';
import { QRScannerModal } from '../components/QRScannerModal';
import { Booth, ScanResult } from '../types';

interface ScanViewProps {
  participantId: string;
  booths: Booth[];
  onNavigateHome: () => void;
  onNavigateToComplete: () => void;
}

export const ScanView: React.FC<ScanViewProps> = ({
  participantId,
  booths,
  onNavigateHome,
  onNavigateToComplete,
}) => {
  const [showModal, setShowModal] = useState(true);

  const handleScanSuccess = (result: ScanResult) => {
    if (result.allCompleted) {
      onNavigateToComplete();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] max-w-xl mx-auto px-4 py-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center mb-4">
        <Bot className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-black text-white mb-2">QR 코드 인증</h1>
      <p className="text-xs text-slate-400 mb-6">
        체험 부스에 설치된 QR 코드를 카메라로 스캔해주세요.
      </p>

      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => setShowModal(true)}
          className="w-full py-3.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/25"
          id="btn-open-scanner-page"
        >
          📷 카메라 스캐너 열기
        </button>

        <button
          onClick={onNavigateHome}
          className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs flex items-center justify-center gap-1.5"
          id="btn-scan-back-home"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>체험 메인으로 돌아가기</span>
        </button>
      </div>

      <QRScannerModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          onNavigateHome();
        }}
        participantId={participantId}
        onSuccess={handleScanSuccess}
        onNavigateToComplete={onNavigateToComplete}
        availableBooths={booths.filter((b) => b.active)}
      />
    </div>
  );
};
