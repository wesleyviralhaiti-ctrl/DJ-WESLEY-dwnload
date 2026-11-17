import type { GenreOption, Playlist, UserProfile } from '../types';

const USER_KEY = 'wesley_music_user_v1';
const ACCOUNTS_KEY = 'wesley_music_accounts_v1';
const DEVICE_ID_KEY = 'wesley_device_id';
const FREE_CLAIMED_DEVICES_KEY = 'wesley_free_claimed_devices';
const PLAYLISTS_KEY = 'wesley_music_playlists_v1';
const ADMIN_PASS_KEY = 'wesley_music_admin_passcode_v1';

export const GENRES: GenreOption[] = [
  { id: 'tout', label: 'Tout', query: 'Konpa Raboday Afrobeat Amapiano Rap Kreyol hits' },
  { id: 'konpa', label: 'Konpa', query: 'Konpa Haiti mizik official audio' },
  { id: 'raboday', label: 'Rabòday', query: 'Raboday Haiti mizik official audio' },
  { id: 'amapiano', label: 'Amapiano', query: 'Amapiano hits official audio' },
  { id: 'drill', label: 'Drill', query: 'Drill rap music official audio' },
  { id: 'afrobeat', label: 'Afrobeat', query: 'Afrobeat hits official audio' },
  { id: 'rap-kreyol', label: 'Rap Kreyòl', query: 'Rap Kreyol Haiti official audio' },
];

export function getOrCreateDeviceId(): string {
  try {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing && existing.length >= 8) return existing;
    const randomPart =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    const newId = `dev_${randomPart}`;
    localStorage.setItem(DEVICE_ID_KEY, newId);
    return newId;
  } catch {
    return `dev_${Date.now().toString(36)}`;
  }
}

export function loadFreeClaimedDevices(): string[] {
  try {
    const raw = localStorage.getItem(FREE_CLAIMED_DEVICES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isDeviceFreeDownloadClaimed(deviceId: string): boolean {
  if (!deviceId) return false;
  return loadFreeClaimedDevices().includes(deviceId);
}

export function markDeviceFreeDownloadClaimed(deviceId: string): void {
  if (!deviceId) return;
  try {
    const list = loadFreeClaimedDevices();
    if (!list.includes(deviceId)) {
      list.push(deviceId);
      localStorage.setItem(FREE_CLAIMED_DEVICES_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
}

export function loadLocalUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function saveLocalUser(user: UserProfile | null): void {
  try {
    if (!user) {
      localStorage.removeItem(USER_KEY);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export interface LocalAccountRecord {
  fullName: string;
  email: string;
  password: string;
  profile: UserProfile;
}

export function loadLocalAccounts(): LocalAccountRecord[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalAccountRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(account: LocalAccountRecord): void {
  try {
    const existing = loadLocalAccounts();
    const idx = existing.findIndex(
      (a) => a.email.toLowerCase() === account.email.toLowerCase()
    );
    if (idx >= 0) {
      existing[idx] = account;
    } else {
      existing.unshift(account);
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(existing));
  } catch {
    // Ignore
  }
}

export function loadPlaylists(): Playlist[] {
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Playlist[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  const starter: Playlist[] = [
    {
      id: 'pl_konpa_favorites',
      name: 'Konpa Vibes',
      description: 'Pi bon mizik Konpa mwen yo',
      tracks: [],
      createdAt: Date.now(),
    },
    {
      id: 'pl_raboday_party',
      name: 'Rabòday Mix',
      description: 'Chofe lari a ak Rabòday',
      tracks: [],
      createdAt: Date.now() - 1000,
    },
  ];
  savePlaylists(starter);
  return starter;
}

export function savePlaylists(playlists: Playlist[]): void {
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  } catch {
    // Ignore
  }
}

export function loadAdminPasscode(): string | null {
  try {
    return localStorage.getItem(ADMIN_PASS_KEY);
  } catch {
    return null;
  }
}

export function saveAdminPasscode(passcode: string | null): void {
  try {
    if (!passcode) {
      localStorage.removeItem(ADMIN_PASS_KEY);
    } else {
      localStorage.setItem(ADMIN_PASS_KEY, passcode);
    }
  } catch {
    // Ignore
  }
}
