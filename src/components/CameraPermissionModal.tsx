import React, { useState } from 'react';
import {
  Camera,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Smartphone,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { requestCameraAccess } from '../services/cameraService';

interface CameraPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

export const CameraPermissionModal: React.FC<CameraPermissionModalProps> = ({
  isOpen,
  onClose,
  onPermissionGranted,
}) => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'safari' | 'chrome' | 'samsung' | 'inapp'>('chrome');

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setErrorMessage(null);

    const res = await requestCameraAccess();
    setIsRequesting(false);

    if (res.success) {
      setStatus('granted');
      setTimeout(() => {
        onClose();
        if (onPermissionGranted) onPermissionGranted();
      }, 1200);
    } else {
      setStatus('denied');
      setErrorMessage(res.errorMessage || '카메라 권한이 허용되지 않았습니다.');
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        id="modal-camera-permission"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">카메라 사용 권한 다시 수락</h2>
              <p className="text-[11px] text-slate-400">부스 QR 코드 인식을 위한 카메라 권한 설정</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            id="btn-close-camera-permission-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {status === 'granted' ? (
            <div className="py-6 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 mx-auto mb-3 animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <h3 className="text-lg font-black text-slate-100 mb-1">카메라 권한이 허용되었습니다!</h3>
              <p className="text-xs text-slate-300">잠시 후 QR 코드 스캐너가 열립니다...</p>
            </div>
          ) : (
            <>
              {/* Primary Callout Button */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-blue-950/60 border border-cyan-800/50 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-2 border border-cyan-500/30">
                  <Camera className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-100 mb-1">
                  브라우저 카메라 사용 수락하기
                </h3>
                <p className="text-[11px] text-slate-300 mb-3 leading-relaxed">
                  아래 버튼을 누르고 화면 상단/하단에 뜨는 <strong className="text-cyan-400">[허용]</strong> 또는 <strong className="text-cyan-400">[수락]</strong>을 선택해주세요.
                </p>

                <button
                  onClick={handleRequestPermission}
                  disabled={isRequesting}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-black text-xs shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  id="btn-trigger-camera-permission"
                >
                  {isRequesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>카메라 권한 요청 중...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>지금 카메라 권한 수락하기</span>
                    </>
                  )}
                </button>
              </div>

              {/* Error Notice & Browser Setting Instructions if denied */}
              {status === 'denied' && (
                <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-800/60 text-left animate-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center gap-2 text-rose-400 text-xs font-bold mb-1">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>브라우저에서 카메라가 차단되어 있습니다</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">
                    {errorMessage || '브라우저 주소창 왼쪽 설정에서 카메라를 직접 허용으로 변경해야 합니다.'}
                  </p>
                </div>
              )}

              {/* Browser-Specific Step-by-Step Guide */}
              <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-3.5 text-left">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                    <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
                    <span>기기별 권한 허용 방법</span>
                  </div>
                </div>

                {/* OS/Browser Tabs */}
                <div className="flex gap-1 mb-3 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setActiveTab('chrome')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeTab === 'chrome'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    크롬(Chrome)
                  </button>
                  <button
                    onClick={() => setActiveTab('safari')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeTab === 'safari'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    아이폰(Safari)
                  </button>
                  <button
                    onClick={() => setActiveTab('samsung')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeTab === 'samsung'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    삼성 인터넷
                  </button>
                  <button
                    onClick={() => setActiveTab('inapp')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all ${
                      activeTab === 'inapp'
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    카톡/네이버
                  </button>
                </div>

                {/* Tab Content */}
                <div className="text-[11px] text-slate-300 space-y-1.5 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                  {activeTab === 'chrome' && (
                    <>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>화면 상단 주소창 좌측의 <strong>자물쇠(🔒)</strong> 또는 <strong>설정 아이콘</strong>을 터치합니다.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span><strong>[권한]</strong> 또는 <strong>[사이트 설정]</strong> 메뉴를 선택합니다.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          3
                        </span>
                        <span><strong>카메라</strong> 항목을 <strong>[허용]</strong>으로 변경한 뒤 새로고침합니다.</span>
                      </p>
                    </>
                  )}

                  {activeTab === 'safari' && (
                    <>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>주소창 좌측의 <strong>가(aA)</strong> 또는 <strong>설정 아이콘</strong>을 터치합니다.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span><strong>[웹사이트 설정]</strong>을 누르고 <strong>[카메라]</strong>를 <strong>[허용]</strong>으로 바꿉니다.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          3
                        </span>
                        <span>(또는 아이폰 설정 앱 ➔ Safari ➔ 카메라 ➔ 허용)</span>
                      </p>
                    </>
                  )}

                  {activeTab === 'samsung' && (
                    <>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          1
                        </span>
                        <span>우측 하단 메뉴(≡) ➔ <strong>[설정]</strong> ➔ <strong>[사이트 및 다운로드]</strong> 선택</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          2
                        </span>
                        <span><strong>[사이트 권한]</strong> ➔ <strong>[카메라]</strong> 항목을 <strong>[허용]</strong>으로 설정합니다.</span>
                      </p>
                    </>
                  )}

                  {activeTab === 'inapp' && (
                    <>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          !
                        </span>
                        <span>카카오톡/네이버 인앱 브라우저는 카메라 권한이 제한될 수 있습니다.</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-[9px] shrink-0 mt-0.5">
                          👉
                        </span>
                        <span>화면 우측 하단/상단 점 3개(⋮ 또는 ...) ➔ <strong>[다른 브라우저로 열기(Safari / Chrome)]</strong>를 눌러 접속해주세요.</span>
                      </p>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between gap-2">
          <button
            onClick={handleReload}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>페이지 새로고침</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
