import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { X, Printer, Download, Bot, Sparkles, Check } from 'lucide-react';
import { Booth } from '../types';

interface PrintableQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  booth: Booth | null;
  allBooths?: Booth[];
}

export const PrintableQRModal: React.FC<PrintableQRModalProps> = ({
  isOpen,
  onClose,
  booth,
  allBooths,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [qrSvg, setQrSvg] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (booth && isOpen) {
      // Generate High-Res QR code PNG (1024x1024 for crisp printing)
      QRCode.toDataURL(
        booth.qrToken,
        {
          width: 800,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) setQrDataUrl(url);
        }
      );

      // Generate SVG string
      QRCode.toString(
        booth.qrToken,
        {
          type: 'svg',
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, string) => {
          if (!err && string) setQrSvg(string);
        }
      );
    }
  }, [booth, isOpen]);

  const handleDownloadPNG = () => {
    if (!qrDataUrl || !booth) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `KFC_Booth_${booth.order}_${booth.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_QR.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    if (!qrSvg || !booth) return;
    const blob = new Blob([qrSvg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KFC_Booth_${booth.order}_${booth.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_QR.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToken = () => {
    if (!booth) return;
    navigator.clipboard.writeText(booth.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen || !booth) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md">
      <div
        className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
        id="modal-printable-qr"
      >
        {/* Modal Top Bar */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 print:hidden">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-slate-100 text-sm">현장 부스 QR 스탠드 인쇄 / 다운로드</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
            id="btn-close-qr-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Stand Preview */}
        <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950/50">
          <div
            id="printable-stand-card"
            className="w-full max-w-[340px] bg-white text-slate-900 rounded-2xl p-6 shadow-xl border-4 border-cyan-500 text-center flex flex-col items-center print:border-black print:shadow-none"
          >
            {/* Festival Stand Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-cyan-600 text-white font-black text-xs">
                K.F.C.
              </span>
              <span className="text-[11px] font-bold text-slate-600">
                용인시청소년수련관 로봇동아리
              </span>
            </div>

            <h2 className="text-xl font-black text-slate-900 mt-1 mb-0.5">
              {booth.name}
            </h2>
            <p className="text-xs text-slate-600 font-medium mb-3">
              {booth.description}
            </p>

            {/* QR Code Frame */}
            <div className="w-56 h-56 bg-slate-50 p-2.5 rounded-xl border-2 border-slate-900 flex items-center justify-center mb-3">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${booth.name}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                  생성 중...
                </div>
              )}
            </div>

            {/* Token Badge */}
            <div className="bg-slate-100 border border-slate-300 rounded-lg px-3 py-1.5 mb-3 w-full flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500 text-[10px]">인증 코드:</span>
              <strong className="text-slate-900 font-bold">{booth.qrToken}</strong>
            </div>

            {/* Instructions */}
            <div className="w-full bg-cyan-50 border border-cyan-200 rounded-xl p-2.5 text-left text-[11px] text-slate-700">
              <div className="font-bold text-cyan-900 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-600" />
                <span>체험 인증 방법</span>
              </div>
              <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                <li>부스 미션을 재미있게 체험합니다.</li>
                <li>체험 완료 후 스마트폰 카메라로 QR을 스캔합니다.</li>
                <li>스탬프를 모두 모아 맛있는 간식을 받으세요!</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <button
            onClick={handleCopyToken}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5"
            id="btn-copy-token"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
            <span>{copied ? '복사됨' : '토큰 복사'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadSVG}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
              id="btn-download-svg"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SVG</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
              id="btn-download-png"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG (고화질)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/25"
              id="btn-print-qr"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>스탠드 인쇄</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
