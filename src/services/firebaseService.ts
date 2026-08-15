import { Booth, Participant, FestivalSettings, ScanResult, SnackRedeemResult } from '../types';

export const DEFAULT_BOOTHS: Booth[] = [
  {
    id: 'booth_01',
    name: '🤖 로봇 체험',
    description: '휴머노이드 & 4족 보행 로봇 시연 및 직접 원격 조종 미션',
    icon: '🤖',
    order: 1,
    active: true,
    qrToken: 'KFC-ROBOT-A7F29',
    location: 'A구역 1번 부스 (로봇 조종존)',
    hint: '부스 운영진의 안내를 받아 로봇 조종을 완료한 후 현장 QR 코드를 스캔하세요!',
    createdAt: Date.now(),
  },
  {
    id: 'booth_02',
    name: '🧠 AI 웹앱 체험',
    description: 'K.F.C. 인공지능 비전 인식 및 로봇 제어 시스템 체험',
    icon: '🧠',
    order: 2,
    active: true,
    qrToken: 'KFC-AI-B42D1',
    location: 'A구역 2번 부스 (AI 비전존)',
    hint: 'AI 제어 시스템 모니터에 표시된 QR 코드를 카메라로 스캔하세요.',
    createdAt: Date.now(),
  },
  {
    id: 'booth_03',
    name: '🚗 로봇 미션',
    description: '자율주행 RC 트랙 주행 및 장애물 회피 랩타임 챌린지',
    icon: '🚗',
    order: 3,
    active: true,
    qrToken: 'KFC-MISSION-91C83',
    location: 'B구역 1번 부스 (트랙 경기장)',
    hint: '트랙 완주 후 골인 지점에 위치한 인증 QR 코드를 스캔하세요.',
    createdAt: Date.now(),
  },
  {
    id: 'booth_04',
    name: '🎮 K.F.C. 게임',
    description: '로봇 배틀 아레나 미니게임 & 터치 리액션 대결',
    icon: '🎮',
    order: 4,
    active: true,
    qrToken: 'KFC-GAME-C83F2',
    location: 'B구역 2번 부스 (게임존)',
    hint: '대결 게임 참여 후 승패와 관계없이 부스 스태프 명찰 QR을 스캔하세요.',
    createdAt: Date.now(),
  },
];

export const DEFAULT_SETTINGS: FestivalSettings = {
  title: 'K.F.C. FESTIVAL EXPERIENCE',
  subtitle: '모든 체험을 완료하고 간식을 받아가세요!',
  clubName: '용인시청소년수련관 로봇동아리 K.F.C.',
  snackMessage: '축하합니다! 운영 본부(본관 1층 스낵 부스)에서 진행 요원에게 이 화면의 QR 코드를 보여주시면 맛있는 간식 세트를 드립니다.',
  snackStationName: 'K.F.C. 운영본부 스낵 교환처',
  allowManualCode: true,
};

const LOCAL_STORAGE_KEYS = {
  PARTICIPANT_ID: 'kfc_participant_id',
  BOOTHS: 'kfc_local_booths',
  PARTICIPANTS: 'kfc_local_participants',
  SETTINGS: 'kfc_local_settings',
};

// Generate randomized hex string
export function generateRandomCode(length = 6): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateBoothToken(prefix = 'KFC'): string {
  return `${prefix}-${generateRandomCode(5)}-${generateRandomCode(4)}`;
}

// Local cache store
class LocalStorageStore {
  getBooths(): Booth[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.BOOTHS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return DEFAULT_BOOTHS;
  }

  setBooths(booths: Booth[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.BOOTHS, JSON.stringify(booths));
      window.dispatchEvent(new Event('kfc_booths_updated'));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  getParticipants(): Participant[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.PARTICIPANTS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return [];
  }

  setParticipants(participants: Participant[]) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.PARTICIPANTS, JSON.stringify(participants));
      window.dispatchEvent(new Event('kfc_participants_updated'));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }

  getSettings(): FestivalSettings {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
      if (data) return JSON.parse(data);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  }

  setSettings(settings: FestivalSettings) {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      window.dispatchEvent(new Event('kfc_settings_updated'));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }
}

