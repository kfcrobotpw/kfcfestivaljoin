import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Printer,
  Download,
  Sparkles,
  Check,
  MapPin,
  Smartphone,
  Layers,
  FileText,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import { Booth } from '../types';
import {
  downloadStandPosterPNG,
  openStandPrintWindow,
  downloadStandHTMLFile,
} from '../services/standExportService';

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
  allBooths = [],
}) => {
  const [printAll, setPrintAll] = useState(false);
  const [qrCodeMap, setQrCodeMap] = useState<Record<string, string>>({});
  const [qrSvgMap, setQrSvgMap] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [isDownloadingPoster, setIsDownloadingPoster] = useState(false);

  // Generate QR codes for all booths
  useEffect(() => {
    if (!isOpen) return;

    const boothsToGenerate = allBooths.length > 0 ? allBooths : booth ? [booth] : [];

    boothsToGenerate.forEach((b) => {
      // 1. High-Res PNG (1024x1024)
      QRCode.toDataURL(
        b.qrToken,
        {
          width: 1024,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'H',
        },
        (err, url) => {
          if (!err && url) {
            setQrCodeMap((prev) => ({ ...prev, [b.id]: url }));
          }
        }
      );

      // 2. High-Res Vector SVG
      QRCode.toString(
        b.qrToken,
        {
          type: 'svg',
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (err, string) => {
          if (!err && string) {
            setQrSvgMap((prev) => ({ ...prev, [b.id]: string }));
          }
        }
      );
    });
  }, [isOpen, booth, allBooths]);

  // Download whole A4 stand poster card image
  const handleDownloadStandPoster = async () => {
    if (!booth) return;
    const qrUrl = qrCodeMap[booth.id];
    if (!qrUrl) return;
    setIsDownloadingPoster(true);
    try {
      await downloadStandPosterPNG(booth, qrUrl);
    } catch (e) {
      console.error('Poster generation failed:', e);
    } finally {
      setIsDownloadingPoster(false);
    }
  };

  const handleDownloadPNG = () => {
    if (!booth) return;
    const url = qrCodeMap[booth.id];
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `KFC_Booth_${booth.order}_${booth.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_QR코드.png`;
    a.click();
  };

  const handleDownloadSVG = () => {
    if (!booth) return;
    const svg = qrSvgMap[booth.id];
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `KFC_Booth_${booth.order}_${booth.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_QR코드.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadHTML = () => {
    if (!booth) return;
    const targets = printAll && allBooths.length > 0 ? allBooths : [booth];
    downloadStandHTMLFile(
      targets,
      qrCodeMap,
      `KFC_부스_${printAll ? '전체' : booth.order}`
    );
  };

  const handleCopyToken = () => {
    if (!booth) return;
    navigator.clipboard.writeText(booth.qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = (all = false) => {
    setPrintAll(all);
    const targetBooths = all && allBooths.length > 0 ? allBooths : (booth ? [booth] : []);
    openStandPrintWindow(targetBooths, qrCodeMap);
  };

  if (!isOpen || !booth) return null;

  const targetBooths = printAll && allBooths.length > 0 ? allBooths : [booth];

  return (
    <>
      {/* 1. Modal Dialog for Screen View */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md print:hidden">
        <div
          className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
          id="modal-printable-qr"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold">
                A4
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-sm">
                  부스 QR 스탠드 A4 인쇄 및 다운로드
                </h3>
                <p className="text-[11px] text-slate-400">
                  A4 용지 규격에 딱 맞춰 선명하게 출력할 수 있는 현장 비치용 스탠드 포스터입니다.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200"
              id="btn-close-qr-modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Print Mode Selection Banner */}
          <div className="px-5 py-2.5 bg-slate-800/60 border-b border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5 text-cyan-400" />
              <span>출력 대상:</span>
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPrintAll(false)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                  !printAll
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                현재 부스 1개만
              </button>
              {allBooths.length > 1 && (
                <button
                  onClick={() => setPrintAll(true)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 ${
                    printAll
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  <span>전체 부스 일괄 ({allBooths.length}장)</span>
                </button>
              )}
            </div>
          </div>

          {/* Preview Area (Scaled Down A4 Canvas) */}
          <div className="p-6 overflow-y-auto flex-1 flex flex-col items-center bg-slate-950/70">
            <p className="text-[11px] text-slate-400 mb-3 flex items-center gap-1">
              <FileText className="w-3 h-3 text-cyan-400" />
              <span>A4 세로 인쇄 미리보기 (실제 출력/저장 시 여백 없이 꽉 찬 고화질로 출력됩니다)</span>
            </p>

            {/* Stand Preview Container (Single Booth Preview) */}
            <div className="w-full max-w-[370px] bg-white text-slate-900 rounded-2xl p-5 shadow-2xl border-4 border-cyan-500 flex flex-col items-center text-center">
              {/* Stand Header */}
              <div className="w-full border-b-2 border-slate-900/10 pb-3 mb-3">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-cyan-600 text-white font-black text-[11px] mb-1">
                  <span>K.F.C. FESTIVAL</span>
                </div>
                <div className="text-[11px] font-bold text-slate-500 tracking-tight">
                  용인시청소년수련관 로봇동아리
                </div>
                <div className="text-xs font-black text-cyan-900 mt-0.5">
                  ✨ 로봇 체험 & 스탬프 투어 ✨
                </div>
              </div>

              {/* Booth Main Title */}
              <div className="mb-3">
                <span className="inline-block text-[11px] font-black px-2 py-0.5 rounded bg-slate-900 text-cyan-300 mb-1">
                  BOOTH {String(booth.order || 1).padStart(2, '0')}
                </span>
                <h2 className="text-2xl font-black text-slate-900 leading-tight">
                  {booth.name}
                </h2>
                <p className="text-xs text-slate-600 font-medium mt-1 leading-snug">
                  {booth.description}
                </p>
                {booth.location && (
                  <p className="text-[11px] text-cyan-800 font-bold mt-1 inline-flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded">
                    <MapPin className="w-3 h-3" />
                    <span>{booth.location}</span>
                  </p>
                )}
              </div>

              {/* QR Code Big Frame */}
              <div className="relative w-48 h-48 bg-white p-2 rounded-2xl border-[3px] border-slate-900 shadow-md flex items-center justify-center mb-3">
                {qrCodeMap[booth.id] ? (
                  <img
                    src={qrCodeMap[booth.id]}
                    alt={`QR for ${booth.name}`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-slate-400">QR 생성 중...</div>
                )}
              </div>

              {/* Scan Callout */}
              <div className="flex items-center justify-center gap-1 text-xs font-black text-cyan-700 mb-2">
                <Smartphone className="w-4 h-4" />
                <span>스마트폰 카메라로 QR 코드를 스캔하세요</span>
              </div>

              {/* Auth Token Badge */}
              <div className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3 py-1.5 mb-3 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-500 text-[10px]">인증 코드</span>
                <strong className="text-slate-900 font-black tracking-wider text-sm">
                  {booth.qrToken}
                </strong>
              </div>

              {/* 3-Step Guide */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-left">
                <div className="text-[11px] font-black text-slate-900 mb-1.5 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-600" />
                  <span>체험 스탬프 획득 안내</span>
                </div>
                <div className="space-y-1 text-[10px] text-slate-600">
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                      1
                    </span>
                    <span>부스에서 로봇 미션을 재미있게 체험합니다.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-cyan-600 text-white font-bold flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                      2
                    </span>
                    <span>체험 완료 후 위 QR 코드를 카메라로 비춰 스탬프를 받습니다.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black flex items-center justify-center text-[9px] shrink-0 mt-0.5">
                      3
                    </span>
                    <span>모든 부스를 완료하고 운영 본부에서 간식을 수령하세요!</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-5 py-4 border-t border-slate-800 bg-slate-900/95 flex flex-col gap-3">
            {/* Top row: Direct Print Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Printer className="w-4 h-4 text-cyan-400" />
                <span>출력 / 저장 선택:</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrint(false)}
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-transform"
                  id="btn-print-single-stand"
                >
                  <Printer className="w-4 h-4" />
                  <span>A4 스탠드 인쇄 (현재 부스)</span>
                </button>

                {allBooths.length > 1 && (
                  <button
                    onClick={() => handlePrint(true)}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/25 active:scale-95 transition-transform"
                    id="btn-print-all-stands"
                  >
                    <Layers className="w-4 h-4" />
                    <span>전체 부스 일괄 인쇄 ({allBooths.length}장)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Bottom row: File Downloads & Helpers */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleDownloadStandPoster}
                  disabled={isDownloadingPoster}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 text-xs font-bold flex items-center gap-1.5 border border-cyan-500/30 transition-all disabled:opacity-50"
                  id="btn-download-stand-poster-png"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{isDownloadingPoster ? '생성 중...' : '스탠드 포스터 이미지(PNG) 저장'}</span>
                </button>

                <button
                  onClick={handleDownloadHTML}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 border border-slate-700"
                  id="btn-download-html"
                  title="오프라인 인쇄용 HTML 파일 저장"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-400" />
                  <span>HTML 파일 저장</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyToken}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1"
                  id="btn-copy-token"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : null}
                  <span>{copied ? '복사됨' : '토큰 복사'}</span>
                </button>

                <button
                  onClick={handleDownloadPNG}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1"
                  id="btn-download-png"
                  title="QR 코드 사각형만 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR만 (PNG)</span>
                </button>

                <button
                  onClick={handleDownloadSVG}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-medium flex items-center gap-1"
                  id="btn-download-svg"
                  title="QR 코드 벡터 SVG 다운로드"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>QR (SVG)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Pure A4 Print Output Container (Only visible during @media print) */}
      <div id="kfc-printable-root" className="hidden print:block w-full bg-white text-slate-950 font-sans">
        {targetBooths.map((b, idx) => (
          <div
            key={b.id}
            className={`w-full min-h-[270mm] box-border p-6 bg-white flex flex-col justify-between items-center text-center ${
              idx < targetBooths.length - 1 ? 'print-page-break' : ''
            }`}
            style={{
              pageBreakAfter: idx < targetBooths.length - 1 ? 'always' : 'auto',
              breakAfter: idx < targetBooths.length - 1 ? 'page' : 'auto',
            }}
          >
            {/* Outer Decorative A4 Frame */}
            <div className="w-full h-full border-[6px] border-slate-900 rounded-[28px] p-6 flex flex-col justify-between items-center relative box-border bg-white">
              {/* Corner Accents */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-cyan-600 rounded-tl-lg" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-cyan-600 rounded-tr-lg" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-cyan-600 rounded-bl-lg" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-cyan-600 rounded-br-lg" />

              {/* 1. Header Banner */}
              <div className="w-full border-b-[3px] border-slate-900/20 pb-4">
                <div className="flex items-center justify-center gap-2 mb-1.5">
                  <span className="px-4 py-1 rounded-full bg-cyan-600 text-white font-black text-sm tracking-wider">
                    K.F.C. FESTIVAL
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    용인시청소년수련관 로봇동아리
                  </span>
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">
                  2026 K.F.C. 로봇 체험 페스티벌
                </h1>
                <p className="text-base font-extrabold text-cyan-800 mt-1">
                  🤖 로봇 미션 체험하고 스탬프를 모아보세요! 🎁
                </p>
              </div>

              {/* 2. Booth Title & Info */}
              <div className="my-3">
                <div className="inline-block px-4 py-1.5 rounded-xl bg-slate-900 text-cyan-300 font-black text-base tracking-wider mb-1.5">
                  BOOTH {String(b.order || 1).padStart(2, '0')}
                </div>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-1.5">
                  {b.name}
                </h2>
                <p className="text-base font-bold text-slate-700 max-w-xl mx-auto leading-relaxed">
                  {b.description}
                </p>
                ${
                  b.location
                    ? `<div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-lg bg-cyan-50 border border-cyan-200 text-cyan-900 font-bold text-sm mt-1.5">
                        <MapPin className="w-4 h-4 text-cyan-700" />
                        <span>위치: ${b.location}</span>
                      </div>`
                    : ''
                }
              </div>

              {/* 3. QR Code Giant Frame */}
              <div className="flex flex-col items-center my-2">
                <div className="p-4 bg-white rounded-3xl border-[5px] border-slate-900 shadow-xl flex items-center justify-center">
                  {qrCodeMap[b.id] ? (
                    <img
                      src={qrCodeMap[b.id]}
                      alt={`QR for ${b.name}`}
                      className="w-60 h-60 object-contain"
                    />
                  ) : (
                    <div className="w-60 h-60 flex items-center justify-center font-bold text-slate-400">
                      QR CODE
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 text-base font-black text-cyan-900 mt-2.5">
                  <Smartphone className="w-5 h-5 text-cyan-700" />
                  <span>스마트폰 카메라로 QR 코드를 비춰주세요</span>
                </div>
              </div>

              {/* 4. Auth Token Box */}
              <div className="w-full max-w-lg bg-slate-100 border-2 border-slate-300 rounded-2xl px-6 py-2 flex items-center justify-between font-mono">
                <span className="text-xs font-bold text-slate-500">인증 코드 (수동 입력용)</span>
                <span className="text-xl font-black text-slate-950 tracking-widest">
                  {b.qrToken}
                </span>
              </div>

              {/* 5. 3-Step Instruction Guide */}
              <div className="w-full max-w-2xl bg-cyan-50/70 border-2 border-cyan-300 rounded-2xl p-3.5 text-left mt-2.5">
                <div className="text-sm font-black text-cyan-950 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-700" />
                  <span>체험 스탬프 획득 및 간식 수령 방법</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-cyan-200">
                    <div className="flex items-center gap-1 font-black text-slate-900 mb-1">
                      <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                        1
                      </span>
                      <span>부스 미션 체험</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      운영진의 안내를 받아 재미있게 로봇 미션 참여
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-cyan-200">
                    <div className="flex items-center gap-1 font-black text-slate-900 mb-1">
                      <span className="w-5 h-5 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px]">
                        2
                      </span>
                      <span>QR 스캔 스탬프</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      카메라로 위 QR을 비춰 실시간 인증 스탬프 획득
                    </p>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-amber-300">
                    <div className="flex items-center gap-1 font-black text-slate-900 mb-1">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px]">
                        3
                      </span>
                      <span>간식 교환</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-tight">
                      부스 4개 완료 후 운영본부에서 맛있는 간식 수령!
                    </p>
                  </div>
                </div>
              </div>

              {/* 6. Footer Note */}
              <div className="w-full pt-2.5 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
                <span>※ QR 인식이 잘 안될 경우 스캔 화면의 [부스 코드 직접 입력]을 이용하세요.</span>
                <span className="font-bold text-slate-700">K.F.C. 축제 운영본부</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

