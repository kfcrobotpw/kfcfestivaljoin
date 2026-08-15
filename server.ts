import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

interface Booth {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  order: number;
  active: boolean;
  qrToken: string;
  location?: string;
  hint?: string;
  createdAt: number;
}

interface Participant {
  id: string;
  createdAt: number;
  completedBooths: string[];
  progress: number;
  isCompleted: boolean;
  completedAt?: number | null;
  snackClaimed?: boolean;
  snackClaimedAt?: number | null;
  lastActiveAt?: number;
}

interface FestivalSettings {
  title: string;
  subtitle: string;
  clubName: string;
  snackMessage: string;
  snackStationName: string;
  allowManualCode: boolean;
}

const DEFAULT_BOOTHS: Booth[] = [
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

const DEFAULT_SETTINGS: FestivalSettings = {
  title: 'K.F.C. FESTIVAL EXPERIENCE',
  subtitle: '모든 체험을 완료하고 간식을 받아가세요!',
  clubName: '용인시청소년수련관 로봇동아리 K.F.C.',
  snackMessage: '축하합니다! 운영 본부(본관 1층 스낵 부스)에서 진행 요원에게 이 화면의 QR 코드를 보여주시면 맛있는 간식 세트를 드립니다.',
  snackStationName: 'K.F.C. 운영본부 스낵 교환처',
  allowManualCode: true,
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'festival-db.json');

// In-Memory state
let booths: Booth[] = [...DEFAULT_BOOTHS];
let participants: Participant[] = [];
let settings: FestivalSettings = { ...DEFAULT_SETTINGS };

// Load persistent state from disk
function loadDatabase() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data.booths) && data.booths.length > 0) booths = data.booths;
      if (Array.isArray(data.participants)) participants = data.participants;
      if (data.settings) settings = { ...DEFAULT_SETTINGS, ...data.settings };
      console.log(`[DB] Loaded ${booths.length} booths, ${participants.length} participants`);
    } else {
      saveDatabase();
    }
  } catch (err) {
    console.error('[DB] Load error:', err);
  }
}

// Save persistent state to disk
function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = { booths, participants, settings };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Save error:', err);
  }
}

// SSE client connections pool
const sseClients: Response[] = [];

