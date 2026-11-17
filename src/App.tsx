import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Ban,
  Crown,
  Download,
  Home,
  ListMusic,
  Loader2,
  LogOut,
  Search,
  Shield,
  WifiOff,
  X,
} from 'lucide-react';
import { AddToPlaylistModal } from './components/AddToPlaylistModal';
import { AdminPanel } from './components/AdminPanel';
import { BrandEmblem } from './components/BrandEmblem';
import { DownloadsView } from './components/DownloadsView';
import { MiniPlayerDock } from './components/MiniPlayerDock';
import { PlaylistView } from './components/PlaylistView';
import { PWAInstallButton } from './components/PWAInstallButton';
import { getRemainingVipDays, SubscriptionModal } from './components/SubscriptionModal';
import { TrackRow } from './components/TrackRow';
import { WelcomeGate } from './components/WelcomeGate';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import {
  deleteDownloadedTrack,
  getAllDownloadedTracks,
  saveDownloadedTrack,
} from './lib/db';
import {
  filterBuiltInCatalog,
  getCatalogByGenre,
} from './lib/catalog';
import {
  claimLocalFreeDownload,
  loginLocalUser,
  recordLocalTrackPlay,
  registerLocalUser,
  syncLocalUser,
} from './lib/clientStore';
import {
  GENRES,
  getOrCreateDeviceId,
  isDeviceFreeDownloadClaimed,
  loadAdminPasscode,
  loadLocalUser,
  loadPlaylists,
  saveAdminPasscode,
  saveLocalUser,
  savePlaylists,
} from './lib/storage';
import { downloadMp3Client, searchMusicClient } from './lib/youtubeClient';
import type {
  AppTab,
  DownloadedTrack,
  DownloadProgress,
  GenreId,
  Playlist,
  Track,
  UserProfile,
} from './types';

