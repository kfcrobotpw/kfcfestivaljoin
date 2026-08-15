import {
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
  Unsubscribe,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { Booth, Participant, FestivalSettings, ScanResult } from '../types';

// Default initial booths for K.F.C. Festival
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
  snackMessage: '축하합니다! 운영 본부(본관 1층 스낵 부스)에서 진행 요원에게 이 화면을 보여주시면 맛있는 간식 세트를 드립니다.',
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

// Local storage helpers for offline / standalone persistence
class LocalStorageStore {
  getBooths(): Booth[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_KEYS.BOOTHS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    this.setBooths(DEFAULT_BOOTHS);
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
      if (data) {
        return JSON.parse(data);
      }
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
      if (data) {
        return JSON.parse(data);
      }
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
 * Clean & normalize QR token from scan input (handles raw token, URLs, querystrings)
 */
export function parseScannedQrToken(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // Case 1: URL with token parameter (e.g. https://domain.com/scan?token=KFC-ROBOT-A7F29 or ?qr=...)
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('qr') || url.searchParams.get('code');
      if (tokenParam) {
        return tokenParam.trim();
      }
      // If pathname ends with token
      const pathParts = url.pathname.split('/').filter(Boolean);
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart.startsWith('KFC-')) {
        return lastPart;
      }
    }
  } catch {
    // Not a standard URL, continue to regex/string extraction
  }

  // Case 2: Direct token match
  return trimmed;
}

/**
 * Initialize Booths in Firestore if empty
 */
export async function ensureDefaultBooths(): Promise<void> {
  if (!db || !isFirebaseConfigured) {
    localStore.getBooths();
    return;
  }

  try {
    const boothsRef = collection(db, 'booths');
    const snapshot = await getDocs(boothsRef);
    if (snapshot.empty) {
      for (const booth of DEFAULT_BOOTHS) {
        await setDoc(doc(db, 'booths', booth.id), booth);
      }
      console.log('[Firebase] Initialized default booths in Firestore');
    }
  } catch (error) {
    console.warn('[Firebase] Booths init check error, using local fallback:', error);
  }
}

/**
 * Subscribe to Booths List
 */
export function subscribeBooths(callback: (booths: Booth[]) => void): Unsubscribe {
  if (db && isFirebaseConfigured) {
    try {
      const boothsRef = collection(db, 'booths');
      const q = query(boothsRef, orderBy('order', 'asc'));
      
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          if (snapshot.empty) {
            // Seed defaults if empty
            ensureDefaultBooths();
            callback(DEFAULT_BOOTHS);
          } else {
            const list: Booth[] = [];
            snapshot.forEach((docSnap) => {
              list.push({ ...docSnap.data(), id: docSnap.id } as Booth);
            });
            list.sort((a, b) => (a.order || 0) - (b.order || 0));
            localStore.setBooths(list);
            callback(list);
          }
        },
        (error) => {
          console.warn('[Firebase] subscribeBooths error, fallback to local:', error);
          callback(localStore.getBooths());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firebase] subscribeBooths setup error:', e);
    }
  }

  // Local fallback with event listener
  const handler = () => callback(localStore.getBooths());
  window.addEventListener('kfc_booths_updated', handler);
  callback(localStore.getBooths());
  return () => window.removeEventListener('kfc_booths_updated', handler);
}

/**
 * Fetch current booths once
 */
export async function getBooths(): Promise<Booth[]> {
  if (db && isFirebaseConfigured) {
    try {
      const boothsRef = collection(db, 'booths');
      const q = query(boothsRef, orderBy('order', 'asc'));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const list: Booth[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ ...docSnap.data(), id: docSnap.id } as Booth);
        });
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        return list;
      }
    } catch (e) {
      console.warn('[Firebase] getBooths error:', e);
    }
  }
  return localStore.getBooths();
}

/**
 * Subscribe to Participant Profile
 */
