export type EchoType = 'history' | 'whisper' | 'shout' | 'quest';

export interface ColabContribution {
  id: string;
  author: string;
  text: string;
  year?: number;
  imageUrl?: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  verifiedLocal?: boolean;
}

export interface EchoItem {
  id: string;
  title: string;
  type: EchoType;
  year?: number;
  eraLabel?: string;
  lat: number;
  lng: number;
  author: string;
  distanceThresholdMeters: number;
  summary: string;
  fullStory: string;
  thenImageUrl?: string;
  nowImageUrl?: string;
  audioDuration?: string;
  audioTranscript?: string;
  soundType?: 'ambient-water' | 'city-echo' | 'vintage-radio' | 'whisper-voice' | 'pioneer-wind';
  tags: string[];
  resonanceScore: number;
  isLockedWhisper?: boolean;
  passcodeHint?: string;
  secretPasscode?: string;
  
  // Whisper Engine: Private encrypted pin fields
  isPrivateWhisper?: boolean;
  encryptedPayload?: string;
  encryptionIv?: string;
  encryptionSalt?: string;
  inviteToken?: string;
  inviteRecipient?: string;
  
  // Colab Engine: Community contributions & collaborative thread
  contributions?: ColabContribution[];
  upvotes?: number;
  downvotes?: number;

  questStep?: number;
  questTotal?: number;
  mapsUri?: string;
  verifiedLocal?: boolean;
  zone: string;
  createdAt: string;
}

export interface ZoneNotificationState {
  zoneName: string;
  count: number;
  lastNotified: number;
}

export interface ProximityAlert {
  id: string;
  zone: string;
  whispersCount: number;
  shoutsCount: number;
  historyCount: number;
  nearestEcho: EchoItem;
  distanceFeet: number;
  notificationNumber: number;
  maxCap: number;
}

export interface WhisperInviteParams {
  echoId: string;
  key: string;
  sender: string;
  recipient?: string;
}
