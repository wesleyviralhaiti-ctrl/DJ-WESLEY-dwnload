import React from 'react';
import { FolderDown, HardDriveDownload, ListPlus, Music2, Pause, Play, Trash2 } from 'lucide-react';
import { formatBytes, saveBlobToDeviceMusicFolder } from '../lib/db';
import type { DownloadedTrack, Track } from '../types';
import { PlayingEqualizer } from './PlayingEqualizer';

interface DownloadsViewProps {
  downloads: DownloadedTrack[];
  activeTrackId?: string;
  isPlaying: boolean;
  onPlay: (track: Track) => void;
  onDelete: (id: string) => void;
  onAddToPlaylist: (track: Track) => void;
}

export const DownloadsView: React.FC<DownloadsViewProps> = ({
  downloads,
  activeTrackId,
  isPlaying,
  onPlay,
  onDelete,
  onAddToPlaylist,
}) => {
  const totalBytes = downloads.reduce((acc, item) => acc + (item.sizeBytes || 0), 0);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Telechajman (Offline)
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#8B9BB4]">
            Mizik MP3 sa yo sove nan IndexedDB · Koute san entènèt nenpòt lè
          </p>
        </div>
        <div className="text-xs font-mono-tabular text-[#8B9BB4]">
          {downloads.length} mizik · {formatBytes(totalBytes)}
        </div>
      </div>

      {downloads.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-8 sm:p-12 text-center">
          <div className="mx-auto h-14 w-14 rounded-2xl bg-[#2563EB]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mb-4 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <HardDriveDownload className="w-7 h-7" />
          </div>
          <h3 className="font-display text-lg font-bold text-white">
            Pa gen mizik telechaje ankò
          </h3>
          <p className="mt-1.5 text-sm text-[#8B9BB4] max-w-md mx-auto">
            Chèche nenpòt mizik nan onglet Akèy epi peze bouton MP3 la pou sove l isit la epi nan dosye mizik telefòn ou.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {downloads.map((item) => {
            const isActive = activeTrackId === item.id;
            return (
              <div
                key={item.id}
                className={`group flex items-center gap-3 rounded-2xl border p-3 backdrop-blur-md transition-all ${
                  isActive
                    ? 'border-[#38BDF8]/50 bg-[#0E1424]/95 shadow-[0_0_24px_rgba(56,189,248,0.14)]'
                    : 'border-white/[0.08] bg-[#0E1424]/85 hover:border-white/15'
                }`}
              >
                <button
                  type="button"
                  onClick={() => onPlay(item)}
                  className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-[#111A2E] flex items-center justify-center"
                  aria-label={`Jwe ${item.title}`}
                >
                  {item.thumbnail ? (
                    <img
                      src={item.thumbnail}
                      alt={item.title}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Music2 className="w-6 h-6 text-[#38BDF8]" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
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

                <button
                  type="button"
                  onClick={() => onPlay(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className={`truncate text-sm font-semibold ${isActive ? 'text-[#38BDF8]' : 'text-white'}`}>
                    {item.title}
                  </p>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-[#8B9BB4] truncate">
                    <span className="truncate">{item.artist}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular shrink-0">{item.durationLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular shrink-0">{formatBytes(item.sizeBytes)}</span>
                  </div>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => saveBlobToDeviceMusicFolder(item.blob, item.title, item.artist)}
                    className="min-h-[44px] px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_16px_rgba(37,99,235,0.28)] transition-all"
                    title="Sove nan Dosye Mizik Aparèy la"
                  >
                    <FolderDown className="w-4 h-4" />
                    <span className="hidden sm:inline">Sove sou Aparèy</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onAddToPlaylist(item)}
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#8B9BB4] hover:text-white hover:bg-white/5"
                    aria-label="Ajoute nan Playlist"
                  >
                    <ListPlus className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#8B9BB4] hover:text-red-400 hover:bg-red-500/10"
                    aria-label="Efase"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
