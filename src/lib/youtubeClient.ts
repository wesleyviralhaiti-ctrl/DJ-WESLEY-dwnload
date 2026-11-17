import type { GenreId, Track } from '../types';
import { filterBuiltInCatalog, getCatalogByGenre } from './catalog';
import { getApiConfigLocal, normalizeRapidApiHost } from './clientStore';

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

const PAGINATION_QUERY_MODIFIERS = [
  '',
  'official audio',
  'remix',
  'live',
  'hits 2025',
  'nouveau',
  'top hits',
  'best of',
  'mixtape',
  '2024 hits',
  'ayiti',
  'music video',
  'club mix',
  'instrumental',
  'acoustic',
  'party mix',
];

let youtubeRateLimitUntil = 0;

export function resetYouTubeCooldown(): void {
  youtubeRateLimitUntil = 0;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseIsoDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const h = parseInt(match[1] || '0', 10);
  const m = parseInt(match[2] || '0', 10);
  const s = parseInt(match[3] || '0', 10);
  return h * 3600 + m * 60 + s;
}

function formatSeconds(sec: number): string {
  if (!sec || !isFinite(sec) || sec <= 0) return '3:30';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(raw?: string | number): string | undefined {
  const n = typeof raw === 'number' ? raw : parseInt(String(raw || '0'), 10);
  if (!n || isNaN(n)) return undefined;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs = 5000
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchPipedInstance(instance: string, query: string): Promise<Track[]> {
  const res = await fetchWithTimeout(
    `${instance}/search?q=${encodeURIComponent(query)}&filter=music_songs`,
    {},
    4000
  );
  if (!res.ok) throw new Error('Piped non-ok');
  const data = (await res.json()) as {
    items?: Array<{
      url?: string;
      title?: string;
      uploaderName?: string;
      thumbnail?: string;
      duration?: number;
      views?: number;
    }>;
  };
  const items = data.items || [];
  const tracks: Track[] = [];
  for (const item of items) {
    const match = item.url?.match(/[?&]v=([^&]+)/) || item.url?.match(/\/watch\/([^?/]+)/);
    const id = match?.[1];
    const dur = Number(item.duration || 0);
    if (!id || !item.title) continue;
    if (dur > 0 && (dur < 45 || dur >= 720)) continue;
    tracks.push({
      id,
      title: decodeHtmlEntities(item.title),
      artist: decodeHtmlEntities(item.uploaderName || 'YouTube'),
      durationSeconds: dur || 210,
      durationLabel: formatSeconds(dur || 210),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      viewCount: formatViews(item.views),
      source: 'piped',
    });
  }
  if (tracks.length === 0) throw new Error('Piped empty');
  return tracks;
}

async function searchInvidiousInstance(instance: string, query: string): Promise<Track[]> {
  const res = await fetchWithTimeout(
    `${instance}/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    {},
    4000
  );
  if (!res.ok) throw new Error('Invidious non-ok');
  const items = (await res.json()) as Array<{
    videoId?: string;
    title?: string;
    author?: string;
    lengthSeconds?: number;
    viewCount?: number;
  }>;
  if (!Array.isArray(items)) throw new Error('Invidious invalid');
  const tracks: Track[] = [];
  for (const item of items) {
    const id = item.videoId;
    const dur = Number(item.lengthSeconds || 0);
    if (!id || !item.title) continue;
    if (dur > 0 && (dur < 45 || dur >= 720)) continue;
    tracks.push({
      id,
      title: decodeHtmlEntities(item.title),
      artist: decodeHtmlEntities(item.author || 'YouTube'),
      durationSeconds: dur || 210,
      durationLabel: formatSeconds(dur || 210),
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      viewCount: formatViews(item.viewCount),
      source: 'invidious',
    });
  }
  if (tracks.length === 0) throw new Error('Invidious empty');
  return tracks;
}

async function searchFallbackNetwork(query: string): Promise<Track[]> {
  const attempts: Promise<Track[]>[] = [
    ...PIPED_INSTANCES.map((inst) => searchPipedInstance(inst, query)),
    ...INVIDIOUS_INSTANCES.map((inst) => searchInvidiousInstance(inst, query)),
  ];
  try {
    return await Promise.any(attempts);
  } catch {
    return [];
  }
}

export async function searchMusicClient(params: {
  query: string;
  genreId?: GenreId;
  pageToken?: string | null;
}): Promise<{
  tracks: Track[];
  nextPageToken: string | null;
  hasMore: boolean;
}> {
  const { query, genreId, pageToken } = params;
  const { youtubeApiKey } = getApiConfigLocal();
  const isFallbackPage = Boolean(pageToken && pageToken.startsWith('fb_page:'));
  const fbPageIndex = isFallbackPage
    ? Math.max(1, parseInt(pageToken!.replace('fb_page:', ''), 10) || 1)
    : 0;

  // 1. Direct browser call to YouTube Data API v3 (maxResults=50 + pageToken)
  if (
    youtubeApiKey &&
    !isFallbackPage &&
    Date.now() >= youtubeRateLimitUntil
  ) {
    try {
      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoCategoryId', '10');
      url.searchParams.set('maxResults', '50');
      url.searchParams.set('q', query);
      url.searchParams.set('key', youtubeApiKey);
      if (pageToken) {
        url.searchParams.set('pageToken', pageToken);
      }

      const searchRes = await fetchWithTimeout(url.toString(), {}, 6500);
      if (searchRes.status === 403 || searchRes.status === 429) {
        youtubeRateLimitUntil = Date.now() + 10 * 60 * 1000;
      } else if (searchRes.ok) {
        const searchData = (await searchRes.json()) as {
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

        const items = searchData.items || [];
        const videoIds = items
          .map((it) => it.id?.videoId)
          .filter((id): id is string => Boolean(id));

        if (videoIds.length > 0) {
          const detailsMap = new Map<
            string,
            { durationSeconds: number; viewCount?: string }
          >();

          try {
            const vidUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
            vidUrl.searchParams.set('part', 'contentDetails,statistics');
            vidUrl.searchParams.set('id', videoIds.slice(0, 50).join(','));
            vidUrl.searchParams.set('key', youtubeApiKey);

            const vidRes = await fetchWithTimeout(vidUrl.toString(), {}, 5500);
            if (vidRes.ok) {
              const vidData = (await vidRes.json()) as {
                items?: Array<{
                  id?: string;
                  contentDetails?: { duration?: string };
                  statistics?: { viewCount?: string };
                }>;
              };
              for (const v of vidData.items || []) {
                if (!v.id) continue;
                const durSec = parseIsoDuration(v.contentDetails?.duration || '');
                detailsMap.set(v.id, {
                  durationSeconds: durSec,
                  viewCount: formatViews(v.statistics?.viewCount),
                });
              }
            }
          } catch {
            // Proceed with default metadata if /videos details fail
          }

          const tracks: Track[] = [];
          for (const item of items) {
            const id = item.id?.videoId;
            const title = item.snippet?.title;
            if (!id || !title) continue;
            const detail = detailsMap.get(id);
            const dur = detail?.durationSeconds || 210;
            if (dur > 0 && (dur < 45 || dur >= 720)) continue;
            tracks.push({
              id,
              title: decodeHtmlEntities(title),
              artist: decodeHtmlEntities(item.snippet?.channelTitle || 'YouTube'),
              durationSeconds: dur,
              durationLabel: formatSeconds(dur),
              thumbnail:
                item.snippet?.thumbnails?.high?.url ||
                item.snippet?.thumbnails?.medium?.url ||
                `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              viewCount: detail?.viewCount,
              source: 'youtube',
            });
          }

          if (tracks.length > 0) {
            return {
              tracks,
              nextPageToken: searchData.nextPageToken || 'fb_page:1',
              hasMore: true,
            };
          }
        }
      }
    } catch {
      // Silently fall back to CORS-enabled public search & built-in catalog
    }
  }

  // 2. Fallback: CORS-friendly Piped/Invidious search + Built-in Catalog
  const modifier =
    PAGINATION_QUERY_MODIFIERS[fbPageIndex % PAGINATION_QUERY_MODIFIERS.length] || '';
  const variedQuery = modifier ? `${query} ${modifier}` : query;
  const networkFallback = await searchFallbackNetwork(variedQuery);

  const catalogMatches = genreId
    ? getCatalogByGenre(genreId)
    : filterBuiltInCatalog(query);
  const fullPool =
    fbPageIndex > 0
      ? getCatalogByGenre('tout')
      : catalogMatches.length > 0
      ? catalogMatches
      : getCatalogByGenre('tout');

  const combined: Track[] = [];
  const seen = new Set<string>();

  for (const t of networkFallback) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      combined.push(t);
    }
  }

  const rotatedPool =
    fbPageIndex > 0 && fullPool.length > 0
      ? [
          ...fullPool.slice((fbPageIndex * 15) % fullPool.length),
          ...fullPool.slice(0, (fbPageIndex * 15) % fullPool.length),
        ]
      : fullPool;

  for (const t of rotatedPool) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      combined.push(t);
    }
  }

  return {
    tracks: combined,
    nextPageToken: `fb_page:${fbPageIndex + 1}`,
    hasMore: true,
  };
}