function broadcastSSE(type: string, payload: any) {
  const message = `event: message\ndata: ${JSON.stringify({ type, payload, timestamp: Date.now() })}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    try {
      sseClients[i].write(message);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

function broadcastFullState() {
  broadcastSSE('STATE_SYNC', { booths, participants, settings });
}

function generateRandomCode(length = 6): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

function normalizeToken(raw: string): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const url = new URL(trimmed);
      const tokenParam = url.searchParams.get('token') || url.searchParams.get('qr') || url.searchParams.get('code');
      if (tokenParam) return tokenParam.trim();
      const parts = url.pathname.split('/').filter(Boolean);
      const last = parts[parts.length - 1];
      if (last && last.startsWith('KFC-')) return last;
    }
  } catch {
    // ignore
  }
  return trimmed;
}

async function startServer() {
  loadDatabase();

  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: Date.now(), totalParticipants: participants.length });
  });

  // 1. Full State API
  app.get('/api/state', (req, res) => {
    res.json({ booths, participants, settings });
  });

  // 2. Server-Sent Events (SSE) for Real-Time Cross-Device Sync
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    // Send initial snapshot immediately
    res.write(`event: message\ndata: ${JSON.stringify({ type: 'INIT', payload: { booths, participants, settings } })}\n\n`);

    sseClients.push(res);

    req.on('close', () => {
      const idx = sseClients.indexOf(res);
      if (idx !== -1) sseClients.splice(idx, 1);
    });
  });

  // Periodic SSE keepalive ping every 20s
  setInterval(() => {
    for (let i = sseClients.length - 1; i >= 0; i--) {
      try {
        sseClients[i].write(': keepalive\n\n');
      } catch {
        sseClients.splice(i, 1);
      }
    }
  }, 20000);

  // 3. Participant Registration / Get Profile
  app.get('/api/participants/:id', (req, res) => {
    const { id } = req.params;
    let participant = participants.find((p) => p.id === id);
    if (!participant) {
      participant = {
        id,
        createdAt: Date.now(),
        completedBooths: [],
        progress: 0,
        isCompleted: false,
        completedAt: null,
        snackClaimed: false,
        snackClaimedAt: null,
        lastActiveAt: Date.now(),
      };
      participants.push(participant);
      saveDatabase();
      broadcastFullState();
    }
    res.json(participant);
  });

  // 4. Booth QR Scan Verification
  app.post('/api/scan', (req, res) => {
    const { participantId, scannedRaw } = req.body;
    if (!participantId || !scannedRaw) {
      return res.status(400).json({ status: 'invalid', message: '요청 데이터가 올바르지 않습니다.' });
    }

    const token = normalizeToken(scannedRaw);
    const activeBooths = booths.filter((b) => b.active);
    const matchedBooth = activeBooths.find(
      (b) => b.qrToken.trim().toUpperCase() === token.toUpperCase()
    );

    if (!matchedBooth) {
      const inactiveMatch = booths.find(
        (b) => b.qrToken.trim().toUpperCase() === token.toUpperCase()
      );
      if (inactiveMatch) {
        return res.json({
          status: 'inactive',
          message: `현재 '${inactiveMatch.name}' 부스는 일시 중단 상태입니다.`,
          booth: inactiveMatch,
        });
      }
      return res.json({
        status: 'invalid',
        message: 'K.F.C. 축제 부스 QR 코드가 아니거나 유효하지 않은 코드입니다.',
      });
    }

    let participant = participants.find((p) => p.id === participantId);
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
      participants.push(participant);
    }

    // Check if already completed this booth
    if (participant.completedBooths.includes(matchedBooth.id)) {
      return res.json({
        status: 'already_completed',
        message: `이미 완료한 '${matchedBooth.name}' 체험입니다.`,
        booth: matchedBooth,
        allCompleted: participant.isCompleted,
      });
    }

    // Add completed booth
    participant.completedBooths.push(matchedBooth.id);
    participant.lastActiveAt = Date.now();

    const activeCount = Math.max(activeBooths.length, 1);
    const completedActiveCount = activeBooths.filter((b) =>
      participant!.completedBooths.includes(b.id)
    ).length;

    const isAllDone = completedActiveCount >= activeCount;
    participant.progress = Math.min(100, Math.round((completedActiveCount / activeCount) * 100));
    participant.isCompleted = isAllDone;
    if (isAllDone && !participant.completedAt) {
      participant.completedAt = Date.now();
    }

    saveDatabase();
    broadcastFullState();

    return res.json({
      status: 'success',
      message: `'${matchedBooth.name}' 체험을 완료했습니다!`,
      booth: matchedBooth,
      allCompleted: isAllDone,
      participant,
    });
  });

  // 5. Staff Snack QR Code Redemption (동아리 폰으로 개인 QR 코드 스캔 및 사용 완료 처리)
  app.post('/api/snack/redeem', (req, res) => {
    let { participantId, qrData } = req.body;

    // Parse if raw QR data was passed (e.g. KFC-SNACK:participant_A82F91 or JSON)
    if (qrData) {
      const trimmed = String(qrData).trim();
      if (trimmed.startsWith('KFC-SNACK:')) {
        participantId = trimmed.replace('KFC-SNACK:', '').trim();
      } else if (trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed.participantId) participantId = parsed.participantId;
        } catch {
          // ignore
        }
      } else {
        participantId = trimmed;
      }
    }

    if (!participantId) {
      return res.status(400).json({
        success: false,
        message: '참가자 정보를 찾을 수 없습니다.',
      });
    }

    const participant = participants.find((p) => p.id === participantId);

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: `등록되지 않은 참가자 ID입니다. (${participantId})`,
      });
    }

    const activeBooths = booths.filter((b) => b.active);
    const activeCompleted = activeBooths.filter((b) => participant.completedBooths.includes(b.id));

    if (activeCompleted.length < activeBooths.length || !participant.isCompleted) {
      return res.json({
        success: false,
        isIncomplete: true,
        message: `아직 모든 부스 미션을 완료하지 않았습니다. (${activeCompleted.length}/${activeBooths.length} 완료)`,
        participant,
      });
    }

    // Check if already claimed
    if (participant.snackClaimed) {
      const claimDate = participant.snackClaimedAt
        ? new Date(participant.snackClaimedAt).toLocaleTimeString('ko-KR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })
        : '이전';
      return res.json({
        success: false,
        alreadyClaimed: true,
        claimedAtStr: claimDate,
        claimedAt: participant.snackClaimedAt,
        message: `⚠️ 이미 [${claimDate}]에 간식 수령이 완료된 교환권입니다! (중복 수령 방지)`,
        participant,
      });
    }

    // Mark as Claimed / Redeemed
    participant.snackClaimed = true;
    participant.snackClaimedAt = Date.now();
    participant.lastActiveAt = Date.now();

    saveDatabase();
    broadcastFullState();

    const formattedTime = new Date(participant.snackClaimedAt).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    return res.json({
      success: true,
      alreadyClaimed: false,
      message: `🎉 [${participant.id.replace('participant_', 'ID: ')}] 간식 지급 완료 처리되었습니다! (${formattedTime})`,
      participant,
    });
  });

  // 6. Manual Toggle Snack Claimed from Admin Table
  app.post('/api/participants/:id/toggle-snack', (req, res) => {
    const { id } = req.params;
    const participant = participants.find((p) => p.id === id);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    participant.snackClaimed = !participant.snackClaimed;
    participant.snackClaimedAt = participant.snackClaimed ? Date.now() : null;
    participant.lastActiveAt = Date.now();

    saveDatabase();
    broadcastFullState();

    res.json({ success: true, participant });
  });

  // 7. Reset single participant
  app.post('/api/participants/:id/reset', (req, res) => {
    const { id } = req.params;
    const idx = participants.findIndex((p) => p.id === id);
    if (idx !== -1) {
      participants[idx] = {
        id,
        createdAt: Date.now(),
        completedBooths: [],
        progress: 0,
        isCompleted: false,
        completedAt: null,
        snackClaimed: false,
        snackClaimedAt: null,
        lastActiveAt: Date.now(),
      };
      saveDatabase();
      broadcastFullState();
    }
    res.json({ success: true });
  });

  // 8. Reset all participants
  app.post('/api/participants/reset-all', (req, res) => {
    participants = [];
    saveDatabase();
    broadcastFullState();
    res.json({ success: true });
  });

  // 9. Booths Management
  app.post('/api/booths', (req, res) => {
    const booth: Booth = req.body;
    if (!booth.id) booth.id = `booth_${Date.now()}`;
    if (!booth.qrToken) {
      booth.qrToken = `KFC-BOOTH-${generateRandomCode(5)}-${generateRandomCode(4)}`;
    }

    const idx = booths.findIndex((b) => b.id === booth.id);
    if (idx >= 0) {
      booths[idx] = booth;
    } else {
      booths.push(booth);
    }
    booths.sort((a, b) => (a.order || 0) - (b.order || 0));

    saveDatabase();
    broadcastFullState();
    res.json({ success: true, booth });
  });

  app.delete('/api/booths/:id', (req, res) => {
    const { id } = req.params;
    booths = booths.filter((b) => b.id !== id);
    saveDatabase();
    broadcastFullState();
    res.json({ success: true });
  });

  app.post('/api/booths/:id/regen-token', (req, res) => {
    const { id } = req.params;
    const booth = booths.find((b) => b.id === id);
    if (!booth) return res.status(404).json({ error: 'Booth not found' });

    const prefix = booth.name.includes('로봇') ? 'KFC-ROBOT' : booth.name.includes('AI') ? 'KFC-AI' : 'KFC-BOOTH';
    booth.qrToken = `${prefix}-${generateRandomCode(5)}-${generateRandomCode(4)}`;

    saveDatabase();
    broadcastFullState();
    res.json({ success: true, qrToken: booth.qrToken });
  });

  // 10. Settings Management
  app.post('/api/settings', (req, res) => {
    settings = { ...settings, ...req.body };
    saveDatabase();
    broadcastFullState();
    res.json({ success: true, settings });
  });

  // Vite Middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] K.F.C. Festival Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
