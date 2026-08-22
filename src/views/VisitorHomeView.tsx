import React, { useState } from 'react';
import {
  Bot,
  QrCode,
  Sparkles,
  CheckCircle2,
  Clock,
  MapPin,
  HelpCircle,
  Award,
  ChevronRight,
  Gift,
  Zap,
  Camera,
  RefreshCw,
} from 'lucide-react';
import { KFCLogo } from '../components/KFCLogo';
import { Booth, Participant, FestivalSettings } from '../types';

interface VisitorHomeViewProps {
  booths: Booth[];
  participant: Participant | null;
  settings: FestivalSettings;
  onOpenScanner: () => void;
  onNavigateToComplete: () => void;
  onOpenPermissionModal?: () => void;
}

export const VisitorHomeView: React.FC<VisitorHomeViewProps> = ({
  booths,
  participant,
  settings,
  onOpenScanner,
  onNavigateToComplete,
  onOpenPermissionModal,
}) => {
  const [selectedBooth, setSelectedBooth] = useState<Booth | null>(null);

  const activeBooths = booths.filter((b) => b.active);
  const completedIds = participant?.completedBooths || [];
  const completedCount = activeBooths.filter((b) => completedIds.includes(b.id)).length;
  const totalCount = activeBooths.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isAllCompleted = totalCount > 0 && completedCount >= totalCount;

  return (
    <div className="min-h-[calc(100vh-4rem)] pb-24">
      {/* Top Camera Permission Helper Bar */}
      {onOpenPermissionModal && (
        <div className="bg-slate-900/95 border-b border-slate-800 px-4 py-2 text-xs">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Camera className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="truncate">카메라 권한을 놓치셨나요?</span>
            </div>
            <button
              onClick={onOpenPermissionModal}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold shrink-0 transition-colors flex items-center gap-1"
              id="btn-top-camera-permission"
            >
              <RefreshCw className="w-3 h-3" />
              <span>카메라 사용 다시 수락</span>
            </button>
          </div>
        </div>
      )}

      {/* Hero Header Section */}
      <section className="relative overflow-hidden pt-8 pb-6 px-4 text-center">
        {/* Glow ambient background */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-64 bg-cyan-500/15 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute top-20 right-1/4 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

        <div className="relative max-w-xl mx-auto flex flex-col items-center">
          {/* Main Official KFC Logo */}
          <div className="mb-5 relative group">
            <div className="w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-3xl bg-white p-2.5 shadow-2xl shadow-cyan-500/10 border border-slate-200 flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
              <KFCLogo className="w-full h-full" />
            </div>
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-950/70 border border-cyan-800/60 text-cyan-400 text-xs font-semibold mb-3 shadow-inner">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{settings.clubName}</span>
            {participant?.id && (
              <>
                <span className="text-cyan-700">•</span>
                <span className="font-mono text-cyan-300 font-bold">
                  참가자 #{participant.id.replace('participant_', '')}
                </span>
              </>
            )}
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-2 leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-blue-400 bg-clip-text text-transparent">
              {settings.title}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 font-medium max-w-md mx-auto mb-6">
            {settings.subtitle}
          </p>

          {/* Progress Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-sm text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200">체험 미션 진행률</h3>
                  <p className="text-[11px] text-slate-400">모든 스탬프를 모으면 간식 증정!</p>
                </div>
              </div>
              <div className="text-right font-mono">
                <span className="text-xl font-black text-cyan-400">{completedCount}</span>
                <span className="text-xs text-slate-500 font-medium"> / {totalCount}</span>
              </div>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full h-3.5 bg-slate-950 rounded-full p-0.5 border border-slate-800 overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-emerald-400 rounded-full transition-all duration-500 shadow-[0_0_12px_#06b6d4]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px]">
              <span className="text-slate-400 font-medium">
                {isAllCompleted ? '🎉 모든 퀘스트 완료!' : `남은 부스: ${totalCount - completedCount}개`}
              </span>
              <span className="font-mono font-bold text-cyan-300">{progressPercent}% 달성</span>
            </div>

            {/* All Completed Banner if done */}
            {isAllCompleted && (
              <div className="mt-4 p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 border border-amber-500/40 flex items-center justify-between gap-3 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center flex-shrink-0 animate-bounce">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">모든 체험 완료!</p>
                    <p className="text-[11px] text-slate-300">간식 수령권을 확인하세요</p>
                  </div>
                </div>
                <button
                  onClick={onNavigateToComplete}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/30 flex-shrink-0 transition-transform active:scale-95"
                  id="btn-banner-claim-snack"
                >
                  간식 받기
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Scan CTA Floating / Prominent Button */}
      <div className="max-w-xl mx-auto px-4 mb-6 sticky top-20 z-30">
        <button
          onClick={onOpenScanner}
          className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-base shadow-xl shadow-cyan-500/25 flex items-center justify-center gap-3 transition-all transform active:scale-[0.98] border border-cyan-300/40 group"
          id="btn-main-qr-scan"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-950/20 flex items-center justify-center text-slate-950 group-hover:rotate-6 transition-transform">
            <QrCode className="w-5 h-5" />
          </div>
          <span>📷 QR 코드 스캔하고 스탬프 받기</span>
        </button>
      </div>

      {/* Booth Cards Section */}
      <section className="max-w-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200">체험 부스 목록 ({totalCount}개)</h2>
          </div>
          <span className="text-[11px] text-slate-400">카드를 눌러 상세 미션 확인</span>
        </div>

        <div className="space-y-3">
          {activeBooths.map((booth, index) => {
            const isCompleted = completedIds.includes(booth.id);

            return (
              <div
                key={booth.id}
                onClick={() => setSelectedBooth(booth)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group ${
                  isCompleted
                    ? 'bg-slate-900/60 border-emerald-500/40 hover:border-emerald-500/70 shadow-lg shadow-emerald-950/30'
                    : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-850 shadow-md'
                }`}
                id={`card-booth-${booth.id}`}
              >
                {/* Stamp Stamp overlay if completed */}
                {isCompleted && (
                  <div className="absolute top-2 right-3 pointer-events-none opacity-85 rotate-12">
                    <div className="px-2.5 py-0.5 rounded border-2 border-emerald-400 text-emerald-400 font-black text-[10px] tracking-wider uppercase bg-emerald-950/80 shadow-sm">
                      STAMPED ✓
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3.5">
                  {/* Booth Number Badge & Icon */}
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl flex-shrink-0 border transition-transform group-hover:scale-105 ${
                      isCompleted
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                        : 'bg-slate-800 border-slate-700 text-slate-200'
                    }`}
                  >
                    {booth.icon || '🤖'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold">
                        BOOTH {String(booth.order || index + 1).padStart(2, '0')}
                      </span>
                      {booth.location && (
                        <span className="text-[10px] text-slate-400 flex items-center gap-0.5 truncate">
                          <MapPin className="w-2.5 h-2.5 text-cyan-400" />
                          {booth.location}
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      {booth.name}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                      {booth.description}
                    </p>

                    {/* Status Badge Footer */}
                    <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/60">
                      {isCompleted ? (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>체험 완료!</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5" />
                          <span>미완료 (QR 스캔 필요)</span>
                        </div>
                      )}

                      <div className="flex items-center gap-0.5 text-slate-400 text-[11px] group-hover:text-cyan-300 transition-colors">
                        <span>미션 안내</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Booth Detail Drawer / Modal */}
      {selectedBooth && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative"
            id="modal-booth-detail"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-2xl">
                  {selectedBooth.icon || '🤖'}
                </div>
                <div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                    BOOTH {String(selectedBooth.order || 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-lg font-bold text-slate-100 mt-0.5">
                    {selectedBooth.name}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <p className="text-slate-400 font-medium mb-1">체험 내용</p>
                <p className="text-slate-200">{selectedBooth.description}</p>
              </div>

              {selectedBooth.location && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <p className="text-slate-400 font-medium">부스 위치</p>
                    <p className="text-slate-200">{selectedBooth.location}</p>
                  </div>
                </div>
              )}

              {selectedBooth.hint && (
                <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-xs flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-cyan-300 font-bold">QR 인증 힌트</p>
                    <p className="text-slate-300">{selectedBooth.hint}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedBooth(null);
                  onOpenScanner();
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-cyan-500/25"
                id="btn-detail-scan"
              >
                <QrCode className="w-4 h-4" />
                <span>이 부스 QR 스캔하기</span>
              </button>
              <button
                onClick={() => setSelectedBooth(null)}
                className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs"
                id="btn-detail-close"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
