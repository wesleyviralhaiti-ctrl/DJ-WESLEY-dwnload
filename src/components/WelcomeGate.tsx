import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Eye, EyeOff, Headphones, Lock, ShieldCheck, Sparkles } from 'lucide-react';
import { BrandEmblem } from './BrandEmblem';
import { PWAInstallButton } from './PWAInstallButton';

interface WelcomeGateProps {
  onRegister: (fullName: string, email: string, password: string) => Promise<boolean>;
  onLogin: (email: string, password: string) => Promise<boolean>;
  loading: boolean;
  error: string | null;
  welcomeUserFirstName: string | null;
  onEnterApp: () => void;
}

export const WelcomeGate: React.FC<WelcomeGateProps> = ({
  onRegister,
  onLogin,
  loading,
  error,
  welcomeUserFirstName,
  onEnterApp,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setLocalError('Veuillez entrer une adresse e-mail valide.');
      return;
    }
    if (password.trim().length < 4) {
      setLocalError('Le mot de passe doit contenir au moins 4 caractères.');
      return;
    }

    if (mode === 'register') {
      const trimmedName = fullName.trim();
      if (trimmedName.length < 2) {
        setLocalError('Veuillez entrer votre nom complet.');
        return;
      }
      setLocalError(null);
      await onRegister(trimmedName, trimmedEmail, password.trim());
    } else {
      setLocalError(null);
      await onLogin(trimmedEmail, password.trim());
    }
  };

  // Glossy French Welcome Screen ("Écran de Bienvenue") after register/login
  if (welcomeUserFirstName) {
    return (
      <div className="min-h-screen w-full bg-[#070A12] text-[#F1F5F9] flex items-center justify-center px-5 py-10 relative">
        <div
          className="pointer-events-none absolute inset-0 opacity-45"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(37, 99, 235, 0.34), transparent 60%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-lg w-full rounded-3xl border border-white/[0.08] bg-[#0E1424]/90 backdrop-blur-xl p-7 sm:p-10 shadow-[0_0_50px_rgba(56,189,248,0.14)] text-center"
        >
          <div className="mx-auto mb-6 flex justify-center">
            <BrandEmblem size={84} />
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Bienvenue sur WESLEY MUSIC DOWNLOAD, {welcomeUserFirstName} ! 🎧
          </h1>

          <p className="mt-4 text-sm sm:text-base italic leading-relaxed text-[#CBD5E1]">
            &ldquo;Votre plateforme premium pour écouter et télécharger vos meilleurs sons Konpa, Rabòday, Amapiano, Drill, Afrobeat et Rap Kreyòl en haute qualité.&rdquo;
          </p>

          <div className="mt-7 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 backdrop-blur-md p-3.5">
              <Headphones className="w-4 h-4 text-[#38BDF8] mb-1.5" />
              <p className="text-xs font-semibold text-white">Streaming Illimité</p>
              <p className="text-[11px] text-[#8B9BB4] mt-0.5">Lecture fluide gratuite 24/7</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 backdrop-blur-md p-3.5">
              <Sparkles className="w-4 h-4 text-[#38BDF8] mb-1.5" />
              <p className="text-xs font-semibold text-white">MP3 Hors-Ligne</p>
              <p className="text-[11px] text-[#8B9BB4] mt-0.5">Sauvegarde directe & IndexedDB</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onEnterApp}
            className="mt-7 w-full rounded-2xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] px-6 py-4 text-sm sm:text-base font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(37,99,235,0.4)] hover:shadow-[0_0_32px_rgba(56,189,248,0.45)] transition-all min-h-[52px]"
          >
            <span>Commencer à écouter</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#070A12] text-[#F1F5F9] flex flex-col justify-between px-5 py-8 sm:px-8">
      <div className="max-w-md w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BrandEmblem size={40} />
          <span className="font-display text-sm font-bold tracking-wide text-white whitespace-nowrap">
            WESLEY MUSIC
          </span>
        </div>
        <PWAInstallButton />
      </div>

      <main className="max-w-md w-full mx-auto my-auto py-6">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center">
            <BrandEmblem size={68} className="mb-4" />
            <h1 className="font-display text-2xl sm:text-2xl font-extrabold tracking-tight text-white">
              WESLEY MUSIC DOWNLOAD
            </h1>
            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-[#8B9BB4]">
              Connectez-vous ou créez votre compte pour écouter et télécharger vos hits préférés.
            </p>
          </div>

          {/* Auth Mode Tabs */}
          <div className="mt-6 grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#070A12]/90 border border-white/[0.08]">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setLocalError(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-h-[42px] ${
                mode === 'register'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.35)]'
                  : 'text-[#8B9BB4] hover:text-white'
              }`}
            >
              Créer un compte
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLocalError(null);
              }}
              className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-h-[42px] ${
                mode === 'login'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_14px_rgba(37,99,235,0.35)]'
                  : 'text-[#8B9BB4] hover:text-white'
              }`}
            >
              Se connecter
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === 'register' && (
              <div>
                <label htmlFor="auth-fullname" className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                  Nom complet
                </label>
                <input
                  id="auth-fullname"
                  type="text"
                  required
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ex: Jean Wesley Pierre"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[48px]"
                />
              </div>
            )}

            <div>
              <label htmlFor="auth-email" className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Adresse e-mail
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@exemple.com"
                className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[48px]"
              />
            </div>

            <div>
              <label htmlFor="auth-password" className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] pl-4 pr-12 py-3 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[48px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 min-h-[40px] min-w-[40px] rounded-lg flex items-center justify-center text-[#8B9BB4] hover:text-white"
                  aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {(localError || error) && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-medium text-red-300">
                {localError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] active:scale-[0.99] disabled:opacity-60 px-5 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.34)] hover:shadow-[0_0_26px_rgba(56,189,248,0.4)] transition-all min-h-[48px]"
            >
              <span>
                {loading
                  ? 'Connexion en cours...'
                  : mode === 'register'
                  ? 'Créer mon compte'
                  : 'Se connecter'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/[0.08] flex items-center justify-between text-xs text-[#7D8EA8]">
            <span className="inline-flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#38BDF8]" />
              Compte Sécurisé
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
              1 Code VIP = 1 Téléphone
            </span>
          </div>
        </div>
      </main>

      <footer className="max-w-md w-full mx-auto text-center text-xs text-[#5E6E85]">
        WESLEY MUSIC DOWNLOAD · Haiti & Diaspora
      </footer>
    </div>
  );
};