export const localStore = new LocalStorageStore();

/**
 * Get or create anonymous Participant ID
 */
export function getOrCreateParticipantId(): string {
  let id = localStorage.getItem(LOCAL_STORAGE_KEYS.PARTICIPANT_ID);
  if (!id) {
    const randomHex = generateRandomCode(6);
    id = `participant_${randomHex}`;
    localStorage.setItem(LOCAL_STORAGE_KEYS.PARTICIPANT_ID, id);
  }
  return id;
}

/**
 * Clean & normalize QR token from scan input
 */
export function parseScannedQrToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('qr') || url.searchParams.get('code');
      if (tokenParam) return tokenParam.trim();
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.startsWith('KFC-')) return lastPart;
    }
  } catch {
    // ignore
  }

  return trimmed;
}

// ----------------- Real-Time Server-Sent Events (SSE) Engine -----------------
type EventListener = (data: any) => void;
const listeners = new Set<EventListener>();
let eventSource: EventSource | null = null;
let reconnectTimer: any = null;

function connectSSE() {
  if (typeof window === 'undefined') return;
  if (eventSource && eventSource.readyState !== EventSource.CLOSED) return;

  try {
    eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      console.log('[SSE] Real-time connection established');
    };

    eventSource.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        if (parsed.payload) {
          const { booths, participants, settings } = parsed.payload;
          if (booths) localStore.setBooths(booths);
          if (participants) localStore.setParticipants(participants);
          if (settings) localStore.setSettings(settings);
        }
        listeners.forEach((listener) => listener(parsed));
      } catch (err) {
        console.warn('[SSE] Parse error:', err);
      }
    };

    eventSource.onerror = () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
      clearTimeout(reconnectTimer);
      reconnectTimer = setTimeout(connectSSE, 3000);
    };
  } catch (err) {
    console.warn('[SSE] Init error:', err);
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectSSE, 5000);
  }
}

// Initial fetch & SSE connection
if (typeof window !== 'undefined') {
  connectSSE();
  fetch('/api/state')
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      if (data) {
        if (data.booths) localStore.setBooths(data.booths);
        if (data.participants) localStore.setParticipants(data.participants);
        if (data.settings) localStore.setSettings(data.settings);
      }
    })
    .catch(() => {});
}

export async function ensureDefaultBooths(): Promise<void> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      if (data.booths) localStore.setBooths(data.booths);
    }
  } catch {
    localStore.getBooths();
  }
}

/**
 * Subscribe to Booths List
 */
export function subscribeBooths(callback: (booths: Booth[]) => void): () => void {
  connectSSE();

  const handleUpdate = () => {
    callback(localStore.getBooths());
  };

  window.addEventListener('kfc_booths_updated', handleUpdate);
  callback(localStore.getBooths());

  // Also fetch immediately
  fetch('/api/state')
    .then((r) => r.json())
    .then((data) => {
      if (data && data.booths) {
        localStore.setBooths(data.booths);
        callback(data.booths);
      }
    })
    .catch(() => {});

  return () => {
    window.removeEventListener('kfc_booths_updated', handleUpdate);
  };
}

/**
 * Fetch current booths once
 */
export async function getBooths(): Promise<Booth[]> {
  try {
    const res = await fetch('/api/state');
    if (res.ok) {
      const data = await res.json();
      if (data.booths) {
        localStore.setBooths(data.booths);
        return data.booths;
      }
    }
  } catch {
    // fallback
  }
  return localStore.getBooths();
}

/**
 * Subscribe to Participant Profile
 */
export function subscribeParticipant(
  participantId: string,
  callback: (participant: Participant | null) => void
): () => void {
  connectSSE();

  const sync = () => {
    const all = localStore.getParticipants();
    const current = all.find((p) => p.id === participantId);
    if (current) {
      callback(current);
    } else {
      // Register with server
      fetch(`/api/participants/${participantId}`)
        .then((r) => r.json())
        .then((p) => {
          if (p) callback(p);
        })
        .catch(() => {
          callback(null);
        });
    }
  };

  window.addEventListener('kfc_participants_updated', sync);
  sync();

  return () => {
    window.removeEventListener('kfc_participants_updated', sync);
  };
}

