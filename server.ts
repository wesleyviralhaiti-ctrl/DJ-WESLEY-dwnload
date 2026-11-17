import express from 'express';
import fs from 'fs';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { filterBuiltInCatalog, getCatalogByGenre } from './src/lib/catalog.ts';
import type { GenreId } from './src/types.ts';

dotenv.config();

const PORT = 3000;
const ADMIN_PASSCODE = 'WESLEY2026#';
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'wesley_store.json');

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

interface StoreUser {
  id: string;
  fullName: string;
  email: string;
  password?: string;
  deviceId?: string;
  songsPlayed: number;
  subscriptionStatus: 'free' | 'pending' | 'active';
  subscriptionPlan?: 'monthly' | 'lifetime';
  vipCode?: string;
  vipDeviceId?: string;
  expiresAt?: number | null;
  freeDownloadsLeft?: number;
  blocked: boolean;
  createdAt: string;
  lastActiveAt: string;
}

interface StorePayment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  deviceId?: string;
  region: 'ayiti' | 'diaspora';
  phone: string;
  transactionCode: string;
  plan: 'monthly' | 'lifetime';
  amountUsd: number;
  status: 'pending' | 'approved' | 'rejected';
  generatedVipCode?: string;
  createdAt: string;
}

interface StoreVipCode {
  code: string;
  plan: 'monthly' | 'lifetime';
  createdAt: number;
  usedByDeviceId: string | null;
  usedByEmail: string | null;
  usedByName: string | null;
  activatedAt: number | null;
  expiresAt: number | null;
  source?: 'gift' | 'payment';
}

interface StoreData {
  users: StoreUser[];
  payments: StorePayment[];
  vipCodes: StoreVipCode[];
  freeClaimedDevices: string[];
  config: {
    youtubeApiKey: string;
    rapidApiKey: string;
    rapidApiHost: string;
  };
}

const DEFAULT_CONFIG = {
  youtubeApiKey: process.env.YOUTUBE_API_KEY || 'AIzaSyCucl4Ir00AEJI_m5Twwq7rMQCX6unEv48',
  rapidApiKey: process.env.RAPIDAPI_KEY || '30c40ab864msh9428c5c6f9cd562p1ba935jsn0ead7f63b1c3',
  rapidApiHost: process.env.RAPIDAPI_HOST || 'youtube-mp36.p.rapidapi.com',
};

function createDefaultVipCodes(): StoreVipCode[] {
  const now = Date.now();
  return [
    { code: 'WES-1001', plan: 'monthly', createdAt: now, usedByDeviceId: null, usedByEmail: null, usedByName: null, activatedAt: null, expiresAt: null, source: 'gift' },
    { code: 'WES-1002', plan: 'monthly', createdAt: now, usedByDeviceId: null, usedByEmail: null, usedByName: null, activatedAt: null, expiresAt: null, source: 'gift' },
    { code: 'WES-1003', plan: 'monthly', createdAt: now, usedByDeviceId: null, usedByEmail: null, usedByName: null, activatedAt: null, expiresAt: null, source: 'gift' },
    { code: 'WES-1004', plan: 'monthly', createdAt: now, usedByDeviceId: null, usedByEmail: null, usedByName: null, activatedAt: null, expiresAt: null, source: 'gift' },
    { code: 'WES-1005', plan: 'lifetime', createdAt: now, usedByDeviceId: null, usedByEmail: null, usedByName: null, activatedAt: null, expiresAt: null, source: 'gift' },
  ];
}

function readStore(): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      const initial: StoreData = {
        users: [],
        payments: [],
        vipCodes: createDefaultVipCodes(),
        freeClaimedDevices: [],
        config: { ...DEFAULT_CONFIG },
      };
      fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 2));
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<StoreData>;
    const existingCodes = Array.isArray(parsed.vipCodes) && parsed.vipCodes.length > 0
      ? parsed.vipCodes
      : createDefaultVipCodes();
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      payments: Array.isArray(parsed.payments) ? parsed.payments : [],
      vipCodes: existingCodes,
      freeClaimedDevices: Array.isArray(parsed.freeClaimedDevices) ? parsed.freeClaimedDevices : [],
      config: {
        youtubeApiKey: parsed.config?.youtubeApiKey?.trim() || DEFAULT_CONFIG.youtubeApiKey,
        rapidApiKey: parsed.config?.rapidApiKey?.trim() || DEFAULT_CONFIG.rapidApiKey,
        rapidApiHost:
          parsed.config?.rapidApiHost?.trim() &&
          parsed.config.rapidApiHost.trim() !== 'rapidapi.com' &&
          parsed.config.rapidApiHost.trim() !== '://rapidapi.com'
            ? parsed.config.rapidApiHost.trim()
            : DEFAULT_CONFIG.rapidApiHost,
      },
    };
  } catch {
    return {
      users: [],
      payments: [],
      vipCodes: createDefaultVipCodes(),
      freeClaimedDevices: [],
      config: { ...DEFAULT_CONFIG },
    };
  }
}

function writeStore(data: StoreData): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Failed to persist store:', err);
  }
}

function sanitizeUser(user: StoreUser): Omit<StoreUser, 'password'> {
  const { password: _pw, ...rest } = user;
  return rest;
}

function enforceUserExpiration(user: StoreUser): boolean {
  if (
    user.subscriptionStatus === 'active' &&
    user.expiresAt !== null &&
    user.expiresAt !== undefined &&
    Date.now() > user.expiresAt
  ) {
    user.subscriptionStatus = 'free';
    user.subscriptionPlan = undefined;
    user.vipCode = undefined;
    user.vipDeviceId = undefined;
    user.expiresAt = null;
    return true;
  }
  return false;
}

