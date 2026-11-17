import React from 'react';

interface PlayingEqualizerProps {
  className?: string;
}

export const PlayingEqualizer: React.FC<PlayingEqualizerProps> = ({ className = '' }) => {
  return (
    <span
      className={`inline-flex items-end gap-[3px] h-4 w-4 justify-center ${className}`}
      aria-hidden="true"
    >
      <span className="w-[3px] h-full rounded-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.85)] animate-eq-1" />
      <span className="w-[3px] h-full rounded-full bg-[#60A5FA] shadow-[0_0_8px_rgba(37,99,235,0.85)] animate-eq-2" />
      <span className="w-[3px] h-full rounded-full bg-[#38BDF8] shadow-[0_0_8px_rgba(56,189,248,0.85)] animate-eq-3" />
    </span>
  );
};