async function resolveRapidApiMp3Link(videoId: string): Promise<{
  directLink: string;
  filesize?: number;
}> {
  const { rapidApiKey, rapidApiHost } = getApiConfigLocal();
  const host = normalizeRapidApiHost(rapidApiHost);
  const endpoint = `https://${host}/dl?id=${encodeURIComponent(videoId)}`;

  const callRapid = async (targetUrl: string, includeRapidHeaders: boolean) => {
    const headers: Record<string, string> = includeRapidHeaders
      ? {
          'x-rapidapi-key': rapidApiKey,
          'x-rapidapi-host': host,
        }
      : {};
    return fetchWithTimeout(targetUrl, { headers }, 12000);
  };

  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await callRapid(endpoint, true);
    if (!res.ok) {
      throw new Error(`RapidAPI HTTP ${res.status}`);
    }
    const data = (await res.json()) as {
      status?: string;
      link?: string;
      url?: string;
      dlink?: string;
      filesize?: number;
      msg?: string;
    };

    const link = data.link || data.url || data.dlink;
    if (link && (data.status === 'ok' || !data.status || data.status === 'success')) {
      return { directLink: link, filesize: data.filesize };
    }

    if (data.status === 'processing') {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      continue;
    }

    if (link) {
      return { directLink: link, filesize: data.filesize };
    }

    throw new Error(data.msg || 'Pa jwenn lyen MP3');
  }

  throw new Error('Konvèsyon MP3 pran tròp tan');
}

