export interface Booth {
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

export interface Participant {
  id: string; // participant_A82F91
  createdAt: number;
  completedBooths: string[]; // array of booth ids
  progress: number; // 0 - 100
  isCompleted: boolean;
  completedAt?: number | null;
  snackClaimed?: boolean;
  snackClaimedAt?: number | null;
  lastActiveAt?: number;
}

export interface FestivalSettings {
  title: string;
  subtitle: string;
  clubName: string;
  snackMessage: string;
  snackStationName: string;
  allowManualCode: boolean;
}

export type ScanStatus = 'idle' | 'scanning' | 'success' | 'already_completed' | 'invalid' | 'error' | 'inactive';

export interface ScanResult {
  status: ScanStatus;
  message: string;
  booth?: Booth;
  allCompleted?: boolean;
}

export interface AdminStats {
  totalParticipants: number;
  completedParticipants: number;
  inProgressParticipants: number;
  completionRate: number;
  boothStats: {
    boothId: string;
    boothName: string;
    completedCount: number;
  }[];
}
