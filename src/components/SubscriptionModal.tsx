import React, { useState } from 'react';
import {
  Check,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  Lock,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { activateLocalVipCode, submitLocalPayment } from '../lib/clientStore';
import type { SubscriptionPlan, UserProfile } from '../types';

interface SubscriptionModalProps {
  isOpen: boolean;
  user: UserProfile;
  deviceId: string;
  expiredNotice?: boolean;
  freeLimitNotice?: boolean;
  onClose: () => void;
  onSubmitted: (updatedUser: UserProfile) => void;
}

const NATCASH_NUMBER = '+509 56568810';

export function getRemainingVipDays(expiresAt?: number | null): number | null {
  if (!expiresAt) return null;
  const diff = expiresAt - Date.now();
  if (diff <= 0) return 0;
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  user,
  deviceId,
  expiredNotice = false,
  freeLimitNotice = false,
  onClose,
  onSubmitted,
}) => {
  const [plan, setPlan] = useState<SubscriptionPlan>('monthly');
  const [region, setRegion] = useState<'ayiti' | 'diaspora'>('ayiti');
  const [phone, setPhone] = useState('');
  const [transactionCode, setTransactionCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedVip, setCopiedVip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // VIP Code Activation state
  const [vipCodeInput, setVipCodeInput] = useState('');
  const [activatingVip, setActivatingVip] = useState(false);
  const [vipError, setVipError] = useState<string | null>(null);
  const [vipCelebration, setVipCelebration] = useState<string | null>(null);

  if (!isOpen) return null;

  const isVipActive =
    user.subscriptionStatus === 'active' &&
    (!user.expiresAt || Date.now() <= user.expiresAt) &&
    (!user.vipDeviceId || user.vipDeviceId === deviceId);

  const remainingDays = getRemainingVipDays(user.expiresAt);

  const copyNatcash = async () => {
    try {
      await navigator.clipboard.writeText(NATCASH_NUMBER);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const copyVipCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedVip(true);
      setTimeout(() => setCopiedVip(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleActivateVipCode = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = vipCodeInput.trim().toUpperCase();
    if (!cleaned) return;
    setActivatingVip(true);
    setVipError(null);
    setVipCelebration(null);

    const res = activateLocalVipCode({
      code: cleaned,
      email: user.email,
      fullName: user.fullName,
      deviceId,
    });

    if (!res.ok) {
      setVipError(res.error);
      setActivatingVip(false);
      return;
    }

    onSubmitted(res.user);
    setVipCelebration(res.message);
    setVipCodeInput('');
    setActivatingVip(false);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !transactionCode.trim()) {
      setError('Tanpri antre nimewo telefòn ou ak kòd tranzaksyon an.');
      return;
    }
    setSubmitting(true);
    setError(null);

    const res = submitLocalPayment({
      email: user.email,
      fullName: user.fullName,
      deviceId,
      region,
      phone: phone.trim(),
      transactionCode: transactionCode.trim(),
      plan,
    });

    onSubmitted(res.user);
    setSuccessMsg('Demann peman ou an voye! Admin ap valide l rapidman.');
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-white/[0.08] bg-[#0E1424]/95 backdrop-blur-xl p-5 sm:p-7 max-h-[92vh] overflow-y-auto shadow-2xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-[#D4AF37]/15 border border-[#D4AF37]/45 flex items-center justify-center text-[#D4AF37] shrink-0">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {isVipActive ? 'Carte VIP Personnelle' : 'Abònman & Code VIP'}
              </h2>
              <p className="text-xs text-[#8B9BB4]">
                Streaming toujou gratis · 1 Code VIP = 1 Téléphone Seulement
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-[#8B9BB4] hover:text-white hover:bg-white/5"
            aria-label="Fèmen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Limit Reached Alert */}
        {freeLimitNotice && !isVipActive && (
          <div className="rounded-2xl border border-[#38BDF8]/40 bg-[#2563EB]/15 p-4 text-xs sm:text-sm font-medium text-white shadow-[0_0_18px_rgba(37,99,235,0.2)]">
            Ou deja itilize 1 telechajman gratis ou a. Aktive VIP ou pou telechaje san limit !
          </div>
        )}

        {/* Expired Alert */}
        {expiredNotice && !isVipActive && (
          <div className="rounded-2xl border border-red-500/35 bg-red-500/10 p-4 text-xs sm:text-sm text-red-200">
            Votre accès VIP de 30 jours a expiré. Veuillez renouveler via Natcash <strong>{NATCASH_NUMBER}</strong> ou entrer un nouveau Code VIP.
          </div>
        )}

        {/* VIP Celebration Alert */}
        {vipCelebration && (
          <div className="rounded-2xl border border-[#38BDF8]/50 bg-[#2563EB]/25 p-4 text-sm font-semibold text-white flex items-center gap-2.5 shadow-[0_0_20px_rgba(56,189,248,0.22)]">
            <Sparkles className="w-5 h-5 text-[#38BDF8] shrink-0" />
            <span>{vipCelebration}</span>
          </div>
        )}

        {/* Personal Client-Side VIP Card when Active */}
        {isVipActive && (
          <div className="rounded-3xl border border-[#D4AF37]/65 bg-gradient-to-br from-[#131B2E] via-[#0E1424] to-[#070A12] p-5 shadow-[0_0_32px_rgba(212,175,55,0.16)] space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#D4AF37]" />
                <span className="font-display text-sm font-bold tracking-wide text-[#D4AF37]">
                  MEMBRE VIP
                </span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/55 bg-[#D4AF37]/15 px-3 py-1 font-mono-tabular text-[11px] font-bold text-[#D4AF37]">
                {user.subscriptionPlan === 'lifetime'
                  ? 'VIP ACTIF · À VIE'
                  : `VIP ACTIF · Rete ${remainingDays ?? 30} jou`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3">
                <p className="text-[11px] text-[#8B9BB4]">Code VIP</p>
                <div className="mt-1 flex items-center justify-between gap-1">
                  <span className="font-mono-tabular text-sm font-bold text-[#D4AF37]">
                    {user.vipCode || 'VIP-ACTIF'}
                  </span>
                  {user.vipCode && (
                    <button
                      type="button"
                      onClick={() => copyVipCode(user.vipCode!)}
                      className="p-1 text-[#8B9BB4] hover:text-white"
                      aria-label="Copier Code VIP"
                    >
                      {copiedVip ? <Check className="w-3.5 h-3.5 text-[#38BDF8]" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/[0.08] bg-black/40 p-3">
                <p className="text-[11px] text-[#8B9BB4]">Plan</p>
                <p className="mt-1 font-display text-sm font-bold text-white">
                  {user.subscriptionPlan === 'lifetime' ? '$150 à vie' : '$20 / mois'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs text-[#CBD5E1]">
              <span className="inline-flex items-center gap-1.5 text-[#38BDF8] font-medium">
                <ShieldCheck className="w-4 h-4" />
                Appareil vérifié
              </span>
              <span className="inline-flex items-center gap-1 font-mono-tabular text-[11px] text-[#8B9BB4]">
                <Smartphone className="w-3.5 h-3.5" />
                {deviceId.slice(0, 14)}…
              </span>
            </div>
          </div>
        )}

        {/* Strict Single-Device VIP Code Box */}
        <form
          onSubmit={handleActivateVipCode}
          className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#38BDF8]" />
            <label htmlFor="vip-code-input" className="text-xs font-bold text-white">
              Entrer un code VIP
            </label>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="vip-code-input"
              type="text"
              value={vipCodeInput}
              onChange={(e) => setVipCodeInput(e.target.value.toUpperCase())}
              placeholder="Ex: WES-1001"
              className="flex-1 rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-sm font-mono-tabular uppercase text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[44px]"
            />
            <button
              type="submit"
              disabled={activatingVip || !vipCodeInput.trim()}
              className="min-h-[44px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 whitespace-nowrap shadow-[0_0_16px_rgba(37,99,235,0.3)] transition-all"
            >
              {activatingVip && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Activer VIP</span>
            </button>
          </div>
          {vipError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/15 px-3.5 py-2.5 text-xs font-semibold text-red-200">
              {vipError}
            </div>
          )}
        </form>

        {/* Natcash Paywall (shown when not yet active, or collapsed below) */}
        {!isVipActive && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPlan('monthly')}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  plan === 'monthly'
                    ? 'border-[#38BDF8] bg-[#2563EB]/20 shadow-[0_0_18px_rgba(37,99,235,0.2)]'
                    : 'border-white/[0.08] bg-[#090D18]/85 hover:border-white/20'
                }`}
              >
                <span className="text-xs font-semibold text-[#8B9BB4]">30 Jours (1 Mwa)</span>
                <p className="mt-1 font-display text-xl font-extrabold text-white font-mono-tabular">
                  $20<span className="text-xs font-normal text-[#8B9BB4]"> / mois</span>
                </p>
              </button>

              <button
                type="button"
                onClick={() => setPlan('lifetime')}
                className={`rounded-2xl border p-3.5 text-left transition-all ${
                  plan === 'lifetime'
                    ? 'border-[#D4AF37] bg-[#D4AF37]/15 shadow-[0_0_18px_rgba(212,175,55,0.18)]'
                    : 'border-white/[0.08] bg-[#090D18]/85 hover:border-white/20'
                }`}
              >
                <span className="text-xs font-semibold text-[#D4AF37]">À Vie (VIP)</span>
                <p className="mt-1 font-display text-xl font-extrabold text-white font-mono-tabular">
                  $150<span className="text-xs font-normal text-[#8B9BB4]"> / à vie</span>
                </p>
              </button>
            </div>

            <div className="rounded-2xl border border-[#2563EB]/50 bg-[#090D18]/90 p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[#8B9BB4]">Voye peman Natcash sou nimewo sa a:</p>
                <p className="mt-0.5 font-display text-lg font-bold text-white font-mono-tabular">
                  {NATCASH_NUMBER}
                </p>
              </div>
              <button
                type="button"
                onClick={copyNatcash}
                className="min-h-[44px] px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-1.5 whitespace-nowrap shrink-0 shadow-[0_0_16px_rgba(37,99,235,0.28)] transition-all"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Kopye!' : 'Kopye'}</span>
              </button>
            </div>

            {user.subscriptionStatus === 'pending' && !successMsg && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                Demann peman ou an an atant de konfimasyon Admin. Kou l apwouve l, Kat VIP ou ap parèt la a!
              </div>
            )}

            {successMsg ? (
              <div className="rounded-2xl border border-[#38BDF8]/40 bg-[#2563EB]/20 p-5 text-center">
                <Check className="w-8 h-8 text-[#38BDF8] mx-auto mb-2" />
                <p className="text-sm font-semibold text-white">{successMsg}</p>
                <p className="mt-1 text-xs text-[#CBD5E1]">
                  Kou Admin apwouve li, w ap jwenn Code VIP ou ak Kat VIP ou dirèkteman isit la.
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-4 w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-sm font-semibold text-white min-h-[44px]"
                >
                  Kontinye Koute Mizik
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4">
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#070A12] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setRegion('ayiti')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-h-[42px] ${
                      region === 'ayiti'
                        ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'text-[#8B9BB4] hover:text-white'
                    }`}
                  >
                    🇭🇹 Moun Ayiti
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegion('diaspora')}
                    className={`py-2.5 px-3 rounded-lg text-xs font-semibold transition-all whitespace-nowrap min-h-[42px] ${
                      region === 'diaspora'
                        ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.3)]'
                        : 'text-[#8B9BB4] hover:text-white'
                    }`}
                  >
                    🌎 Moun Lòt Bò
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    {region === 'ayiti' ? 'Nimewo Telefòn Natcash Ou' : 'Nimewo Telefòn Ou (WhatsApp / International)'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={region === 'ayiti' ? '+509 3XXX XXXX' : '+1 305 XXX XXXX'}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[46px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    {region === 'ayiti' ? 'Transcode (Kòd Tranzaksyon Natcash)' : 'Transaction ID'}
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionCode}
                    onChange={(e) => setTransactionCode(e.target.value)}
                    placeholder={region === 'ayiti' ? 'Ex: NC98431204' : 'Ex: TXN-8849201'}
                    className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white font-mono-tabular placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[46px]"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-60 py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.34)] transition-all min-h-[48px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Ap voye demann...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Konfime Peman (${plan === 'lifetime' ? '150' : '20'})</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
