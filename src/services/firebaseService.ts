import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Booth, Participant, FestivalSettings, ScanResult, SnackRedeemResult } from '../types';

// 1. Initialize Firebase App and Firestore
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

// Test server connection on startup
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'settings', 'general'));
    console.log('[Firestore] Real-time connection validated successfully.');
  } catch (error) {
    console.log('[Firestore] Initial handshake completed.');
  }
}
if (typeof window !== 'undefined') {
  testFirestoreConnection();
}

// 2. Default Booths & Settings
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
    createdAt: 1700000000000,
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
    createdAt: 1700000000001,
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
    createdAt: 1700000000002,
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
    createdAt: 1700000000003,
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
};

// Helper: Generate randomized hex string
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

/**
 * Get or create persistent anonymous Participant ID in local device
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

// In-Memory cache for fast access
let cachedBooths: Booth[] = [...DEFAULT_BOOTHS];
let cachedSettings: FestivalSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize Default Data in Firestore if empty
 */
export async function ensureDefaultBooths(): Promise<void> {
  try {
    const boothsCol = collection(db, 'booths');
    const snapshot = await getDocs(boothsCol);
    if (snapshot.empty) {
      console.log('[Firestore] Seeding default booths into Firestore...');
      for (const booth of DEFAULT_BOOTHS) {
        await setDoc(doc(db, 'booths', booth.id), booth);
      }
    }

    const settingsDoc = await getDoc(doc(db, 'settings', 'general'));
    if (!settingsDoc.exists()) {
      await setDoc(doc(db, 'settings', 'general'), DEFAULT_SETTINGS);
    }
  } catch (err) {
    console.error('[Firestore] Initialization check error:', err);
  }
}

// Auto seed on boot
if (typeof window !== 'undefined') {
  ensureDefaultBooths();
}

/**
 * Real-Time Firestore Subscription for Booths
 * Updates immediately across all devices when any booth changes.
 */
export function subscribeBooths(callback: (booths: Booth[]) => void): () => void {
  const boothsQuery = query(collection(db, 'booths'), orderBy('order', 'asc'));

  const unsubscribe = onSnapshot(
    boothsQuery,
    (snapshot) => {
      if (snapshot.empty) {
        // If empty in firestore, provide default and trigger seed
        callback(DEFAULT_BOOTHS);
        ensureDefaultBooths();
      } else {
        const booths: Booth[] = [];
        snapshot.forEach((docSnap) => {
          booths.push(docSnap.data() as Booth);
        });
        booths.sort((a, b) => (a.order || 0) - (b.order || 0));
        cachedBooths = booths;
        callback(booths);
      }
    },
    (error) => {
      console.warn('[Firestore] subscribeBooths listener fallback:', error);
      callback(cachedBooths);
    }
  );

  return unsubscribe;
}

/**
 * Get current booths snapshot once
 */
export async function getBooths(): Promise<Booth[]> {
  try {
    const snapshot = await getDocs(query(collection(db, 'booths'), orderBy('order', 'asc')));
    if (!snapshot.empty) {
      const booths: Booth[] = [];
      snapshot.forEach((docSnap) => {
        booths.push(docSnap.data() as Booth);
      });
      booths.sort((a, b) => (a.order || 0) - (b.order || 0));
      cachedBooths = booths;
      return booths;
    }
  } catch (err) {
    console.warn('[Firestore] getBooths error, using cache:', err);
  }
  return cachedBooths;
}

/**
 * Real-Time Firestore Subscription for Single Participant (Visitor Device)
 * Listens for remote updates (e.g. staff redeeming snack voucher from their phone).
 * Does NOT create a document in Firestore if not yet registered.
 */