async function resolveFallbackAudioUrls(videoId: string): Promise<string[]> {
  const urls: string[] = [];

  const pipedPromises = PIPED_INSTANCES.map(async (inst) => {
    const res = await fetchWithTimeout(`${inst}/streams/${encodeURIComponent(videoId)}`, {}, 5000);
    if (!res.ok) throw new Error('Piped stream error');
    const data = (await res.json()) as {
      audioStreams?: Array<{ url?: string; bitrate?: number; mimeType?: string }>;
    };
    const streams = (data.audioStreams || [])
      .filter((s) => Boolean(s.url))
      .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
    if (streams.length === 0) throw new Error('No audio streams');
    return streams.map((s) => s.url!);
  });

  const invPromises = INVIDIOUS_INSTANCES.map(async (inst) => {
    const res = await fetchWithTimeout(
      `${inst}/api/v1/videos/${encodeURIComponent(videoId)}`,
      {},
      5000
    );
    if (!res.ok) throw new Error('Inv stream error');
    const data = (await res.json()) as {
      adaptiveFormats?: Array<{ url?: string; type?: string; bitrate?: string }>;
    };
    const streams = (data.adaptiveFormats || []).filter(
      (f) => f.url && f.type && f.type.startsWith('audio/')
    );
    if (streams.length === 0) throw new Error('No inv audio');
    return streams.map((s) => s.url!);
  });

  try {
    const winner = await Promise.any([...pipedPromises, ...invPromises]);
    urls.push(...winner);
  } catch {
    // No fallback stream resolved
  }

  return urls;
}

export async function downloadMp3Client(
  videoId: string,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; mimeType: string }> {
  const candidateUrls: string[] = [];
  let expectedFilesize = 0;

  try {
    const rapid = await resolveRapidApiMp3Link(videoId);
    expectedFilesize = rapid.filesize || 0;
    if (rapid.directLink) {
      candidateUrls.push(rapid.directLink);
      candidateUrls.push(`https://corsproxy.io/?${encodeURIComponent(rapid.directLink)}`);
      candidateUrls.push(
        `https://api.allorigins.win/raw?url=${encodeURIComponent(rapid.directLink)}`
      );
    }
  } catch {
    // Continue to Piped/Invidious fallback streams
  }

  if (candidateUrls.length === 0) {
    const fallbackStreams = await resolveFallbackAudioUrls(videoId);
    for (const sUrl of fallbackStreams.slice(0, 3)) {
      candidateUrls.push(sUrl);
      candidateUrls.push(`https://corsproxy.io/?${encodeURIComponent(sUrl)}`);
    }
  }

  if (candidateUrls.length === 0) {
    throw new Error('Pa jwenn lyen MP3 pou mizik sa a.');
  }

  onProgress?.(12);

  for (const url of candidateUrls) {
    try {
      const res = await fetchWithTimeout(url, {}, 30000);
      if (!res.ok) continue;

      const cType = (res.headers.get('Content-Type') || '').toLowerCase();
      if (
        cType.includes('text/html') ||
        cType.includes('text/plain') ||
        cType.includes('application/json')
      ) {
        continue;
      }

      const contentLengthHeader = res.headers.get('Content-Length');
      const totalBytes = contentLengthHeader
        ? parseInt(contentLengthHeader, 10)
        : expectedFilesize;

      let blob: Blob;
      if (res.body) {
        const reader = res.body.getReader();
        const chunks: Uint8Array[] = [];
        let received = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value) {
            chunks.push(value);
            received += value.length;
            const pct =
              totalBytes > 0
                ? Math.min(96, Math.max(15, Math.round((received / totalBytes) * 95)))
                : Math.min(92, 15 + Math.round(received / 65000));
            onProgress?.(pct);
          }
        }

        blob = new Blob(chunks as BlobPart[], {
          type: cType && cType.startsWith('audio/') ? cType : 'audio/mpeg',
        });
      } else {
        blob = await res.blob();
      }

      if (blob.size > 16384) {
        return {
          blob,
          mimeType: cType && cType.startsWith('audio/') ? cType : 'audio/mpeg',
        };
      }
    } catch {
      // Try next candidate URL
    }
  }

  throw new Error('Telechajman MP3 echwe sou tout sous yo.');
}
