export type GenreId =
  | 'tout'
  | 'konpa'
  | 'raboday'
  | 'amapiano'
  | 'drill'
  | 'afrobeat'
  | 'rap-kreyol';

export interface GenreOption {
  id: GenreId;
  label: string;
  query: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  durationLabel: string;
  thumbnail: string;
  viewCount?: string;
  genre?: string;
  source?: 'youtube' | 'piped' | 'invidious' | 'web' | 'offline';
}

export interface DownloadedTrack extends Track {
  blob: Blob;
  mimeType: string;
  sizeBytes: number;
  downloadedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  tracks: Track[];
  createdAt: number;
}

export type SubscriptionStatus = 'free' | 'pending' | 'active';
export type SubscriptionPlan = 'monthly' | 'lifetime';

export interface VipCode {
  code: string;
  plan: SubscriptionPlan;
  createdAt: number;
  usedByDeviceId: string | null;
  usedByEmail: string | null;
  usedByName: string | null;
  activatedAt: number | null;
  expiresAt: number | null;
  source?: 'gift' | 'payment';
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  deviceId?: string;
  songsPlayed: number;
  subscriptionStatus: SubscriptionStatus;
  subscriptionPlan?: SubscriptionPlan;
  vipCode?: string;
  vipDeviceId?: string;
  expiresAt?: number | null;
  freeDownloadsLeft?: number;
  blocked: boolean;
  createdAt: string;
  lastActiveAt: string;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceId?: string;
  region: 'ayiti' | 'diaspora';
  phone: string;
  transactionCode: string;
  plan: SubscriptionPlan;
  amountUsd: number;
  status: 'pending' | 'approved' | 'rejected';
  generatedVipCode?: string;
  createdAt: string;
}

export interface ApiConfig {
  youtubeApiKey: string;
  rapidApiKey: string;
  rapidApiHost: string;
}

export type AppTab = 'home' | 'downloads' | 'playlist' | 'admin';

export interface DownloadProgress {
  videoId: string;
  progress: number; // 0 to 100
  status: 'fetching' | 'downloading' | 'saving' | 'done' | 'error';
  error?: string;
}