export default function App() {
  const isOnline = useOnlineStatus();
  const [deviceId] = useState<string>(() => getOrCreateDeviceId());

  // User & Auth Gate State
  const [user, setUser] = useState<UserProfile | null>(() => loadLocalUser());
  const [welcomeFirstName, setWelcomeFirstName] = useState<string | null>(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [adminPasscode, setAdminPasscode] = useState<string | null>(() => loadAdminPasscode());

  // Navigation & Modals
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [showPaywall, setShowPaywall] = useState(false);
  const [expiredNotice, setExpiredNotice] = useState(false);
  const [freeLimitNotice, setFreeLimitNotice] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState<Track | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Music Feed & Search State
  const [selectedGenre, setSelectedGenre] = useState<GenreId>('tout');
  const [activeGenre, setActiveGenre] = useState<GenreId | undefined>('tout');
  const [searchInput, setSearchInput] = useState('');
  const [activeQuery, setActiveQuery] = useState(GENRES[0].query);
  const [tracks, setTracks] = useState<Track[]>(() => getCatalogByGenre('tout'));
  const [loadingTracks, setLoadingTracks] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const isFetchingMoreRef = useRef(false);
  const searchSeqRef = useRef(0);

  // Player & Queue State
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Offline Downloads & Playlists
  const [downloads, setDownloads] = useState<DownloadedTrack[]>([]);
  const [downloadProgressMap, setDownloadProgressMap] = useState<Record<string, DownloadProgress>>({});
  const [playlists, setPlaylists] = useState<Playlist[]>(() => loadPlaylists());

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  }, []);

  // Load IndexedDB downloads on mount
  const refreshDownloads = useCallback(async () => {
    try {
      const items = await getAllDownloadedTracks();
      setDownloads(items);
    } catch {
      // Ignore IndexedDB unavailability
    }
  }, []);

  useEffect(() => {
    refreshDownloads();
  }, [refreshDownloads]);

  // Enforce automatic 30-day VIP expiration check
  const enforceLocalExpiration = useCallback(
    (profile: UserProfile): { updated: UserProfile; expired: boolean } => {
      if (
        profile.subscriptionStatus === 'active' &&
        profile.expiresAt !== null &&
        profile.expiresAt !== undefined &&
        Date.now() > profile.expiresAt
      ) {
        const revoked: UserProfile = {
          ...profile,
          subscriptionStatus: 'free',
          subscriptionPlan: undefined,
          vipCode: undefined,
          vipDeviceId: undefined,
          expiresAt: null,
        };
        return { updated: revoked, expired: true };
      }
      return { updated: profile, expired: false };
    },
    []
  );

  const normalizeFreeDownloads = useCallback(
    (profile: UserProfile): UserProfile => {
      if (isDeviceFreeDownloadClaimed(deviceId)) {
        return profile.freeDownloadsLeft === 0 ? profile : { ...profile, freeDownloadsLeft: 0 };
      }
      if (typeof profile.freeDownloadsLeft !== 'number') {
        return { ...profile, freeDownloadsLeft: 1 };
      }
      return profile;
    },
    [deviceId]
  );

  // Sync current user status locally (subscription approvals / 30-day expiration / blocks)
  const syncUserStatus = useCallback(() => {
    if (!user?.email) return;
    const { user: synced, expired } = syncLocalUser(user.email, deviceId);
    if (synced) {
      const normalized = normalizeFreeDownloads(synced);
      setUser(normalized);
      saveLocalUser(normalized);
      if (expired) {
        setExpiredNotice(true);
        setShowPaywall(true);
      }
    } else {
      const check = enforceLocalExpiration(user);
      const normalized = normalizeFreeDownloads(check.updated);
      if (check.expired || normalized.freeDownloadsLeft !== user.freeDownloadsLeft) {
        setUser(normalized);
        saveLocalUser(normalized);
      }
      if (check.expired) {
        setExpiredNotice(true);
        setShowPaywall(true);
      }
    }
  }, [user?.email, deviceId, enforceLocalExpiration, normalizeFreeDownloads]);

  useEffect(() => {
    if (user?.email) {
      syncUserStatus();
    }
  }, [user?.email, syncUserStatus]);

  // Fetch initial page of tracks directly from YouTube Data API v3 + Piped/Invidious + Built-in Catalog
  const fetchTracks = useCallback(async (query: string, genreId?: GenreId) => {
    const reqSeq = ++searchSeqRef.current;
    const instantCatalog = genreId ? getCatalogByGenre(genreId) : filterBuiltInCatalog(query);

    if (instantCatalog.length > 0) {
      setTracks(instantCatalog);
      setLoadingTracks(false);
    } else {
      setLoadingTracks(true);
    }

    setNextPageToken(null);
    setHasMore(false);
    isFetchingMoreRef.current = false;

    try {
      const data = await searchMusicClient({ query, genreId });
      if (reqSeq !== searchSeqRef.current) return;

      const live = data.tracks || [];
      const seen = new Set<string>();
      const combined: Track[] = [];
      for (const t of live) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      }
      for (const t of instantCatalog) {
        if (!seen.has(t.id)) {
          seen.add(t.id);
          combined.push(t);
        }
      }

      const finalTracks = combined.length > 0 ? combined : getCatalogByGenre(genreId || 'tout');
      setTracks(finalTracks);
      setNextPageToken(data.nextPageToken || 'fb_page:1');
      setHasMore(finalTracks.length < 250);
    } catch {
      if (reqSeq !== searchSeqRef.current) return;
      const fallback = instantCatalog.length > 0 ? instantCatalog : getCatalogByGenre(genreId || 'tout');
      setTracks(fallback);
      setNextPageToken('fb_page:1');
      setHasMore(fallback.length < 250);
    } finally {
      if (reqSeq === searchSeqRef.current) {
        setLoadingTracks(false);
      }
    }
  }, []);

  const loadMoreTracks = useCallback(async () => {
    if (isFetchingMoreRef.current || loadingTracks) return;
    const activeToken = nextPageToken || 'fb_page:1';
    isFetchingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await searchMusicClient({
        query: activeQuery,
        genreId: activeGenre,
        pageToken: activeToken,
      });
      const incoming = data.tracks || [];
      let updatedLength = 0;
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const uniqueNew = incoming.filter((t) => !existingIds.has(t.id));
        let nextList: Track[];
        if (uniqueNew.length > 0) {
          nextList = [...prev, ...uniqueNew];
        } else {
          const remainingCatalog = getCatalogByGenre('tout').filter((t) => !existingIds.has(t.id));
          nextList = remainingCatalog.length > 0 ? [...prev, ...remainingCatalog.slice(0, 25)] : prev;
        }
        updatedLength = nextList.length;
        return nextList;
      });
      const fallbackNext = activeToken.startsWith('fb_page:')
        ? `fb_page:${(parseInt(activeToken.replace('fb_page:', ''), 10) || 1) + 1}`
        : 'fb_page:1';
      setNextPageToken(data.nextPageToken || fallbackNext);
      setHasMore(updatedLength < 250);
    } catch {
      let updatedLength = 0;
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const remainingCatalog = getCatalogByGenre('tout').filter((t) => !existingIds.has(t.id));
        const nextList = remainingCatalog.length > 0 ? [...prev, ...remainingCatalog.slice(0, 25)] : prev;
        updatedLength = nextList.length;
        return nextList;
      });
      const fallbackNext = activeToken.startsWith('fb_page:')
        ? `fb_page:${(parseInt(activeToken.replace('fb_page:', ''), 10) || 1) + 1}`
        : 'fb_page:1';
      setNextPageToken(fallbackNext);
      setHasMore(updatedLength < 250);
    } finally {
      isFetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [activeQuery, activeGenre, nextPageToken, loadingTracks]);

  useEffect(() => {
    if (user && !user.blocked) {
      fetchTracks(activeQuery, activeGenre);
    }
  }, [user?.id, user?.blocked, activeQuery, activeGenre, fetchTracks]);

  // IntersectionObserver for seamless infinite scroll pagination
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || activeTab !== 'home' || !hasMore || loadingTracks) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMoreTracks();
        }
      },
      { root: null, rootMargin: '400px 0px', threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [activeTab, hasMore, loadingTracks, loadMoreTracks]);

  const handleRegister = async (
    fullName: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    setRegisterLoading(true);
    setRegisterError(null);
    const res = registerLocalUser({ fullName, email, password, deviceId });
    if (!res.ok) {
      setRegisterError(res.error);
      setRegisterLoading(false);
      return false;
    }
    const normalized = normalizeFreeDownloads(res.user);
    setUser(normalized);
    saveLocalUser(normalized);
    setWelcomeFirstName(fullName.trim().split(/\s+/)[0] || fullName);
    setRegisterLoading(false);
    return true;
  };

  const handleLogin = async (email: string, password: string): Promise<boolean> => {
    setRegisterLoading(true);
    setRegisterError(null);
    const res = loginLocalUser({ email, password, deviceId });
    if (!res.ok) {
      setRegisterError(res.error);
      setRegisterLoading(false);
      return false;
    }
    const normalized = normalizeFreeDownloads(res.user);
    setUser(normalized);
    saveLocalUser(normalized);
    if (res.expired) setExpiredNotice(true);
    setWelcomeFirstName(normalized.fullName.trim().split(/\s+/)[0] || normalized.fullName);
    setRegisterLoading(false);
    return true;
  };

  const handleLogout = () => {
    setUser(null);
    saveLocalUser(null);
    setWelcomeFirstName(null);
    setActiveTab('home');
  };

  const handleGenreSelect = (genreId: GenreId) => {
    setSelectedGenre(genreId);
    setActiveGenre(genreId);
    setSearchInput('');
    const found = GENRES.find((g) => g.id === genreId);
    if (found) {
      setActiveQuery(found.query);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    setActiveGenre(undefined);
    setActiveQuery(q);
  };

  const handlePlayTrack = (track: Track, customQueue?: Track[]) => {
    const activeQueue = customQueue && customQueue.length > 0 ? customQueue : tracks;
    if (activeQueue.length > 0) setQueue(activeQueue);

    if (currentTrack?.id === track.id) {
      setIsPlaying((prev) => !prev);
      return;
    }

    setCurrentTrack(track);
    setIsPlaying(true);

    if (user?.email) {
      const updated = { ...user, songsPlayed: (user.songsPlayed || 0) + 1 };
      setUser(updated);
      saveLocalUser(updated);
      recordLocalTrackPlay(user.email);
    }
  };

  const handleNextTrack = () => {
    const list = queue.length > 0 ? queue : tracks;
    if (!currentTrack || list.length === 0) return;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    const nextIdx = idx >= 0 && idx + 1 < list.length ? idx + 1 : 0;
    handlePlayTrack(list[nextIdx], list);
  };

  const handlePrevTrack = () => {
    const list = queue.length > 0 ? queue : tracks;
    if (!currentTrack || list.length === 0) return;
    const idx = list.findIndex((t) => t.id === currentTrack.id);
    const prevIdx = idx > 0 ? idx - 1 : list.length - 1;
    handlePlayTrack(list[prevIdx], list);
  };

  const downloadedIds = useMemo(() => new Set(downloads.map((d) => d.id)), [downloads]);
  const isUserVipValid = useMemo(() => {
    if (!user || user.subscriptionStatus !== 'active') return false;
    if (user.expiresAt && Date.now() > user.expiresAt) return false;
    if (user.vipDeviceId && user.vipDeviceId !== deviceId) return false;
    return true;
  }, [user, deviceId]);

  const isVipOrAdmin = Boolean(adminPasscode) || isUserVipValid;

  const effectiveFreeDownloadsLeft = useMemo(() => {
    if (!user) return 0;
    if (isDeviceFreeDownloadClaimed(deviceId)) return 0;
    return typeof user.freeDownloadsLeft === 'number' ? Math.max(0, user.freeDownloadsLeft) : 1;
  }, [user, deviceId]);

  const handleDownloadTrack = async (track: Track) => {
    if (downloadedIds.has(track.id)) {
      setActiveTab('downloads');
      showToast('Mizik sa a deja sove nan Telechajman.');
      return;
    }

    // Re-check 30-day VIP expiration right before downloading
    if (user && !adminPasscode) {
      const check = enforceLocalExpiration(user);
      if (check.expired) {
        const normalized = normalizeFreeDownloads(check.updated);
        setUser(normalized);
        saveLocalUser(normalized);
        setExpiredNotice(true);
        setFreeLimitNotice(false);
        setShowPaywall(true);
        showToast('Votre accès VIP de 30 jours a expiré.');
        return;
      }
    }

    const isUsingFreeGift = !isVipOrAdmin;
    if (isUsingFreeGift && effectiveFreeDownloadsLeft <= 0) {
      setFreeLimitNotice(true);
      setShowPaywall(true);
      return;
    }

    setDownloadProgressMap((prev) => ({
      ...prev,
      [track.id]: { videoId: track.id, progress: 5, status: 'fetching' },
    }));

    try {
      const { blob, mimeType } = await downloadMp3Client(track.id, (pct) => {
        setDownloadProgressMap((prev) => ({
          ...prev,
          [track.id]: { videoId: track.id, progress: pct, status: 'downloading' },
        }));
      });

      setDownloadProgressMap((prev) => ({
        ...prev,
        [track.id]: { videoId: track.id, progress: 98, status: 'saving' },
      }));

      await saveDownloadedTrack(track, blob, mimeType || blob.type || 'audio/mpeg');
      await refreshDownloads();

      setDownloadProgressMap((prev) => ({
        ...prev,
        [track.id]: { videoId: track.id, progress: 100, status: 'done' },
      }));

      if (isUsingFreeGift && user) {
        const claimedUser = claimLocalFreeDownload(user.email, deviceId) || {
          ...user,
          freeDownloadsLeft: 0,
        };
        setUser(claimedUser);
        saveLocalUser(claimedUser);
        showToast('🎉 Men premye mizik MP3 gratis ou a! Pase VIP pou telechaje san limit.');
      } else {
        showToast(`"${track.title}" sove nan Telechajman!`);
      }
    } catch (err) {
      setDownloadProgressMap((prev) => ({
        ...prev,
        [track.id]: {
          videoId: track.id,
          progress: 0,
          status: 'error',
          error: (err as Error).message,
        },
      }));
      showToast('Telechajman pa reyisi. Eseye ankò.');
    }
  };

  // Playlist Mutations
  const updatePlaylists = (next: Playlist[]) => {
    setPlaylists(next);
    savePlaylists(next);
  };

  const handleCreatePlaylist = (name: string, description: string) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      description,
      tracks: [],
      createdAt: Date.now(),
    };
    updatePlaylists([newPl, ...playlists]);
    showToast(`Playlist "${name}" kreye!`);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    updatePlaylists(playlists.filter((p) => p.id !== playlistId));
  };

  const handleAddTrackToPlaylist = (playlistId: string, track: Track) => {
    const next = playlists.map((pl) => {
      if (pl.id !== playlistId) return pl;
      if (pl.tracks.some((t) => t.id === track.id)) return pl;
      return { ...pl, tracks: [track, ...pl.tracks] };
    });
    updatePlaylists(next);
    showToast('Mizik ajoute nan playlist!');
  };

  const handleCreateAndAddPlaylist = (name: string, track: Track) => {
    const newPl: Playlist = {
      id: `pl_${Date.now()}`,
      name,
      description: 'Playlist pèsonèl',
      tracks: [track],
      createdAt: Date.now(),
    };
    updatePlaylists([newPl, ...playlists]);
    showToast(`Ajoute nan "${name}"!`);
  };

  const handleRemoveTrackFromPlaylist = (playlistId: string, trackId: string) => {
    const next = playlists.map((pl) =>
      pl.id === playlistId ? { ...pl, tracks: pl.tracks.filter((t) => t.id !== trackId) } : pl
    );
    updatePlaylists(next);
  };

  if (!user || welcomeFirstName) {
    return (
      <WelcomeGate
        onRegister={handleRegister}
        onLogin={handleLogin}
        loading={registerLoading}
        error={registerError}
        welcomeUserFirstName={welcomeFirstName}
        onEnterApp={() => setWelcomeFirstName(null)}
      />
    );
  }

  if (user.blocked) {
    return (
      <div className="min-h-screen bg-[#070A12] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl border border-red-500/30 bg-[#0E1424]/90 backdrop-blur-xl p-8 text-center space-y-4">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/15 flex items-center justify-center text-red-400">
            <Ban className="w-7 h-7" />
          </div>
          <h1 className="font-display text-xl font-bold">Kont Sa a Bloke</h1>
          <p className="text-sm text-[#8B9BB4]">
            Kont {user.email} sispann pa Admin lan. Kontakte sipò pou plis enfòmasyon.
          </p>
        </div>
      </div>
    );
  }

  const firstName = user.fullName.trim().split(/\s+/)[0] || user.fullName;
  const remainingVipDays = getRemainingVipDays(user.expiresAt);

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-[#F1F5F9]">
      {/* Offline Indicator Banner */}
      {!isOnline && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-medium text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Mòd San Entènèt · Ou ka koute mizik ou yo nan Telechajman</span>
        </div>
      )}

      {/* Top Header (Scrolls smoothly with page for zero sticky clutter) */}
      <header className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-3 pt-safe">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <BrandEmblem size={42} className="shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-sm sm:text-base font-extrabold tracking-wide text-white truncate">
                WESLEY MUSIC DOWNLOAD
              </p>
              <p className="text-xs sm:text-sm text-[#8B9BB4] truncate">
                Bonjou, {firstName} 👋
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <PWAInstallButton />
            {!isVipOrAdmin ? (
              <button
                type="button"
                onClick={() => {
                  setFreeLimitNotice(false);
                  setShowPaywall(true);
                }}
                className={
                  effectiveFreeDownloadsLeft === 1
                    ? 'inline-flex items-center gap-1.5 rounded-full border border-[#38BDF8]/50 bg-[#0E1424]/90 hover:border-[#38BDF8] px-3.5 py-1.5 text-xs font-semibold text-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.2)] transition-all whitespace-nowrap min-h-[38px]'
                    : 'inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/45 bg-[#2563EB]/20 hover:bg-[#2563EB]/35 px-3.5 py-1.5 text-xs font-semibold text-white shadow-[0_0_18px_rgba(37,99,235,0.28)] transition-all whitespace-nowrap min-h-[38px]'
                }
              >
                <span>
                  {effectiveFreeDownloadsLeft === 1
                    ? '🎁 1 Telechajman Gratis'
                    : '🔒 0 Gratis • Pase VIP'}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (adminPasscode && !isUserVipValid ? setActiveTab('admin') : setShowPaywall(true))}
                className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/55 bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 px-3.5 py-1.5 text-xs font-bold text-[#D4AF37] shadow-[0_0_18px_rgba(212,175,55,0.18)] transition-all whitespace-nowrap min-h-[38px]"
              >
                <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>
                  {adminPasscode && !isUserVipValid
                    ? 'VIP ACTIF · Admin'
                    : user.subscriptionPlan === 'lifetime'
                    ? 'VIP ACTIF · À Vie'
                    : `VIP ACTIF · ${remainingVipDays ?? 30}j`}
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="min-h-[40px] min-w-[40px] rounded-xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md flex items-center justify-center text-[#8B9BB4] hover:text-white hover:border-white/15 transition-colors"
              title="Se déconnecter"
              aria-label="Se déconnecter"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content (Free vertical scroll, generous bottom clearance for mini-player + tab bar) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-2 pb-40">
        {activeTab === 'home' && (
          <div className="space-y-5">
            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="w-4.5 h-4.5 text-[#7D8EA8] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Chèche nenpòt atis oswa mizik sou YouTube..."
                className="w-full rounded-2xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md pl-11 pr-24 py-3.5 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[50px] transition-colors"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput('');
                    handleGenreSelect(selectedGenre);
                  }}
                  className="absolute right-20 top-1/2 -translate-y-1/2 p-2 text-[#8B9BB4] hover:text-white"
                  aria-label="Efase rechèch"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-semibold text-white min-h-[38px] shadow-[0_0_14px_rgba(37,99,235,0.34)] transition-all"
              >
                Chèche
              </button>
            </form>

            {/* Horizontal Genre Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
              {GENRES.map((genre) => {
                const isSelected = selectedGenre === genre.id && !searchInput;
                return (
                  <button
                    key={genre.id}
                    type="button"
                    onClick={() => handleGenreSelect(genre.id)}
                    className={`min-h-[42px] px-4 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 border backdrop-blur-md transition-all ${
                      isSelected
                        ? 'bg-[#2563EB] border-[#38BDF8]/75 text-white shadow-[0_0_16px_rgba(37,99,235,0.34)]'
                        : 'bg-[#0E1424]/85 border-white/[0.08] text-[#94A3B8] hover:text-white hover:border-white/15'
                    }`}
                  >
                    {genre.label}
                  </button>
                );
              })}
            </div>

            {/* Section Heading */}
            <div className="flex items-center justify-between pt-1">
              <h1 className="font-display text-lg sm:text-xl font-bold text-white">
                {searchInput ? `Rezilta pou "${searchInput}"` : GENRES.find((g) => g.id === selectedGenre)?.label}
              </h1>
              {!loadingTracks && tracks.length > 0 && (
                <span className="text-xs font-mono-tabular text-[#8B9BB4]">
                  {tracks.length} mizik
                </span>
              )}
            </div>

            {/* Track List */}
            {loadingTracks ? (
              <div className="py-16 flex flex-col items-center justify-center gap-3 text-[#8B9BB4]">
                <Loader2 className="w-7 h-7 animate-spin text-[#38BDF8]" />
                <p className="text-sm">Ap chaje mizik sou YouTube...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {tracks.map((track) => (
                    <TrackRow
                      key={track.id}
                      track={track}
                      isActive={currentTrack?.id === track.id}
                      isPlaying={isPlaying && currentTrack?.id === track.id}
                      isDownloaded={downloadedIds.has(track.id)}
                      downloadState={downloadProgressMap[track.id]}
                      onPlay={(t) => handlePlayTrack(t, tracks)}
                      onDownload={handleDownloadTrack}
                      onAddToPlaylist={(t) => setPlaylistTargetTrack(t)}
                    />
                  ))}
                </div>

                {/* Infinite Scroll Sentinel & Load More Button */}
                <div ref={loadMoreRef} className="pt-6 pb-4 flex flex-col items-center justify-center gap-3">
                  {loadingMore && (
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-[#38BDF8] font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-[#38BDF8]" />
                      <span>Ap chaje 25+ lòt mizik...</span>
                    </div>
                  )}
                  {hasMore && (
                    <button
                      type="button"
                      onClick={loadMoreTracks}
                      disabled={loadingMore}
                      className="min-h-[46px] px-6 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 border border-[#38BDF8]/40 text-xs sm:text-sm font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.35)] hover:shadow-[0_0_26px_rgba(56,189,248,0.45)] transition-all flex items-center gap-2"
                    >
                      {loadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
                      <span>Chaje plis mizik (+25)</span>
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'downloads' && (
          <DownloadsView
            downloads={downloads}
            activeTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onPlay={(t) => handlePlayTrack(t, downloads)}
            onDelete={async (id) => {
              await deleteDownloadedTrack(id);
              await refreshDownloads();
              showToast('Mizik retire nan Telechajman.');
            }}
            onAddToPlaylist={(t) => setPlaylistTargetTrack(t)}
          />
        )}

        {activeTab === 'playlist' && (
          <PlaylistView
            playlists={playlists}
            activeTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            onCreatePlaylist={handleCreatePlaylist}
            onDeletePlaylist={handleDeletePlaylist}
            onRemoveTrack={handleRemoveTrackFromPlaylist}
            onPlayTrack={(t, list) => handlePlayTrack(t, list)}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel
            adminPasscode={adminPasscode}
            onUnlock={(code) => {
              setAdminPasscode(code);
              saveAdminPasscode(code);
            }}
            onLock={() => {
              setAdminPasscode(null);
              saveAdminPasscode(null);
            }}
            onUserUpdated={syncUserStatus}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-xs rounded-xl border border-[#38BDF8]/50 bg-[#0E1424]/95 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-[0_0_24px_rgba(56,189,248,0.22)]">
          {toastMessage}
        </div>
      )}

      {/* Mini Player Dock */}
      <MiniPlayerDock
        track={currentTrack}
        isPlaying={isPlaying}
        onPlayingChange={setIsPlaying}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
      />

      {/* Bottom Tab Navigation (Thumb Zone) */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 h-[60px] bg-[#0E1424]/90 backdrop-blur-xl border-t border-white/[0.08] pb-safe"
        aria-label="Navigasyon Prensipal"
      >
        <div className="max-w-5xl mx-auto h-full grid grid-cols-4 items-center">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'home' ? 'text-[#38BDF8]' : 'text-[#8B9BB4] hover:text-white'
            }`}
          >
            <Home
              className={`w-5 h-5 transition-all ${
                activeTab === 'home' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : ''
              }`}
            />
            <span className="text-[11px] font-semibold">Akèy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors relative ${
              activeTab === 'downloads' ? 'text-[#38BDF8]' : 'text-[#8B9BB4] hover:text-white'
            }`}
          >
            <Download
              className={`w-5 h-5 transition-all ${
                activeTab === 'downloads' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : ''
              }`}
            />
            <span className="text-[11px] font-semibold">
              Telechajman{downloads.length > 0 ? ` (${downloads.length})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('playlist')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'playlist' ? 'text-[#38BDF8]' : 'text-[#8B9BB4] hover:text-white'
            }`}
          >
            <ListMusic
              className={`w-5 h-5 transition-all ${
                activeTab === 'playlist' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : ''
              }`}
            />
            <span className="text-[11px] font-semibold">Playlist</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
              activeTab === 'admin' ? 'text-[#38BDF8]' : 'text-[#8B9BB4] hover:text-white'
            }`}
          >
            <Shield
              className={`w-5 h-5 transition-all ${
                activeTab === 'admin' ? 'drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]' : ''
              }`}
            />
            <span className="text-[11px] font-semibold">Admin</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <SubscriptionModal
        isOpen={showPaywall}
        user={user}
        deviceId={deviceId}
        expiredNotice={expiredNotice}
        freeLimitNotice={freeLimitNotice}
        onClose={() => {
          setShowPaywall(false);
          setExpiredNotice(false);
          setFreeLimitNotice(false);
        }}
        onSubmitted={(updated) => {
          const normalized = normalizeFreeDownloads(updated);
          setUser(normalized);
          saveLocalUser(normalized);
          setExpiredNotice(false);
          setFreeLimitNotice(false);
        }}
      />

      <AddToPlaylistModal
        track={playlistTargetTrack}
        playlists={playlists}
        onClose={() => setPlaylistTargetTrack(null)}
        onAddTrack={handleAddTrackToPlaylist}
        onCreateAndAdd={handleCreateAndAddPlaylist}
      />
    </div>
  );
}