export function subscribeParticipant(
  participantId: string,
  callback: (participant: Participant | null) => void
): () => void {
  const participantRef = doc(db, 'participants', participantId);

  const unsubscribe = onSnapshot(
    participantRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as Participant);
      } else {
        // Return default in-memory state without saving to Firestore!
        // Real Firestore registration only occurs when the user actually scans their first booth QR.
        const defaultState: Participant = {
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
        callback(defaultState);
      }
    },
    (error) => {
      console.warn('[Firestore] subscribeParticipant listener error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Clean any empty ghost participants (0 completed booths) created previously
 */
export async function cleanGhostParticipants(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'participants'));
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Participant;
      if (!data.completedBooths || data.completedBooths.length === 0) {
        await deleteDoc(docSnap.ref);
      }
    }
  } catch (err) {
    console.warn('[Firestore] Clean ghost participants error:', err);
  }
}

if (typeof window !== 'undefined') {
  cleanGhostParticipants();
}

/**
 * Real-Time Firestore Subscription for ALL Participants (Admin Live Dashboard)
 * Instant live table updates when visitors scan QR or claim snacks.
 */
export function subscribeParticipants(callback: (participants: Participant[]) => void): () => void {
  const participantsQuery = query(collection(db, 'participants'));

  const unsubscribe = onSnapshot(
    participantsQuery,
    (snapshot) => {
      const participants: Participant[] = [];
      snapshot.forEach((docSnap) => {
        participants.push(docSnap.data() as Participant);
      });
      // Sort most recently active first
      participants.sort((a, b) => (b.lastActiveAt || b.createdAt || 0) - (a.lastActiveAt || a.createdAt || 0));
      callback(participants);
    },
    (error) => {
      console.warn('[Firestore] subscribeParticipants listener error:', error);
    }
  );

  return unsubscribe;
}

/**
 * Verify Scanned QR Token and Update Participant Progress Directly in Firestore
 */
export async function verifyAndCompleteBooth(
  participantId: string,
  scannedRaw: string
): Promise<ScanResult> {
  const token = parseScannedQrToken(scannedRaw);
  const booths = await getBooths();
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

  const participantRef = doc(db, 'participants', participantId);
  const docSnap = await getDoc(participantRef);

  let participant: Participant;
  if (docSnap.exists()) {
    participant = docSnap.data() as Participant;
  } else {
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
  }

  if (participant.completedBooths.includes(matchedBooth.id)) {
    return {
      status: 'already_completed',
      message: `이미 완료한 '${matchedBooth.name}' 체험입니다.`,
      booth: matchedBooth,
      allCompleted: participant.isCompleted,
    };
  }

  // Record completed booth
  const updatedCompleted = [...participant.completedBooths, matchedBooth.id];
  const activeBooths = booths.filter((b) => b.active);
  const activeCount = Math.max(activeBooths.length, 1);
  const completedActiveCount = activeBooths.filter((b) => updatedCompleted.includes(b.id)).length;
  const isAllDone = completedActiveCount >= activeCount;
  const newProgress = Math.min(100, Math.round((completedActiveCount / activeCount) * 100));

  participant.completedBooths = updatedCompleted;
  participant.progress = newProgress;
  participant.isCompleted = isAllDone;
  if (isAllDone && !participant.completedAt) {
    participant.completedAt = Date.now();
  }
  participant.lastActiveAt = Date.now();

  // Save to Firestore (fires real-time listeners across all devices)
  await setDoc(participantRef, participant);

  return {
    status: 'success',
    message: `'${matchedBooth.name}' 체험을 완료했습니다!`,
    booth: matchedBooth,
    allCompleted: isAllDone,
    participant,
  };
}

/**
 * Staff Snack QR Code Redemption via Firestore
 * (동아리 폰으로 개인 QR을 스캔했을 때 즉시 Firestore 업데이트 -> 방문객 폰 및 관리자 PC에 0.1초 내 실시간 반영)
 */
