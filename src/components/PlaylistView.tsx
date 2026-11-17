import React, { useState } from 'react';
import { ListMusic, Music2, Pause, Play, Plus, Trash2, X } from 'lucide-react';
import type { Playlist, Track } from '../types';
import { PlayingEqualizer } from './PlayingEqualizer';

interface PlaylistViewProps {
  playlists: Playlist[];
  activeTrackId?: string;
  isPlaying: boolean;
  onCreatePlaylist: (name: string, description: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onRemoveTrack: (playlistId: string, trackId: string) => void;
  onPlayTrack: (track: Track, queue: Track[]) => void;
}

export const PlaylistView: React.FC<PlaylistViewProps> = ({
  playlists,
  activeTrackId,
  isPlaying,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveTrack,
  onPlayTrack,
}) => {
  const [selectedId, setSelectedId] = useState<string>(playlists[0]?.id || '');
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const activePlaylist = playlists.find((p) => p.id === selectedId) || playlists[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onCreatePlaylist(name.trim(), description.trim());
    setName('');
    setDescription('');
    setShowCreate(false);
  };

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
            Playlist Ou Yo
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-[#8B9BB4]">
            Kreye pwòp playlist Konpa, Rabòday oswa Afrobeat pa w
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-2 whitespace-nowrap shadow-[0_0_16px_rgba(37,99,235,0.28)] hover:shadow-[0_0_22px_rgba(56,189,248,0.4)] transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvo Playlist</span>
        </button>
      </div>

      {/* Playlist Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {playlists.map((pl) => {
          const selected = activePlaylist?.id === pl.id;
          return (
            <button
              key={pl.id}
              type="button"
              onClick={() => setSelectedId(pl.id)}
              className={`min-h-[42px] px-4 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 border backdrop-blur-md transition-all ${
                selected
                  ? 'bg-[#2563EB] border-[#38BDF8]/70 text-white shadow-[0_0_16px_rgba(37,99,235,0.32)]'
                  : 'bg-[#0E1424]/85 border-white/[0.08] text-[#94A3B8] hover:text-white hover:border-white/15'
              }`}
            >
              {pl.name} ({pl.tracks.length})
            </button>
          );
        })}
      </div>

      {/* Selected Playlist Content */}
      {activePlaylist && (
        <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-4 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-lg font-bold text-white">{activePlaylist.name}</h3>
              <p className="text-xs text-[#8B9BB4]">
                {activePlaylist.description || 'Playlist pèsonèl'} · {activePlaylist.tracks.length} mizik
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activePlaylist.tracks.length > 0 && (
                <button
                  type="button"
                  onClick={() => onPlayTrack(activePlaylist.tracks[0], activePlaylist.tracks)}
                  className="min-h-[42px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-1.5 shadow-[0_0_16px_rgba(37,99,235,0.28)] hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Jwe Tout</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeletePlaylist(activePlaylist.id)}
                className="min-h-[42px] min-w-[42px] rounded-xl border border-white/[0.08] bg-[#090D18]/75 flex items-center justify-center text-[#8B9BB4] hover:text-red-400 hover:border-red-500/40 transition-colors"
                title="Efase Playlist"
                aria-label="Efase Playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {activePlaylist.tracks.length === 0 ? (
            <div className="py-10 text-center">
              <ListMusic className="w-9 h-9 text-[#38BDF8] mx-auto mb-3 opacity-85" />
              <p className="text-sm font-medium text-white">Playlist sa a vid</p>
              <p className="mt-1 text-xs text-[#8B9BB4]">
                Peze bouton + sou nenpòt mizik nan Akèy oswa Telechajman pou ajoute l isit la.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activePlaylist.tracks.map((track) => {
                const isActive = activeTrackId === track.id;
                return (
                  <div
                    key={track.id}
                    className={`group flex items-center gap-3 rounded-2xl border p-2.5 backdrop-blur-md transition-all ${
                      isActive
                        ? 'border-[#38BDF8]/50 bg-[#0E1424]/95 shadow-[0_0_20px_rgba(56,189,248,0.14)]'
                        : 'border-white/[0.08] bg-[#090D18]/85 hover:border-white/15'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, activePlaylist.tracks)}
                      className="relative h-12 w-12 shrink-0 rounded-xl overflow-hidden bg-[#111A2E] flex items-center justify-center"
                    >
                      {track.thumbnail ? (
                        <img
                          src={track.thumbnail}
                          alt={track.title}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Music2 className="w-5 h-5 text-[#38BDF8]" />
                      )}
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        {isActive && isPlaying ? (
                          <>
                            <PlayingEqualizer className="group-hover:hidden" />
                            <Pause className="w-4 h-4 text-white fill-white hidden group-hover:block" />
                          </>
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => onPlayTrack(track, activePlaylist.tracks)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <p className={`truncate text-sm font-semibold ${isActive ? 'text-[#38BDF8]' : 'text-white'}`}>
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-[#8B9BB4] mt-0.5">
                        {track.artist} · <span className="font-mono-tabular">{track.durationLabel}</span>
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => onRemoveTrack(activePlaylist.id, track.id)}
                      className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#8B9BB4] hover:text-red-400 transition-colors"
                      aria-label="Retire nan Playlist"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-sm rounded-3xl border border-white/[0.08] bg-[#0E1424]/95 backdrop-blur-xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-white">Nouvo Playlist</h3>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#8B9BB4] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Non Playlist la
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Konpa 2026"
                className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Deskripsyon (Opsyonèl)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Seleksyon Konpa ak Rabòday"
                className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8]"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-bold text-white min-h-[46px] shadow-[0_0_18px_rgba(37,99,235,0.3)] transition-all"
            >
              Kreye Playlist
            </button>
          </form>
        </div>
      )}
    </section>
  );
};