export function subscribeParticipant(
  participantId: string,
  callback: (participant: Participant | null) => void
): Unsubscribe {
  if (db && isFirebaseConfigured) {
    try {
      const partDocRef = doc(db, 'participants', participantId);
      const unsubscribe = onSnapshot(
        partDocRef,
        async (docSnap) => {
          if (docSnap.exists()) {
            callback({ ...docSnap.data(), id: docSnap.id } as Participant);
          } else {
            // Auto create new participant profile
            const newParticipant: Participant = {
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
            try {
              await setDoc(partDocRef, newParticipant);
            } catch {
              // ignore
            }
            callback(newParticipant);
          }
        },
        (error) => {
          console.warn('[Firebase] subscribeParticipant error:', error);
          const all = localStore.getParticipants();
          let current = all.find((p) => p.id === participantId);
          if (!current) {
            current = {
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
            all.push(current);
            localStore.setParticipants(all);
          }
          callback(current);
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firebase] subscribeParticipant setup error:', e);
    }
  }

  // Local fallback
  const syncLocal = () => {
    const all = localStore.getParticipants();
    let current = all.find((p) => p.id === participantId);
    if (!current) {
      current = {
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
      all.push(current);
      localStore.setParticipants(all);
    }
    callback(current);
  };

  const handler = () => syncLocal();
  window.addEventListener('kfc_participants_updated', handler);
  syncLocal();
  return () => window.removeEventListener('kfc_participants_updated', handler);
}

/**
 * Verify Scanned QR Token and Update Participant Progress
 */
export async function verifyAndCompleteBooth(
  participantId: string,
  scannedRaw: string
): Promise<ScanResult> {
  const token = parseScannedQrToken(scannedRaw);
  if (!token) {
    return {
      status: 'invalid',
      message: '유효하지 않은 QR 코드 형식입니다.',
    };
  }

  // 1. Get all booths
  const booths = await getBooths();
  const activeBooths = booths.filter((b) => b.active);
  
  // Find matching booth by qrToken
  const matchedBooth = activeBooths.find((b) => b.qrToken.trim().toUpperCase() === token.trim().toUpperCase());

  if (!matchedBooth) {
    // Check if it belongs to an inactive booth
    const inactiveMatch = booths.find((b) => b.qrToken.trim().toUpperCase() === token.trim().toUpperCase());
    if (inactiveMatch) {
      return {
        status: 'inactive',
        message: `현재 '${inactiveMatch.name}' 부스는 일시 중단 상태입니다.`,
        booth: inactiveMatch,
      };
    }
    return {
      status: 'invalid',
      message: 'K.F.C. 축제 부스 QR 코드가 아니거나 유효하지 않은 코드입니다.',
    };
  }

  // 2. Load participant data
  let participant: Participant | null = null;

  if (db && isFirebaseConfigured) {
    try {
      const partDocRef = doc(db, 'participants', participantId);
      const snap = await getDoc(partDocRef);
      if (snap.exists()) {
        participant = { ...snap.data(), id: snap.id } as Participant;
      }
    } catch (e) {
      console.warn('[Firebase] verify participant read error:', e);
    }
  }

  if (!participant) {
    const all = localStore.getParticipants();
    participant = all.find((p) => p.id === participantId) || {
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

  // 3. Check if already completed
  if (participant.completedBooths.includes(matchedBooth.id)) {
    return {
      status: 'already_completed',
      message: `이미 완료한 '${matchedBooth.name}' 체험입니다.`,
      booth: matchedBooth,
      allCompleted: participant.isCompleted,
    };
  }

  // 4. Record new completion
  const updatedCompletedBooths = [...participant.completedBooths, matchedBooth.id];
  
  // Calculate progress against active booths
  const totalActiveCount = Math.max(activeBooths.length, 1);
  const completedActiveCount = activeBooths.filter((b) => updatedCompletedBooths.includes(b.id)).length;
  
  const isAllDone = completedActiveCount >= totalActiveCount;
  const progressPercent = Math.min(100, Math.round((completedActiveCount / totalActiveCount) * 100));

  const updatedParticipant: Participant = {
    ...participant,
    completedBooths: updatedCompletedBooths,
    progress: progressPercent,
    isCompleted: isAllDone,
    completedAt: isAllDone ? (participant.completedAt || Date.now()) : null,
    lastActiveAt: Date.now(),
  };

  // 5. Save to Firestore and LocalStore
  if (db && isFirebaseConfigured) {
    try {
      const partDocRef = doc(db, 'participants', participantId);
      await setDoc(partDocRef, updatedParticipant, { merge: true });
    } catch (e) {
      console.warn('[Firebase] verify participant save error:', e);
    }
  }

  // Always update local cache
  const allParts = localStore.getParticipants();
  const index = allParts.findIndex((p) => p.id === participantId);
  if (index >= 0) {
    allParts[index] = updatedParticipant;
  } else {
    allParts.push(updatedParticipant);
  }
  localStore.setParticipants(allParts);

  return {
    status: 'success',
    message: `'${matchedBooth.name}' 체험을 완료했습니다!`,
    booth: matchedBooth,
    allCompleted: isAllDone,
  };
}

/**
 * Subscribe to All Participants (Admin Live Dashboard & Finisher Feed)
 */
export function subscribeParticipants(callback: (participants: Participant[]) => void): Unsubscribe {
  if (db && isFirebaseConfigured) {
    try {
      const partRef = collection(db, 'participants');
      const unsubscribe = onSnapshot(
        partRef,
        (snapshot) => {
          const list: Participant[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ ...docSnap.data(), id: docSnap.id } as Participant);
          });
          // Sort recent active first
          list.sort((a, b) => (b.lastActiveAt || b.createdAt || 0) - (a.lastActiveAt || a.createdAt || 0));
          localStore.setParticipants(list);
          callback(list);
        },
        (error) => {
          console.warn('[Firebase] subscribeParticipants error:', error);
          callback(localStore.getParticipants());
        }
      );
      return unsubscribe;
    } catch (e) {
      console.warn('[Firebase] subscribeParticipants setup error:', e);
    }
  }

  const handler = () => callback(localStore.getParticipants());
  window.addEventListener('kfc_participants_updated', handler);
  callback(localStore.getParticipants());
  return () => window.removeEventListener('kfc_participants_updated', handler);
}

/**
 * Admin: Add or update Booth
 */
export async function saveBooth(booth: Booth): Promise<void> {
  if (db && isFirebaseConfigured) {
    try {
      await setDoc(doc(db, 'booths', booth.id), booth, { merge: true });
    } catch (e) {
      console.warn('[Firebase] saveBooth error:', e);
    }
  }

  // Update local
  const booths = localStore.getBooths();
  const idx = booths.findIndex((b) => b.id === booth.id);
  if (idx >= 0) {
    booths[idx] = booth;
  } else {
    booths.push(booth);
  }
  booths.sort((a, b) => (a.order || 0) - (b.order || 0));
  localStore.setBooths(booths);
}

/**
 * Admin: Delete Booth
 */
export async function deleteBooth(boothId: string): Promise<void> {
  if (db && isFirebaseConfigured) {
    try {
      await deleteDoc(doc(db, 'booths', boothId));
    } catch (e) {
      console.warn('[Firebase] deleteBooth error:', e);
    }
  }

  const booths = localStore.getBooths().filter((b) => b.id !== boothId);
  localStore.setBooths(booths);
}

/**
 * Admin: Regenerate QR Token for a Booth
 */
export async function regenerateBoothToken(boothId: string): Promise<string> {
  const booths = localStore.getBooths();
  const booth = booths.find((b) => b.id === boothId);
  if (!booth) throw new Error('부스를 찾을 수 없습니다.');

  const prefix = booth.name.includes('로봇') ? 'KFC-ROBOT' : booth.name.includes('AI') ? 'KFC-AI' : 'KFC-BOOTH';
  const newToken = generateBoothToken(prefix);
  const updatedBooth: Booth = {
    ...booth,
    qrToken: newToken,
  };

  await saveBooth(updatedBooth);
  return newToken;
}

/**
 * Admin: Reset a participant's progress
 */
export async function resetParticipant(participantId: string): Promise<void> {
  const updated: Partial<Participant> = {
    completedBooths: [],
    progress: 0,
    isCompleted: false,
    completedAt: null,
    snackClaimed: false,
    snackClaimedAt: null,
    lastActiveAt: Date.now(),
  };

  if (db && isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'participants', participantId), updated);
    } catch (e) {
      console.warn('[Firebase] resetParticipant error:', e);
    }
  }

  const all = localStore.getParticipants();
  const idx = all.findIndex((p) => p.id === participantId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updated };
    localStore.setParticipants(all);
  }
}

/**
 * Admin: Toggle Snack Claimed state
 */
export async function toggleSnackClaimed(participantId: string, currentStatus: boolean): Promise<void> {
  const newStatus = !currentStatus;
  const updateData = {
    snackClaimed: newStatus,
    snackClaimedAt: newStatus ? Date.now() : null,
  };

  if (db && isFirebaseConfigured) {
    try {
      await updateDoc(doc(db, 'participants', participantId), updateData);
    } catch (e) {
      console.warn('[Firebase] toggleSnackClaimed error:', e);
    }
  }

  const all = localStore.getParticipants();
  const idx = all.findIndex((p) => p.id === participantId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updateData };
    localStore.setParticipants(all);
  }
}

/**
 * Admin: Reset all participants (for new festival day)
 */
export async function resetAllParticipants(): Promise<void> {
  if (db && isFirebaseConfigured) {
    try {
      const snap = await getDocs(collection(db, 'participants'));
      for (const d of snap.docs) {
        await deleteDoc(d.ref);
      }
    } catch (e) {
      console.warn('[Firebase] resetAllParticipants error:', e);
    }
  }
  localStore.setParticipants([]);
}