function generateUniqueVipCode(store: StoreData): string {
  const existing = new Set(store.vipCodes.map((c) => c.code.toUpperCase()));
  for (let i = 0; i < 30; i++) {
    const num = Math.floor(2000 + Math.random() * 7999);
    const candidate = `WES-${num}`;
    if (!existing.has(candidate)) return candidate;
  }
  return `WES-${Date.now().toString().slice(-5)}`;
}

// Parse ISO 8601 duration (PT4M13S) -> seconds
function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

// Parse mm:ss or hh:mm:ss -> seconds
function parseColonDuration(text: string): number {
  const parts = text.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return parts[0] || 0;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '3:30';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${mins}:${String(secs).padStart(2, '0')}`;
}

function formatViews(raw?: string | number): string | undefined {
  if (raw === undefined || raw === null) return undefined;
  const num = typeof raw === 'number' ? raw : parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
  if (isNaN(num) || num <= 0) return undefined;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return String(num);
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

interface SearchTrackResult {
  id: string;
  title: string;
  artist: string;
  durationSeconds: number;
  durationLabel: string;
  thumbnail: string;
  viewCount?: string;
  source: 'youtube' | 'piped' | 'invidious' | 'web';
}

const MAX_TRACK_SECONDS = 720; // Filter out DJ mixtapes over 12 minutes
const MIN_TRACK_SECONDS = 45;  // Filter out tiny clips/shorts

function isLikelyMixtapeTitle(title: string): boolean {
  const lower = title.toLowerCase();
  return (
    /\b(1\s*hour|2\s*hours|3\s*hours|full\s*album|non\s*stop\s*mix|megamix|202[0-9]\s*mix)\b/.test(lower)
  );
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 8000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

let youtubeRateLimitUntil = 0;

async function searchYouTubeDataApi(
  query: string,
  apiKey: string,
  initialPageToken = ''
): Promise<{ tracks: SearchTrackResult[]; nextPageToken: string | null }> {
  if (!apiKey || Date.now() < youtubeRateLimitUntil) {
    return { tracks: [], nextPageToken: null };
  }
  const collected: SearchTrackResult[] = [];
  const seen = new Set<string>();
  let pageToken = initialPageToken;
  let lastNextPageToken: string | null = null;

  // Fetch maxResults=25 per page; if filtering >12min yields <20 tracks, fetch one extra page
  for (let page = 0; page < 2 && collected.length < 22; page++) {
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
    searchUrl.searchParams.set('part', 'snippet');
    searchUrl.searchParams.set('type', 'video');
    searchUrl.searchParams.set('videoCategoryId', '10'); // Music
    searchUrl.searchParams.set('maxResults', '25');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('key', apiKey);
    if (pageToken) searchUrl.searchParams.set('pageToken', pageToken);

    const searchRes = await fetchWithTimeout(searchUrl.toString(), {}, 6000);
    if (!searchRes.ok) {
      if (searchRes.status === 429 || searchRes.status === 403) {
        // Back off YouTube Data API v3 for 10 minutes on quota/rate limit
        youtubeRateLimitUntil = Date.now() + 10 * 60 * 1000;
      }
      return { tracks: collected, nextPageToken: null };
    }
    const searchJson = (await searchRes.json()) as {
      nextPageToken?: string;
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
        };
      }>;
    };

    lastNextPageToken = searchJson.nextPageToken || null;
    const items = searchJson.items || [];
    const ids = items.map((i) => i.id?.videoId).filter((id): id is string => Boolean(id));
    if (ids.length === 0) break;

    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails,statistics');
    detailsUrl.searchParams.set('id', ids.join(','));
    detailsUrl.searchParams.set('key', apiKey);

    const detailsRes = await fetchWithTimeout(detailsUrl.toString(), {}, 8000);
    const detailsMap = new Map<string, { duration: number; views?: string }>();
    if (detailsRes.ok) {
      const detailsJson = (await detailsRes.json()) as {
        items?: Array<{
          id?: string;
          contentDetails?: { duration?: string };
          statistics?: { viewCount?: string };
        }>;
      };
      for (const d of detailsJson.items || []) {
        if (d.id) {
          detailsMap.set(d.id, {
            duration: parseIsoDuration(d.contentDetails?.duration || ''),
            views: formatViews(d.statistics?.viewCount),
          });
        }
      }
    }

    for (const item of items) {
      const vid = item.id?.videoId;
      if (!vid || seen.has(vid)) continue;
      const title = decodeHtmlEntities(item.snippet?.title || 'Untitled Track');
      const artist = decodeHtmlEntities(item.snippet?.channelTitle || 'Unknown Artist').replace(/\s*-\s*Topic$/i, '');
      const details = detailsMap.get(vid);
      const durationSeconds = details?.duration ?? 210;

      if (durationSeconds > MAX_TRACK_SECONDS || durationSeconds < MIN_TRACK_SECONDS) continue;
      if (isLikelyMixtapeTitle(title) && durationSeconds > 480) continue;

      seen.add(vid);
      collected.push({
        id: vid,
        title,
        artist,
        durationSeconds,
        durationLabel: formatDuration(durationSeconds),
        thumbnail:
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        viewCount: details?.views,
        source: 'youtube',
      });
    }

    if (!lastNextPageToken) break;
    pageToken = lastNextPageToken;
  }

  return { tracks: collected, nextPageToken: lastNextPageToken };
}

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
  'https://api.piped.private.coffee',
];

const INVIDIOUS_INSTANCES = [
  'https://inv.nadeko.net',
  'https://yewtu.be',
  'https://invidious.nerdvpn.de',
];

async function searchSinglePipedInstance(base: string, query: string): Promise<SearchTrackResult[]> {
  const collected: SearchTrackResult[] = [];
  const seen = new Set<string>();
  let nextpage: string | null = null;

  for (let page = 0; page < 2 && collected.length < 36; page++) {
    const url = nextpage
      ? `${base}/nextpage/search?q=${encodeURIComponent(query)}&filter=music_songs&nextpage=${encodeURIComponent(nextpage)}`
      : `${base}/search?q=${encodeURIComponent(query)}&filter=music_songs`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 4000);
    if (!res.ok) break;
    const json = (await res.json()) as {
      items?: Array<{
        url?: string;
        title?: string;
        uploaderName?: string;
        duration?: number;
        thumbnail?: string;
        views?: number;
      }>;
      nextpage?: string | null;
    };
    for (const item of json.items || []) {
      const match = item.url?.match(/[?&]v=([^&]+)/);
      const vid = match?.[1];
      if (!vid || seen.has(vid)) continue;
      const dur = item.duration || 0;
      if (dur > MAX_TRACK_SECONDS || dur < MIN_TRACK_SECONDS) continue;
      const title = item.title || 'Untitled Track';
      if (isLikelyMixtapeTitle(title) && dur > 480) continue;
      seen.add(vid);
      collected.push({
        id: vid,
        title,
        artist: (item.uploaderName || 'Unknown Artist').replace(/\s*-\s*Topic$/i, ''),
        durationSeconds: dur,
        durationLabel: formatDuration(dur),
        thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        viewCount: formatViews(item.views),
        source: 'piped',
      });
    }
    nextpage = json.nextpage || null;
    if (!nextpage) break;
  }

  if (collected.length === 0) throw new Error('Empty Piped response');
  return collected;
}

async function searchPipedApi(query: string): Promise<SearchTrackResult[]> {
  try {
    return await Promise.any(PIPED_INSTANCES.map((base) => searchSinglePipedInstance(base, query)));
  } catch {
    return [];
  }
}

async function searchSingleInvidiousInstance(base: string, query: string): Promise<SearchTrackResult[]> {
  const collected: SearchTrackResult[] = [];
  const seen = new Set<string>();
  for (let page = 1; page <= 2 && collected.length < 36; page++) {
    const url = `${base}/api/v1/search?q=${encodeURIComponent(query)}&type=video&page=${page}`;
    const res = await fetchWithTimeout(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, 4000);
    if (!res.ok) break;
    const arr = (await res.json()) as Array<{
      videoId?: string;
      title?: string;
      author?: string;
      lengthSeconds?: number;
      viewCount?: number;
    }>;
    if (!Array.isArray(arr) || arr.length === 0) break;
    for (const item of arr) {
      const vid = item.videoId;
      if (!vid || seen.has(vid)) continue;
      const dur = item.lengthSeconds || 0;
      if (dur > MAX_TRACK_SECONDS || dur < MIN_TRACK_SECONDS) continue;
      const title = item.title || 'Untitled Track';
      if (isLikelyMixtapeTitle(title) && dur > 480) continue;
      seen.add(vid);
      collected.push({
        id: vid,
        title,
        artist: (item.author || 'Unknown Artist').replace(/\s*-\s*Topic$/i, ''),
        durationSeconds: dur,
        durationLabel: formatDuration(dur),
        thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
        viewCount: formatViews(item.viewCount),
        source: 'invidious',
      });
    }
  }
  if (collected.length === 0) throw new Error('Empty Invidious response');
  return collected;
}

async function searchInvidiousApi(query: string): Promise<SearchTrackResult[]> {
  try {
    return await Promise.any(INVIDIOUS_INSTANCES.map((base) => searchSingleInvidiousInstance(base, query)));
  } catch {
    return [];
  }
}

async function searchYouTubeWebHtml(query: string): Promise<SearchTrackResult[]> {
  try {
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const res = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      8000
    );
    if (!res.ok) return [];
    const html = await res.text();
    const marker = 'var ytInitialData = ';
    const startIdx = html.indexOf(marker);
    if (startIdx === -1) return [];
    const jsonStart = startIdx + marker.length;
    const endIdx = html.indexOf(';</script>', jsonStart);
    if (endIdx === -1) return [];
    const data = JSON.parse(html.slice(jsonStart, endIdx));

    const results: SearchTrackResult[] = [];
    const seen = new Set<string>();

    function walk(node: unknown) {
      if (!node || typeof node !== 'object') return;
      if (Array.isArray(node)) {
        for (const item of node) walk(item);
        return;
      }
      const obj = node as Record<string, unknown>;
      if (obj.videoRenderer && typeof obj.videoRenderer === 'object') {
        const vr = obj.videoRenderer as {
          videoId?: string;
          title?: { runs?: Array<{ text?: string }> };
          ownerText?: { runs?: Array<{ text?: string }> };
          longBylineText?: { runs?: Array<{ text?: string }> };
          lengthText?: { simpleText?: string };
          shortViewCountText?: { simpleText?: string };
        };
        const vid = vr.videoId;
        if (vid && !seen.has(vid)) {
          const durText = vr.lengthText?.simpleText || '';
          const durSec = durText ? parseColonDuration(durText) : 0;
          const title = vr.title?.runs?.map((r) => r.text).join('') || 'Untitled Track';
          const artist =
            vr.ownerText?.runs?.map((r) => r.text).join('') ||
            vr.longBylineText?.runs?.map((r) => r.text).join('') ||
            'Unknown Artist';
          if (durSec >= MIN_TRACK_SECONDS && durSec <= MAX_TRACK_SECONDS && !(isLikelyMixtapeTitle(title) && durSec > 480)) {
            seen.add(vid);
            results.push({
              id: vid,
              title,
              artist: artist.replace(/\s*-\s*Topic$/i, ''),
              durationSeconds: durSec,
              durationLabel: durText || formatDuration(durSec),
              thumbnail: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
              viewCount: vr.shortViewCountText?.simpleText?.replace(/\s*views?/i, ''),
              source: 'web',
            });
          }
        }
      }
      for (const val of Object.values(obj)) {
        walk(val);
      }
    }

    walk(data);
    return results;
  } catch {
    return [];
  }
}

async function resolveAudioStreamUrl(videoId: string): Promise<{ url: string; mimeType: string } | null> {
  // Try Piped streams
  for (const base of PIPED_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`${base}/streams/${encodeURIComponent(videoId)}`, {}, 5500);
      if (!res.ok) continue;
      const json = (await res.json()) as {
        audioStreams?: Array<{ url?: string; mimeType?: string; bitrate?: number }>;
      };
      const streams = (json.audioStreams || []).filter((s) => Boolean(s.url));
      if (streams.length > 0) {
        // Prefer m4a/mp4 audio for broad iOS + Chrome <audio> compatibility, highest reasonable bitrate
        streams.sort((a, b) => {
          const aMp4 = (a.mimeType || '').includes('mp4') ? 1 : 0;
          const bMp4 = (b.mimeType || '').includes('mp4') ? 1 : 0;
          if (aMp4 !== bMp4) return bMp4 - aMp4;
          return (b.bitrate || 0) - (a.bitrate || 0);
        });
        return {
          url: streams[0].url!,
          mimeType: streams[0].mimeType || 'audio/mp4',
        };
      }
    } catch {
      // Next instance
    }
  }

  // Try Invidious streams
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetchWithTimeout(`${base}/api/v1/videos/${encodeURIComponent(videoId)}`, {}, 5500);
      if (!res.ok) continue;
      const json = (await res.json()) as {
        adaptiveFormats?: Array<{ url?: string; type?: string; bitrate?: string }>;
      };
      const audioFormats = (json.adaptiveFormats || []).filter(
        (f) => f.url && (f.type || '').startsWith('audio/')
      );
      if (audioFormats.length > 0) {
        audioFormats.sort((a, b) => {
          const aMp4 = (a.type || '').includes('mp4') ? 1 : 0;
          const bMp4 = (b.type || '').includes('mp4') ? 1 : 0;
          if (aMp4 !== bMp4) return bMp4 - aMp4;
          return parseInt(b.bitrate || '0', 10) - parseInt(a.bitrate || '0', 10);
        });
        return {
          url: audioFormats[0].url!,
          mimeType: audioFormats[0].type?.split(';')[0] || 'audio/mp4',
        };
      }
    } catch {
      // Next instance
    }
  }

  return null;
}

async function resolveRapidApiMp3(
  videoId: string,
  rapidApiKey: string,
  rapidApiHost: string
): Promise<{ link: string; hostHeader: string; filesize?: number } | null> {
  if (!rapidApiKey) return null;
  let host = rapidApiHost.replace(/^https?:\/\//, '').replace(/^:\/\//, '').trim();
  if (!host || host === 'rapidapi.com') {
    host = 'youtube-mp36.p.rapidapi.com';
  }

  const candidateEndpoints = [
    { url: `https://${host}/dl?id=${encodeURIComponent(videoId)}`, hostHeader: host },
  ];
  if (host !== 'youtube-mp36.p.rapidapi.com') {
    candidateEndpoints.push({
      url: `https://youtube-mp36.p.rapidapi.com/dl?id=${encodeURIComponent(videoId)}`,
      hostHeader: 'youtube-mp36.p.rapidapi.com',
    });
  }

  for (const ep of candidateEndpoints) {
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const res = await fetchWithTimeout(
          ep.url,
          {
            method: 'GET',
            headers: {
              'x-rapidapi-key': rapidApiKey,
              'x-rapidapi-host': ep.hostHeader,
            },
          },
          10000
        );
        if (!res.ok) break;
        const json = (await res.json()) as {
          status?: string;
          link?: string;
          url?: string;
          dlink?: string;
          filesize?: number;
        };
        const link = json.link || json.url || json.dlink;
        if ((json.status === 'ok' || !json.status) && link && link.startsWith('http')) {
          return { link, hostHeader: ep.hostHeader, filesize: json.filesize };
        }
        if (json.status === 'processing') {
          await new Promise((r) => setTimeout(r, 2500));
          continue;
        }
        if (link && link.startsWith('http')) {
          return { link, hostHeader: ep.hostHeader, filesize: json.filesize };
        }
        break;
      } catch {
        break;
      }
    }
  }
  return null;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Simple in-memory cache for search queries (5 min TTL)
  const searchCache = new Map<
    string,
    { ts: number; tracks: SearchTrackResult[]; nextPageToken: string | null }
  >();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  const FALLBACK_QUERY_MODIFIERS = [
    '',
    'official audio',
    'hits 2025 2026',
    'music video',
    'live session',
    'new song',
    'remix',
    'acoustic',
    'best songs',
    'trending',
  ];

  // Search tracks with YouTube Data API v3 first, then parallel Piped/Invidious/Web & built-in catalog fallback
  app.get('/api/search', async (req, res) => {
    const q = String(req.query.q || '').trim() || 'Konpa Haiti hits official audio';
    const rawGenre = String(req.query.genre || '').trim() as GenreId | '';
    const genreParam: GenreId | undefined = rawGenre || undefined;
    const rawPageToken = String(req.query.pageToken || '').trim();
    const cacheKey = `${q.toLowerCase()}::${genreParam || ''}::${rawPageToken}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < 5 * 60 * 1000 && cached.tracks.length > 0) {
      return res.json({
        tracks: cached.tracks,
        nextPageToken: cached.nextPageToken,
        hasMore: Boolean(cached.nextPageToken),
        source: 'cache',
      });
    }

    const store = readStore();
    const youtubeApiKey = store.config.youtubeApiKey;
    const merged: SearchTrackResult[] = [];
    const seen = new Set<string>();
    let nextPageToken: string | null = null;

    const addTracks = (list: SearchTrackResult[]) => {
      for (const t of list) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          merged.push(t);
        }
      }
    };

    const isFallbackToken = rawPageToken.startsWith('fb_page:');
    const fallbackPageNum = isFallbackToken ? parseInt(rawPageToken.replace('fb_page:', ''), 10) || 1 : 0;

    if (!isFallbackToken) {
      try {
        const ytResult = await searchYouTubeDataApi(q, youtubeApiKey, rawPageToken);
        addTracks(ytResult.tracks);
        nextPageToken = ytResult.nextPageToken;
      } catch {
        // Silently fall back to Invidious / Piped / YouTube web & built-in catalog
      }
    }

    // If YouTube API failed/quota-exceeded or returned few results, race Piped/Invidious/Web in parallel
    if (merged.length < 22) {
      const modIdx = fallbackPageNum % FALLBACK_QUERY_MODIFIERS.length;
      const mod = FALLBACK_QUERY_MODIFIERS[modIdx];
      const effectiveQuery = mod ? `${q} ${mod}` : q;

      const [pipedRes, invRes, webRes] = await Promise.allSettled([
        searchPipedApi(effectiveQuery),
        searchInvidiousApi(effectiveQuery),
        searchYouTubeWebHtml(effectiveQuery),
      ]);

      if (pipedRes.status === 'fulfilled') addTracks(pipedRes.value);
      if (invRes.status === 'fulfilled') addTracks(invRes.value);
      if (webRes.status === 'fulfilled') addTracks(webRes.value);

      if (!nextPageToken && fallbackPageNum < 10) {
        nextPageToken = `fb_page:${fallbackPageNum + 1}`;
      }
    }

    // Always enrich / fallback with built-in catalog on first page (or when live sources return empty)
    if (!rawPageToken) {
      const catalogMatches = filterBuiltInCatalog(q, genreParam);
      const mappedCatalog: SearchTrackResult[] = catalogMatches.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        durationSeconds: t.durationSeconds,
        durationLabel: t.durationLabel,
        thumbnail: t.thumbnail,
        viewCount: t.viewCount,
        source: 'youtube',
      }));
      addTracks(mappedCatalog);

      // If still empty (e.g. uncommon query while all external APIs are rate-limited), provide curated catalog
      if (merged.length === 0) {
        const curated = getCatalogByGenre(genreParam || 'tout').map((t) => ({
          id: t.id,
          title: t.title,
          artist: t.artist,
          durationSeconds: t.durationSeconds,
          durationLabel: t.durationLabel,
          thumbnail: t.thumbnail,
          viewCount: t.viewCount,
          source: 'youtube' as const,
        }));
        addTracks(curated);
      }
    }

    if (merged.length > 0) {
      searchCache.set(cacheKey, { ts: Date.now(), tracks: merged, nextPageToken });
    }

    res.json({
      tracks: merged,
      nextPageToken,
      hasMore: Boolean(nextPageToken) && merged.length > 0,
      total: merged.length,
    });
  });

  // Direct stream resolution for playback
  app.get('/api/stream/:videoId', async (req, res) => {
    const { videoId } = req.params;
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }
    const resolved = await resolveAudioStreamUrl(videoId);
    if (resolved) {
      return res.json({
        mode: 'audio',
        streamUrl: `/api/proxy-audio?url=${encodeURIComponent(resolved.url)}`,
        mimeType: resolved.mimeType,
      });
    }
    return res.json({ mode: 'iframe', videoId });
  });

  // Resolve MP3 download link via RapidAPI (8 retries x 2.5s on processing, with Piped/Invidious fallback)
  app.get('/api/download/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const title = String(req.query.title || 'wesley-music-track');
    if (!videoId || !/^[a-zA-Z0-9_-]{6,20}$/.test(videoId)) {
      return res.status(400).json({ error: 'Invalid video ID' });
    }

    const store = readStore();
    const rapidResult = await resolveRapidApiMp3(
      videoId,
      store.config.rapidApiKey,
      store.config.rapidApiHost
    );

    if (rapidResult) {
      const referer = `https://${rapidResult.hostHeader}/`;
      return res.json({
        directLink: rapidResult.link,
        downloadUrl: `/api/proxy-audio?url=${encodeURIComponent(rapidResult.link)}&referer=${encodeURIComponent(referer)}&filename=${encodeURIComponent(title)}`,
        filesize: rapidResult.filesize || 0,
        mimeType: 'audio/mpeg',
        source: 'rapidapi',
      });
    }

    // Fallback to direct audio stream from Piped/Invidious
    const stream = await resolveAudioStreamUrl(videoId);
    if (stream) {
      return res.json({
        directLink: stream.url,
        downloadUrl: `/api/proxy-audio?url=${encodeURIComponent(stream.url)}&filename=${encodeURIComponent(title)}`,
        filesize: 0,
        mimeType: stream.mimeType,
        source: 'stream-fallback',
      });
    }

    return res.status(502).json({ error: 'Unable to fetch MP3 download link right now.' });
  });

  // Proxy audio bytes with Referer & Content-Length for live 0%-100% client progress
  app.get('/api/proxy-audio', async (req, res) => {
    const targetUrl = String(req.query.url || '');
    const referer = String(req.query.referer || '');
    const filename = String(req.query.filename || 'track').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'track';
    if (!targetUrl.startsWith('http')) {
      return res.status(400).json({ error: 'Invalid audio URL' });
    }

    try {
      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      };
      if (referer) {
        headers['Referer'] = referer;
      } else if (targetUrl.includes('123tokyo.xyz')) {
        headers['Referer'] = 'https://youtube-mp36.p.rapidapi.com/';
      }
      if (req.headers.range) {
        headers['Range'] = String(req.headers.range);
      }

      const upstream = await fetchWithTimeout(targetUrl, { headers }, 60000);
      if (!upstream.ok && upstream.status !== 206) {
        return res.status(upstream.status).json({ error: 'Upstream audio fetch failed' });
      }

      const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
      if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        return res.status(502).json({ error: 'Upstream returned non-audio content' });
      }
      const contentLength = upstream.headers.get('content-length');
      const contentRange = upstream.headers.get('content-range');

      res.status(upstream.status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Length');
      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);
      if (req.query.filename) {
        res.setHeader('Content-Disposition', `inline; filename="${filename}.mp3"`);
      }

      if (!upstream.body) {
        const buf = Buffer.from(await upstream.arrayBuffer());
        return res.send(buf);
      }

      const reader = upstream.body.getReader();
      req.on('close', () => {
        reader.cancel().catch(() => {});
      });

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          res.write(Buffer.from(value));
        }
      }
      res.end();
    } catch (err) {
      if (!res.headersSent) {
        res.status(502).json({ error: (err as Error).message || 'Audio proxy error' });
      } else {
        res.end();
      }
    }
  });

  // User Registration & Login
  app.post('/api/users/register', (req, res) => {
    const fullName = String(req.body?.fullName || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();
    const clientDeviceClaimed = Boolean(req.body?.deviceAlreadyClaimed);

    if (!fullName || !email || !email.includes('@')) {
      return res.status(400).json({ error: 'Veuillez entrer un nom complet et une adresse e-mail valide.' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 4 caractères.' });
    }

    const store = readStore();
    const existing = store.users.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      return res.status(409).json({
        error: 'Un compte existe déjà avec cet e-mail. Veuillez utiliser l’onglet "Se connecter".',
      });
    }

    if (clientDeviceClaimed && deviceId && !store.freeClaimedDevices.includes(deviceId)) {
      store.freeClaimedDevices.push(deviceId);
    }
    const isDeviceClaimed = Boolean(
      (deviceId && store.freeClaimedDevices.includes(deviceId)) || clientDeviceClaimed
    );

    const now = new Date().toISOString();
    const user: StoreUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      fullName,
      email,
      password,
      deviceId: deviceId || undefined,
      songsPlayed: 0,
      subscriptionStatus: 'free',
      expiresAt: null,
      freeDownloadsLeft: isDeviceClaimed ? 0 : 1,
      blocked: false,
      createdAt: now,
      lastActiveAt: now,
    };
    store.users.unshift(user);
    writeStore(store);
    res.json({ user: sanitizeUser(user) });
  });

  app.post('/api/users/login', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();
    const clientDeviceClaimed = Boolean(req.body?.deviceAlreadyClaimed);

    if (!email || !password) {
      return res.status(400).json({ error: 'Veuillez entrer votre e-mail et votre mot de passe.' });
    }

    const store = readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      return res.status(404).json({ error: 'Aucun compte trouvé avec cet e-mail.' });
    }
    if (user.password && user.password !== password) {
      return res.status(401).json({ error: 'Mot de passe incorrect.' });
    }

    if (deviceId) user.deviceId = deviceId;
    if (clientDeviceClaimed && deviceId && !store.freeClaimedDevices.includes(deviceId)) {
      store.freeClaimedDevices.push(deviceId);
    }
    const isDeviceClaimed = Boolean(
      (deviceId && store.freeClaimedDevices.includes(deviceId)) || clientDeviceClaimed
    );
    if (isDeviceClaimed) {
      user.freeDownloadsLeft = 0;
    } else if (typeof user.freeDownloadsLeft !== 'number') {
      user.freeDownloadsLeft = 1;
    }

    user.lastActiveAt = new Date().toISOString();
    enforceUserExpiration(user);
    writeStore(store);
    res.json({ user: sanitizeUser(user) });
  });

  app.get('/api/users/me', (req, res) => {
    const email = String(req.query.email || '').trim().toLowerCase();
    const deviceId = String(req.query.deviceId || '').trim();
    if (!email) return res.status(400).json({ error: 'Email required' });
    const store = readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const expired = enforceUserExpiration(user);
    let mutated = expired;
    if (deviceId && user.deviceId !== deviceId) {
      user.deviceId = deviceId;
      mutated = true;
    }
    const isDeviceClaimed = Boolean(deviceId && store.freeClaimedDevices.includes(deviceId));
    if (isDeviceClaimed && user.freeDownloadsLeft !== 0) {
      user.freeDownloadsLeft = 0;
      mutated = true;
    } else if (typeof user.freeDownloadsLeft !== 'number') {
      user.freeDownloadsLeft = isDeviceClaimed ? 0 : 1;
      mutated = true;
    }

    if (mutated) {
      writeStore(store);
    }
    res.json({ user: sanitizeUser(user), expired });
  });

  app.post('/api/users/claim-free-download', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const deviceId = String(req.body?.deviceId || '').trim();
    const store = readStore();

    if (deviceId && !store.freeClaimedDevices.includes(deviceId)) {
      store.freeClaimedDevices.push(deviceId);
    }
    const user = email ? store.users.find((u) => u.email.toLowerCase() === email) : undefined;
    if (user) {
      user.freeDownloadsLeft = 0;
      user.lastActiveAt = new Date().toISOString();
    }
    writeStore(store);
    res.json({
      ok: true,
      freeClaimed: true,
      user: user ? sanitizeUser(user) : undefined,
    });
  });

  app.post('/api/users/track-play', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!email) return res.json({ ok: true });
    const store = readStore();
    const user = store.users.find((u) => u.email.toLowerCase() === email);
    if (user) {
      user.songsPlayed = (user.songsPlayed || 0) + 1;
      user.lastActiveAt = new Date().toISOString();
      writeStore(store);
    }
    res.json({ ok: true, user: user ? sanitizeUser(user) : undefined });
  });

  // Strict Single-Device VIP Code Activation
  app.post('/api/vip/activate', (req, res) => {
    const rawCode = String(req.body?.code || '').trim().toUpperCase();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const fullName = String(req.body?.fullName || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();

    if (!rawCode) {
      return res.status(400).json({ error: 'Veuillez entrer un code VIP.' });
    }
    if (!deviceId) {
      return res.status(400).json({ error: 'Identifiant appareil manquant.' });
    }

    const store = readStore();
    const vip = store.vipCodes.find((c) => c.code.toUpperCase() === rawCode);
    if (!vip) {
      return res.status(404).json({ error: 'Code VIP invalide ou introuvable.' });
    }

    // Strict Single-Device Lock Check
    if (vip.usedByDeviceId && vip.usedByDeviceId !== deviceId) {
      return res.status(403).json({
        error: '⛔ Ce code VIP a déjà été utilisé sur un autre téléphone. Veuillez acheter un nouveau code VIP.',
      });
    }

    // Check expiration if already activated
    if (vip.expiresAt && Date.now() > vip.expiresAt) {
      return res.status(403).json({
        error: '⛔ Ce code VIP a expiré. Veuillez renouveler via Natcash +509 56568810.',
      });
    }

    const now = Date.now();
    if (!vip.usedByDeviceId) {
      vip.usedByDeviceId = deviceId;
      vip.usedByEmail = email || vip.usedByEmail;
      vip.usedByName = fullName || vip.usedByName;
      vip.activatedAt = now;
      vip.expiresAt = vip.plan === 'lifetime' ? null : now + THIRTY_DAYS_MS;
    }

    let user = store.users.find((u) => u.email.toLowerCase() === email);
    if (!user && email) {
      user = {
        id: `usr_${Date.now()}`,
        fullName: fullName || email.split('@')[0],
        email,
        deviceId,
        songsPlayed: 0,
        subscriptionStatus: 'active',
        subscriptionPlan: vip.plan,
        vipCode: vip.code,
        vipDeviceId: deviceId,
        expiresAt: vip.expiresAt,
        blocked: false,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      store.users.unshift(user);
    } else if (user) {
      user.subscriptionStatus = 'active';
      user.subscriptionPlan = vip.plan;
      user.vipCode = vip.code;
      user.vipDeviceId = deviceId;
      user.deviceId = deviceId;
      user.expiresAt = vip.expiresAt;
      user.lastActiveAt = new Date().toISOString();
    }

    writeStore(store);
    res.json({
      message: '🎉 KAPBOUM ! Votre accès VIP est activé sur cet appareil !',
      vipCode: vip,
      user: user ? sanitizeUser(user) : undefined,
    });
  });

  // Natcash Payment Submission
  app.post('/api/payments', (req, res) => {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const userName = String(req.body?.fullName || '').trim();
    const deviceId = String(req.body?.deviceId || '').trim();
    const region = req.body?.region === 'diaspora' ? 'diaspora' : 'ayiti';
    const phone = String(req.body?.phone || '').trim();
    const transactionCode = String(req.body?.transactionCode || '').trim();
    const plan = req.body?.plan === 'lifetime' ? 'lifetime' : 'monthly';
    const amountUsd = plan === 'lifetime' ? 150 : 20;

    if (!email || !phone || !transactionCode) {
      return res.status(400).json({ error: 'Ranpli nimewo telefòn ak kòd tranzaksyon an.' });
    }

    const store = readStore();
    let user = store.users.find((u) => u.email.toLowerCase() === email);
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        fullName: userName || email.split('@')[0],
        email,
        deviceId: deviceId || undefined,
        songsPlayed: 0,
        subscriptionStatus: 'pending',
        subscriptionPlan: plan,
        blocked: false,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
      };
      store.users.unshift(user);
    } else if (user.subscriptionStatus !== 'active') {
      user.subscriptionStatus = 'pending';
      user.subscriptionPlan = plan;
      if (deviceId) user.deviceId = deviceId;
    }

    const payment: StorePayment = {
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      userId: user.id,
      userName: user.fullName,
      userEmail: user.email,
      deviceId: deviceId || user.deviceId,
      region,
      phone,
      transactionCode,
      plan,
      amountUsd,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    store.payments.unshift(payment);
    writeStore(store);
    res.json({ payment, user: sanitizeUser(user) });
  });

  const isValidAdminPasscode = (raw: unknown): boolean =>
    String(raw ?? '').trim().toUpperCase() === ADMIN_PASSCODE;

  // Admin Middleware check
  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const passcode = String(req.headers['x-admin-passcode'] || '');
    if (!isValidAdminPasscode(passcode)) {
      return res.status(401).json({ error: 'Kòd Admin pa kòrèk.' });
    }
    next();
  };

  app.post('/api/admin/verify', (req, res) => {
    const passcode = String(req.body?.passcode || '');
    if (isValidAdminPasscode(passcode)) {
      return res.json({ verified: true, passcode: ADMIN_PASSCODE });
    }
    return res.status(401).json({ verified: false, error: 'Kòd Admin sa a pa valid.' });
  });

  app.get('/api/admin/overview', requireAdmin, (_req, res) => {
    const store = readStore();
    let mutated = false;
    for (const u of store.users) {
      if (enforceUserExpiration(u)) mutated = true;
    }
    if (mutated) writeStore(store);

    res.json({
      users: store.users.map(sanitizeUser),
      payments: store.payments,
      vipCodes: store.vipCodes,
      config: store.config,
    });
  });

  app.post('/api/admin/user-action', requireAdmin, (req, res) => {
    const userId = String(req.body?.userId || '');
    const action = String(req.body?.action || '');
    const store = readStore();
    const user = store.users.find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = Date.now();
    if (action === 'approve_monthly' || action === 'approve_lifetime') {
      const plan = action === 'approve_lifetime' ? 'lifetime' : 'monthly';
      const expiresAt = plan === 'lifetime' ? null : now + THIRTY_DAYS_MS;
      const newCode = user.vipCode || generateUniqueVipCode(store);

      const existingCode = store.vipCodes.find((c) => c.code === newCode);
      if (!existingCode) {
        store.vipCodes.unshift({
          code: newCode,
          plan,
          createdAt: now,
          usedByDeviceId: user.deviceId || null,
          usedByEmail: user.email,
          usedByName: user.fullName,
          activatedAt: now,
          expiresAt,
          source: 'payment',
        });
      }

      user.subscriptionStatus = 'active';
      user.subscriptionPlan = plan;
      user.vipCode = newCode;
      user.vipDeviceId = user.deviceId;
      user.expiresAt = expiresAt;
    } else if (action === 'revoke') {
      user.subscriptionStatus = 'free';
      user.subscriptionPlan = undefined;
      user.vipCode = undefined;
      user.vipDeviceId = undefined;
      user.expiresAt = null;
    } else if (action === 'block') {
      user.blocked = true;
    } else if (action === 'unblock') {
      user.blocked = false;
    }

    writeStore(store);
    res.json({
      user: sanitizeUser(user),
      users: store.users.map(sanitizeUser),
      vipCodes: store.vipCodes,
    });
  });

  app.post('/api/admin/payment-action', requireAdmin, (req, res) => {
    const paymentId = String(req.body?.paymentId || '');
    const action = req.body?.action === 'approve' ? 'approved' : 'rejected';
    const store = readStore();
    const payment = store.payments.find((p) => p.id === paymentId);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    payment.status = action;
    const user = store.users.find(
      (u) => u.id === payment.userId || u.email.toLowerCase() === payment.userEmail.toLowerCase()
    );
    const now = Date.now();

    if (action === 'approved') {
      const expiresAt = payment.plan === 'lifetime' ? null : now + THIRTY_DAYS_MS;
      const generatedCode = generateUniqueVipCode(store);
      const lockedDeviceId = payment.deviceId || user?.deviceId || null;

      payment.generatedVipCode = generatedCode;
      store.vipCodes.unshift({
        code: generatedCode,
        plan: payment.plan,
        createdAt: now,
        usedByDeviceId: lockedDeviceId,
        usedByEmail: payment.userEmail,
        usedByName: payment.userName,
        activatedAt: now,
        expiresAt,
        source: 'payment',
      });

      if (user) {
        user.subscriptionStatus = 'active';
        user.subscriptionPlan = payment.plan;
        user.vipCode = generatedCode;
        user.vipDeviceId = lockedDeviceId || undefined;
        user.expiresAt = expiresAt;
      }
    } else if (user && user.subscriptionStatus === 'pending') {
      user.subscriptionStatus = 'free';
    }

    writeStore(store);
    res.json({
      payment,
      users: store.users.map(sanitizeUser),
      payments: store.payments,
      vipCodes: store.vipCodes,
    });
  });

  // Admin VIP Code Generator & Reset/Delete
  app.post('/api/admin/vip-codes', requireAdmin, (req, res) => {
    const plan = req.body?.plan === 'lifetime' ? 'lifetime' : 'monthly';
    const customCode = String(req.body?.code || '').trim().toUpperCase();
    const store = readStore();
    const code = customCode || generateUniqueVipCode(store);

    if (store.vipCodes.some((c) => c.code.toUpperCase() === code)) {
      return res.status(409).json({ error: 'Ce code VIP existe déjà.' });
    }

    const newEntry: StoreVipCode = {
      code,
      plan,
      createdAt: Date.now(),
      usedByDeviceId: null,
      usedByEmail: null,
      usedByName: null,
      activatedAt: null,
      expiresAt: null,
      source: 'gift',
    };
    store.vipCodes.unshift(newEntry);
    writeStore(store);
    res.json({ vipCode: newEntry, vipCodes: store.vipCodes });
  });

  app.post('/api/admin/vip-codes/action', requireAdmin, (req, res) => {
    const code = String(req.body?.code || '').trim().toUpperCase();
    const action = String(req.body?.action || '');
    const store = readStore();
    const idx = store.vipCodes.findIndex((c) => c.code.toUpperCase() === code);
    if (idx === -1) return res.status(404).json({ error: 'Code VIP introuvable.' });

    if (action === 'reset') {
      store.vipCodes[idx] = {
        ...store.vipCodes[idx],
        usedByDeviceId: null,
        usedByEmail: null,
        usedByName: null,
        activatedAt: null,
        expiresAt: null,
      };
    } else if (action === 'delete') {
      store.vipCodes.splice(idx, 1);
    }

    writeStore(store);
    res.json({ vipCodes: store.vipCodes });
  });

  app.put('/api/admin/config', requireAdmin, (req, res) => {
    const store = readStore();
    const { youtubeApiKey, rapidApiKey, rapidApiHost } = req.body || {};
    if (typeof youtubeApiKey === 'string' && youtubeApiKey.trim()) {
      store.config.youtubeApiKey = youtubeApiKey.trim();
    }
    if (typeof rapidApiKey === 'string' && rapidApiKey.trim()) {
      store.config.rapidApiKey = rapidApiKey.trim();
    }
    if (typeof rapidApiHost === 'string' && rapidApiHost.trim()) {
      store.config.rapidApiHost = rapidApiHost.trim();
    }
    writeStore(store);
    searchCache.clear();
    youtubeRateLimitUntil = 0;
    res.json({ config: store.config });
  });

  // Vite middleware in development, static serve in production
  if (process.env.NODE_ENV !== 'production') {
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
export function updateStyle(id, content) {
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    document.head.appendChild(style);
    sheetsMap.set(id, style);
  } else {
    style.textContent = content;
  }
}
export function removeStyle(id) {
  const style = sheetsMap.get(id);
  if (style) {
    document.head.removeChild(style);
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    decline() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url) {
  return url;
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        ws: false,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`WESLEY MUSIC DOWNLOAD server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
