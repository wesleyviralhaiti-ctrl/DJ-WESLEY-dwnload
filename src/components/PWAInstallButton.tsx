import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#1D4ED8] shadow-[0_0_16px_rgba(37,99,235,0.3)] active:scale-[0.98] transition-all whitespace-nowrap shrink-0 min-h-[40px]"
      >
        <Download className="w-4 h-4" />
        <span>Enstale App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#2563EB]/60 bg-[#0E1424]/85 backdrop-blur-md px-3 py-2 text-xs font-medium text-[#E2E8F0] hover:border-[#38BDF8] transition-colors whitespace-nowrap shrink-0 min-h-[40px]"
        >
          <Share className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span>Ajoute sou Ekran</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-[#0E1424]/95 backdrop-blur-xl p-6 shadow-2xl">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg font-bold text-white">
                  Enstale sou iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-2 rounded-lg text-[#8B9BB4] hover:text-white min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label="Fèmen"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <ol className="mt-4 space-y-3 text-sm text-[#CBD5E1]">
                <li>1. Peze bouton <strong className="text-white">Share</strong> (kare ak flèch anlè) nan Safari.</li>
                <li>2. Desann epi chwazi <strong className="text-white">Add to Home Screen</strong>.</li>
                <li>3. Louvri <strong className="text-[#38BDF8]">WESLEY MUSIC</strong> pou eksperyans plen ekran.</li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-[#2563EB] py-3 text-sm font-semibold text-white hover:bg-[#1D4ED8] shadow-[0_0_18px_rgba(37,99,235,0.3)] transition-all min-h-[44px]"
              >
                Mwen Konprann
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