/**
 * Verify Scanned QR Token and Update Participant Progress
 */
export async function verifyAndCompleteBooth(
  participantId: string,
  scannedRaw: string
): Promise<ScanResult> {
  try {
    const res = await fetch('/api/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ participantId, scannedRaw }),
    });

    if (res.ok) {
      const result: ScanResult & { participant?: Participant } = await res.json();
      if (result.participant) {
        const all = localStore.getParticipants();
        const idx = all.findIndex((p) => p.id === participantId);
        if (idx >= 0) all[idx] = result.participant;
        else all.push(result.participant);
        localStore.setParticipants(all);
      }
      return result;
    }
  } catch (err) {
    console.error('Verify scan API error:', err);
  }

  // Offline / fallback processing
  const token = parseScannedQrToken(scannedRaw);
  const booths = localStore.getBooths();
  const matchedBooth = booths.find(
    (b) => b.qrToken.trim().toUpperCase() === token.toUpperCase()
  );

  if (!matchedBooth) {
    return {
      status: 'invalid',
      message: 'K.F.C. 축제 부스 QR 코드가 아니거나 유효하지 않은 코드입니다.',
    };
  }

  if (!matchedBooth.active) {
    return {
      status: 'inactive',
      message: `현재 '${matchedBooth.name}' 부스는 일시 중단 상태입니다.`,
      booth: matchedBooth,
    };
  }

  const all = localStore.getParticipants();
  let participant = all.find((p) => p.id === participantId);
  if (!participant) {
    participant = {
      id: participantId,
      createdAt: Date.now(),
      completedBooths: [],
      progress: 0,
      isCompleted: false,
      completedAt: null,
      snackClaimed: false,
      snackClaimedAt: null,
      lastActiveAt: Date.now(),
    };
    all.push(participant);
  }

  if (participant.completedBooths.includes(matchedBooth.id)) {
    return {
      status: 'already_completed',
      message: `이미 완료한 '${matchedBooth.name}' 체험입니다.`,
      booth: matchedBooth,
      allCompleted: participant.isCompleted,
    };
  }

  participant.completedBooths.push(matchedBooth.id);
  const activeBooths = booths.filter((b) => b.active);
  const isDone = participant.completedBooths.length >= activeBooths.length;
  participant.progress = Math.min(100, Math.round((participant.completedBooths.length / activeBooths.length) * 100));
  participant.isCompleted = isDone;
  if (isDone && !participant.completedAt) participant.completedAt = Date.now();
  localStore.setParticipants(all);

  return {
    status: 'success',
    message: `'${matchedBooth.name}' 체험을 완료했습니다!`,
    booth: matchedBooth,
    allCompleted: isDone,
  };
}

/**
 * Staff Snack QR Code Redemption
 * (스태프가 방문객의 간식 QR 코드를 스캔했을 때 즉시 사용 완료 처리 및 중복 수령 방지 검증)
 */
export async function redeemSnackQR(qrDataOrParticipantId: string): Promise<SnackRedeemResult> {
  try {
    const res = await fetch('/api/snack/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrData: qrDataOrParticipantId }),
    });

    if (res.ok) {
      const data: SnackRedeemResult = await res.json();
      if (data.participant) {
        const all = localStore.getParticipants();
        const idx = all.findIndex((p) => p.id === data.participant!.id);
        if (idx >= 0) all[idx] = data.participant;
        else all.push(data.participant);
        localStore.setParticipants(all);
      }
      return data;
    }
  } catch (err) {
    console.error('Redeem snack API error:', err);
  }

  // Fallback
  let id = qrDataOrParticipantId;
  if (id.startsWith('KFC-SNACK:')) id = id.replace('KFC-SNACK:', '').trim();
  const all = localStore.getParticipants();
  const participant = all.find((p) => p.id === id);

  if (!participant) {
    return { success: false, message: '참가자 정보를 찾을 수 없습니다.' };
  }

  if (participant.snackClaimed) {
    return {
      success: false,
      alreadyClaimed: true,
      claimedAt: participant.snackClaimedAt,
      message: '⚠️ 이미 수령 완료된 간식 교환권입니다! (중복 수령 불가)',
      participant,
    };
  }

  participant.snackClaimed = true;
  participant.snackClaimedAt = Date.now();
  localStore.setParticipants(all);

  return {
    success: true,
    alreadyClaimed: false,
    message: `🎉 [${participant.id}] 간식 지급 완료 처리되었습니다!`,
    participant,
  };
}

