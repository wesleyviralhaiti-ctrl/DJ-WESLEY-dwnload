import React, { useEffect, useRef, useState } from 'react';
import { Loader2, Music2, Pause, Play, SkipBack, SkipForward } from 'lucide-react';
import { getDownloadedTrackById } from '../lib/db';
import type { Track } from '../types';

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        options: {
          height?: string;
          width?: string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
            onError?: () => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

interface MiniPlayerDockProps {
  track: Track | null;
  isPlaying: boolean;
  onPlayingChange: (playing: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
}

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const MiniPlayerDock: React.FC<MiniPlayerDockProps> = ({
  track,
  isPlaying,
  onPlayingChange,
  onNext,
  onPrev,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const onNextRef = useRef(onNext);
  const onPlayingChangeRef = useRef(onPlayingChange);
  onNextRef.current = onNext;
  onPlayingChangeRef.current = onPlayingChange;

  const [engine, setEngine] = useState<'audio' | 'yt'>('audio');
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [imgError, setImgError] = useState(false);

  // Ensure YouTube IFrame API script is loaded
  const ensureYouTubeApi = (): Promise<void> => {
    return new Promise((resolve) => {
      if (window.YT && window.YT.Player) {
        resolve();
        return;
      }
      const existing = document.getElementById('yt-iframe-api-script');
      const prevCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prevCallback) prevCallback();
        resolve();
      };
      if (!existing) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api-script';
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    });
  };

  // Load new track when track.id changes
  useEffect(() => {
    if (!track) return;
    let cancelled = false;
    setImgError(false);
    setCurrentTime(0);
    setDuration(track.durationSeconds || 0);

    const cleanupAudio = () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
        audioRef.current.load();
      }
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.pauseVideo();
        } catch {
          // ignore
        }
      }
    };

    const startYouTubeIframe = async (videoId: string) => {
      if (cancelled) return;
      setEngine('yt');
      await ensureYouTubeApi();
      if (cancelled || !window.YT?.Player) return;

      if (ytPlayerRef.current) {
        ytPlayerRef.current.loadVideoById(videoId);
        ytPlayerRef.current.playVideo();
        setLoadingAudio(false);
        return;
      }

      ytPlayerRef.current = new window.YT.Player('wesley-yt-player', {
        height: '1',
        width: '1',
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (ev) => {
            if (!cancelled) {
              ev.target.playVideo();
              setLoadingAudio(false);
            }
          },
          onStateChange: (ev) => {
            if (cancelled) return;
            const state = window.YT?.PlayerState;
            if (state && ev.data === state.ENDED) {
              onNextRef.current();
            } else if (state && ev.data === state.PLAYING) {
              onPlayingChangeRef.current(true);
              setLoadingAudio(false);
            } else if (state && ev.data === state.PAUSED) {
              onPlayingChangeRef.current(false);
            }
          },
          onError: () => {
            if (!cancelled) setLoadingAudio(false);
          },
        },
      });
    };

    const loadTrack = async () => {
      cleanupAudio();
      setLoadingAudio(true);

      // 1. Check IndexedDB offline storage first for instant offline playback
      try {
        const offline = await getDownloadedTrackById(track.id);
        if (!cancelled && offline?.blob) {
          const url = URL.createObjectURL(offline.blob);
          objectUrlRef.current = url;
          setEngine('audio');
          if (audioRef.current) {
            audioRef.current.src = url;
            await audioRef.current.play().catch(() => {});
          }
          setLoadingAudio(false);
          return;
        }
      } catch {
        // Ignore IndexedDB miss
      }

      // 2. Online playback directly via YouTube IFrame API (100% client-side)
      if (!cancelled) {
        await startYouTubeIframe(track.id);
      }
    };

    loadTrack();

    return () => {
      cancelled = true;
    };
  }, [track?.id]);

  // Sync Play/Pause state changes triggered by user button
  useEffect(() => {
    if (!track) return;
    if (engine === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    } else if (engine === 'yt' && ytPlayerRef.current) {
      try {
        if (isPlaying) ytPlayerRef.current.playVideo();
        else ytPlayerRef.current.pauseVideo();
      } catch {
        // ignore
      }
    }
  }, [isPlaying, engine, track?.id]);

  // Poll YouTube IFrame progress when active
  useEffect(() => {
    if (engine !== 'yt' || !track) return;
    const interval = setInterval(() => {
      if (ytPlayerRef.current) {
        try {
          const ct = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || track.durationSeconds || 0;
          setCurrentTime(ct);
          if (dur > 0) setDuration(dur);
        } catch {
          // ignore
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [engine, track]);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    if (engine === 'audio' && audioRef.current) {
      audioRef.current.currentTime = newTime;
    } else if (engine === 'yt' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(newTime, true);
      } catch {
        // ignore
      }
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <>
      {/* Hidden Audio & YouTube Player Elements */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration && isFinite(audioRef.current.duration)) {
              setDuration(audioRef.current.duration);
            }
          }
        }}
        onEnded={() => onNext()}
        onPlay={() => onPlayingChange(true)}
        onPause={() => onPlayingChange(false)}
        onError={() => {
          // If direct stream failed mid-load, try YT iframe
          if (track && engine === 'audio') {
            setEngine('yt');
            ensureYouTubeApi().then(() => {
              if (ytPlayerRef.current) {
                ytPlayerRef.current.loadVideoById(track.id);
                ytPlayerRef.current.playVideo();
              }
            });
          }
        }}
        className="hidden"
      />
      <div className="fixed -left-20 -top-20 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
        <div id="wesley-yt-player" />
      </div>

      {track && (
        <div
          className="fixed left-0 right-0 bottom-[60px] z-40 px-2 sm:px-4 pointer-events-none pb-safe"
          role="region"
          aria-label="Lektè Mizik"
        >
          <div className="pointer-events-auto max-w-5xl mx-auto rounded-2xl border border-white/[0.08] bg-[#0E1424]/90 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.75)] overflow-hidden">
            {/* Interactive Progress Bar */}
            <div className="relative h-1.5 w-full bg-white/10 group">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#2563EB] via-[#3B82F6] to-[#38BDF8] shadow-[0_0_10px_rgba(56,189,248,0.7)] transition-all duration-150"
                style={{ width: `${progressPct}%` }}
              />
              <input
                type="range"
                min={0}
                max={duration || 100}
                step={0.5}
                value={currentTime}
                onChange={handleSeek}
                aria-label="Pwogresyon mizik la"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-3 px-3 py-2">
              {/* Thumbnail */}
              <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-[#111A2E] flex items-center justify-center ring-1 ring-white/10">
                {!imgError && track.thumbnail ? (
                  <img
                    src={track.thumbnail}
                    alt={track.title}
                    referrerPolicy="no-referrer"
                    onError={() => setImgError(true)}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Music2 className="w-5 h-5 text-[#38BDF8]" />
                )}
              </div>

              {/* Title & Time */}
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs sm:text-sm font-semibold text-white">
                  {track.title}
                </p>
                <p className="truncate text-[11px] text-[#8B9BB4] flex items-center gap-1.5">
                  <span className="truncate">{track.artist}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono-tabular shrink-0 text-[#94A3B8]">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={onPrev}
                  className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Mizik Anvan"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onPlayingChange(!isPlaying)}
                  className="min-h-[40px] min-w-[40px] rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white flex items-center justify-center shadow-[0_0_18px_rgba(37,99,235,0.4)] hover:shadow-[0_0_22px_rgba(56,189,248,0.45)] transition-all"
                  aria-label={isPlaying ? 'Poze' : 'Jwe'}
                >
                  {loadingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="w-4 h-4 fill-white" />
                  ) : (
                    <Play className="w-4 h-4 fill-white ml-0.5" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={onNext}
                  className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-[#CBD5E1] hover:text-white hover:bg-white/5 transition-colors"
                  aria-label="Pwochen Mizik"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