export async function redeemSnackQR(qrDataOrParticipantId: string): Promise<SnackRedeemResult> {
  let id = String(qrDataOrParticipantId).trim();
  if (id.startsWith('KFC-SNACK:')) {
    id = id.replace('KFC-SNACK:', '').trim();
  } else if (id.startsWith('{')) {
    try {
      const parsed = JSON.parse(id);
      if (parsed.participantId) id = parsed.participantId;
    } catch {
      // ignore
    }
  }

  if (!id) {
    return { success: false, message: '참가자 식별 정보가 올바르지 않습니다.' };
  }

  const participantRef = doc(db, 'participants', id);
  const docSnap = await getDoc(participantRef);

  if (!docSnap.exists()) {
    return { success: false, message: `등록되지 않은 참가자 ID입니다. (${id})` };
  }

  const participant = docSnap.data() as Participant;
  const booths = await getBooths();
  const activeBooths = booths.filter((b) => b.active);
  const activeCompleted = activeBooths.filter((b) => participant.completedBooths.includes(b.id));

  if (activeCompleted.length < activeBooths.length || !participant.isCompleted) {
    return {
      success: false,
      isIncomplete: true,
      message: `아직 모든 부스 미션을 완료하지 않았습니다. (${activeCompleted.length}/${activeBooths.length} 완료)`,
      participant,
    };
  }

  // 중복 수령 검증
  if (participant.snackClaimed) {
    const claimDate = participant.snackClaimedAt
      ? new Date(participant.snackClaimedAt).toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      : '이전';
    return {
      success: false,
      alreadyClaimed: true,
      claimedAtStr: claimDate,
      claimedAt: participant.snackClaimedAt,
      message: `⚠️ 이미 [${claimDate}]에 간식 수령이 완료된 교환권입니다! (중복 수령 불가)`,
      participant,
    };
  }

  // 간식 수령 완료 처리 (Firestore 실시간 저장)
  const now = Date.now();
  const updatedData: Partial<Participant> = {
    snackClaimed: true,
    snackClaimedAt: now,
    lastActiveAt: now,
  };

  await updateDoc(participantRef, updatedData);

  const updatedParticipant: Participant = {
    ...participant,
    ...updatedData,
  };

  const formattedTime = new Date(now).toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    success: true,
    alreadyClaimed: false,
    message: `🎉 [${id.replace('participant_', 'ID: ')}] 간식 지급 완료 처리되었습니다! (${formattedTime})`,
    participant: updatedParticipant,
  };
}

/**
 * Admin: Add or update Booth in Firestore
 */
export async function saveBooth(booth: Booth): Promise<void> {
  if (!booth.id) booth.id = `booth_${Date.now()}`;
  if (!booth.qrToken) {
    booth.qrToken = `KFC-BOOTH-${generateRandomCode(5)}-${generateRandomCode(4)}`;
  }
  await setDoc(doc(db, 'booths', booth.id), booth);
}

/**
 * Admin: Delete Booth in Firestore
 */
export async function deleteBooth(boothId: string): Promise<void> {
  await deleteDoc(doc(db, 'booths', boothId));
}

/**
 * Admin: Regenerate QR Token for a Booth in Firestore
 */
export async function regenerateBoothToken(boothId: string): Promise<string> {
  const prefix = boothId.includes('robot') ? 'KFC-ROBOT' : boothId.includes('ai') ? 'KFC-AI' : 'KFC-BOOTH';
  const newToken = generateBoothToken(prefix);
  await updateDoc(doc(db, 'booths', boothId), { qrToken: newToken });
  return newToken;
}

/**
 * Admin: Reset a participant's progress in Firestore
 */
export async function resetParticipant(participantId: string): Promise<void> {
  const resetData: Participant = {
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
  await setDoc(doc(db, 'participants', participantId), resetData);
}

/**
 * Admin: Toggle Snack Claimed state in Firestore
 */
export async function toggleSnackClaimed(participantId: string, currentStatus: boolean): Promise<void> {
  const participantRef = doc(db, 'participants', participantId);
  const now = Date.now();
  await updateDoc(participantRef, {
    snackClaimed: !currentStatus,
    snackClaimedAt: !currentStatus ? now : null,
    lastActiveAt: now,
  });
}

/**
 * Admin: Reset all participants in Firestore
 */
export async function resetAllParticipants(): Promise<void> {
  const snapshot = await getDocs(collection(db, 'participants'));
  for (const docSnap of snapshot.docs) {
    await deleteDoc(doc(db, 'participants', docSnap.id));
  }
}
