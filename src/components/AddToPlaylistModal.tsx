import React, { useState } from 'react';
import { Check, ListPlus, Plus, X } from 'lucide-react';
import type { Playlist, Track } from '../types';

interface AddToPlaylistModalProps {
  track: Track | null;
  playlists: Playlist[];
  onClose: () => void;
  onAddTrack: (playlistId: string, track: Track) => void;
  onCreateAndAdd: (name: string, track: Track) => void;
}

export const AddToPlaylistModal: React.FC<AddToPlaylistModalProps> = ({
  track,
  playlists,
  onClose,
  onAddTrack,
  onCreateAndAdd,
}) => {
  const [newName, setNewName] = useState('');

  if (!track) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    onCreateAndAdd(newName.trim(), track);
    setNewName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#0E1424]/95 backdrop-blur-xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-[#38BDF8]" />
              <span>Ajoute nan Playlist</span>
            </h3>
            <p className="mt-1 truncate text-xs text-[#8B9BB4]">{track.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center text-[#8B9BB4] hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto">
          {playlists.map((pl) => {
            const exists = pl.tracks.some((t) => t.id === track.id);
            return (
              <button
                key={pl.id}
                type="button"
                onClick={() => {
                  onAddTrack(pl.id, track);
                  onClose();
                }}
                className="w-full min-h-[48px] rounded-xl border border-white/[0.08] bg-[#090D18]/85 hover:border-[#38BDF8]/50 px-4 py-2.5 flex items-center justify-between text-left transition-colors"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{pl.name}</p>
                  <p className="text-xs text-[#8B9BB4]">{pl.tracks.length} mizik</p>
                </div>
                {exists ? (
                  <Check className="w-4 h-4 text-[#38BDF8]" />
                ) : (
                  <Plus className="w-4 h-4 text-[#8B9BB4]" />
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleCreate} className="pt-2 border-t border-white/[0.08] flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Oswa kreye nouvo playlist..."
            className="flex-1 rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[44px]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white whitespace-nowrap shadow-[0_0_16px_rgba(37,99,235,0.3)] transition-all"
          >
            Kreye
          </button>
        </form>
      </div>
    </div>
  );
};