/**
 * Subscribe to All Participants (Admin Live Dashboard)
 */
export function subscribeParticipants(callback: (participants: Participant[]) => void): () => void {
  connectSSE();

  const sync = () => {
    callback(localStore.getParticipants());
  };

  window.addEventListener('kfc_participants_updated', sync);
  callback(localStore.getParticipants());

  // Fetch initial
  fetch('/api/state')
    .then((r) => r.json())
    .then((data) => {
      if (data && data.participants) {
        localStore.setParticipants(data.participants);
        callback(data.participants);
      }
    })
    .catch(() => {});

  return () => {
    window.removeEventListener('kfc_participants_updated', sync);
  };
}

/**
 * Admin: Add or update Booth
 */
export async function saveBooth(booth: Booth): Promise<void> {
  try {
    await fetch('/api/booths', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(booth),
    });
  } catch {
    // ignore
  }

  const booths = localStore.getBooths();
  const idx = booths.findIndex((b) => b.id === booth.id);
  if (idx >= 0) booths[idx] = booth;
  else booths.push(booth);
  booths.sort((a, b) => (a.order || 0) - (b.order || 0));
  localStore.setBooths(booths);
}

/**
 * Admin: Delete Booth
 */
export async function deleteBooth(boothId: string): Promise<void> {
  try {
    await fetch(`/api/booths/${boothId}`, { method: 'DELETE' });
  } catch {
    // ignore
  }

  const booths = localStore.getBooths().filter((b) => b.id !== boothId);
  localStore.setBooths(booths);
}

/**
 * Admin: Regenerate QR Token for a Booth
 */
export async function regenerateBoothToken(boothId: string): Promise<string> {
  try {
    const res = await fetch(`/api/booths/${boothId}/regen-token`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      return data.qrToken;
    }
  } catch {
    // ignore
  }

  const booths = localStore.getBooths();
  const booth = booths.find((b) => b.id === boothId);
  if (!booth) throw new Error('부스를 찾을 수 없습니다.');
  const prefix = booth.name.includes('로봇') ? 'KFC-ROBOT' : booth.name.includes('AI') ? 'KFC-AI' : 'KFC-BOOTH';
  const newToken = generateBoothToken(prefix);
  booth.qrToken = newToken;
  localStore.setBooths(booths);
  return newToken;
}

/**
 * Admin: Reset a participant's progress
 */
export async function resetParticipant(participantId: string): Promise<void> {
  try {
    await fetch(`/api/participants/${participantId}/reset`, { method: 'POST' });
  } catch {
    // ignore
  }

  const all = localStore.getParticipants();
  const idx = all.findIndex((p) => p.id === participantId);
  if (idx >= 0) {
    all[idx] = {
      id: participantId,
      createdAt: Date.now(),
      completedBooths: [],
      progress: 0,
      isCompleted: false,
      completedAt: null,
      snackClaimed: false,
      snackClaimedAt: null,
      lastActiveAt: Date.now(),
    };
    localStore.setParticipants(all);
  }
}

/**
 * Admin: Toggle Snack Claimed state
 */
export async function toggleSnackClaimed(participantId: string, currentStatus: boolean): Promise<void> {
  try {
    await fetch(`/api/participants/${participantId}/toggle-snack`, { method: 'POST' });
  } catch {
    // ignore
  }

  const all = localStore.getParticipants();
  const idx = all.findIndex((p) => p.id === participantId);
  if (idx >= 0) {
    all[idx].snackClaimed = !currentStatus;
    all[idx].snackClaimedAt = !currentStatus ? Date.now() : null;
    localStore.setParticipants(all);
  }
}

/**
 * Admin: Reset all participants
 */
export async function resetAllParticipants(): Promise<void> {
  try {
    await fetch('/api/participants/reset-all', { method: 'POST' });
  } catch {
    // ignore
  }
  localStore.setParticipants([]);
}
