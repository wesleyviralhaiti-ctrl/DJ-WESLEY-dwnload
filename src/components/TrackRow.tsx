import React, { useState } from 'react';
import { Check, Download, ListPlus, Loader2, Music2, Pause, Play } from 'lucide-react';
import type { DownloadProgress, Track } from '../types';
import { PlayingEqualizer } from './PlayingEqualizer';

interface TrackRowProps {
  track: Track;
  isActive: boolean;
  isPlaying: boolean;
  isDownloaded: boolean;
  downloadState?: DownloadProgress;
  onPlay: (track: Track) => void;
  onDownload: (track: Track) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  isActive,
  isPlaying,
  isDownloaded,
  downloadState,
  onPlay,
  onDownload,
  onAddToPlaylist,
}) => {
  const [imgError, setImgError] = useState(false);
  const isDownloading =
    downloadState &&
    (downloadState.status === 'fetching' ||
      downloadState.status === 'downloading' ||
      downloadState.status === 'saving');

  return (
    <div
      className={`group flex items-center gap-3 rounded-2xl border p-2.5 sm:p-3 backdrop-blur-md transition-all ${
        isActive
          ? 'border-[#38BDF8]/50 bg-[#0E1424]/95 shadow-[0_0_24px_rgba(56,189,248,0.14)]'
          : 'border-white/[0.08] bg-[#0E1424]/85 hover:border-white/15 hover:bg-[#131B2E]/90'
      }`}
    >
      {/* Artwork + Play/Equalizer Trigger */}
      <button
        type="button"
        onClick={() => onPlay(track)}
        className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-xl bg-[#111A2E] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        aria-label={`Jwe ${track.title}`}
      >
        {!imgError && track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            referrerPolicy="no-referrer"
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-[#2563EB] to-[#070A12] flex items-center justify-center">
            <Music2 className="w-6 h-6 text-[#BAE6FD]" />
          </div>
        )}
        <div
          className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isActive && isPlaying ? (
            <>
              <PlayingEqualizer className="group-hover:hidden" />
              <Pause className="w-5 h-5 text-white fill-white hidden group-hover:block" />
            </>
          ) : (
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          )}
        </div>
      </button>

      {/* Track Info (Zero-Pill Unboxed Metadata) */}
      <button
        type="button"
        onClick={() => onPlay(track)}
        className="min-w-0 flex-1 text-left py-1 focus-visible:outline-none"
      >
        <p
          className={`truncate text-sm sm:text-[15px] font-semibold leading-snug ${
            isActive ? 'text-[#38BDF8]' : 'text-[#F1F5F9]'
          }`}
        >
          {track.title}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8B9BB4] truncate">
          <span className="truncate">{track.artist}</span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-tabular shrink-0">{track.durationLabel}</span>
          {track.viewCount && (
            <>
              <span aria-hidden="true" className="hidden sm:inline">·</span>
              <span className="hidden sm:inline shrink-0">{track.viewCount}</span>
            </>
          )}
        </div>
      </button>

      {/* Actions (44px+ Touch Targets) */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onAddToPlaylist(track)}
          className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#8B9BB4] hover:text-white hover:bg-white/5 transition-colors"
          title="Ajoute nan Playlist"
          aria-label={`Ajoute ${track.title} nan Playlist`}
        >
          <ListPlus className="w-4.5 h-4.5" />
        </button>

        <button
          type="button"
          onClick={() => onDownload(track)}
          disabled={isDownloading}
          className={`min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
            isDownloaded
              ? 'bg-[#38BDF8]/15 text-[#38BDF8] border border-[#38BDF8]/40'
              : isDownloading
              ? 'bg-[#2563EB]/25 text-[#BAE6FD] border border-[#38BDF8]/40'
              : 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] shadow-[0_0_16px_rgba(37,99,235,0.28)] hover:shadow-[0_0_22px_rgba(56,189,248,0.4)] active:scale-[0.97]'
          }`}
          title={isDownloaded ? 'Telechaje deja (Offline)' : 'Telechaje MP3'}
          aria-label={`Telechaje ${track.title}`}
        >
          {isDownloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono-tabular">{downloadState?.progress ?? 0}%</span>
            </>
          ) : isDownloaded ? (
            <>
              <Check className="w-4 h-4" />
              <span className="hidden sm:inline">Offline</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">MP3</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
