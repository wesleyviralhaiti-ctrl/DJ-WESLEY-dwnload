import React, { useEffect, useState } from 'react';
import {
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  KeyRound,
  Loader2,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Unlock,
  Users,
  X,
} from 'lucide-react';
import {
  DEFAULT_RAPIDAPI_HOST,
  DEFAULT_RAPIDAPI_KEY,
  DEFAULT_YOUTUBE_API_KEY,
  isValidAdminPasscodeClient,
} from '../lib/storage';
import {
  createAdminVipCodeLocal,
  getAdminOverviewLocal,
  performAdminPaymentActionLocal,
  performAdminUserActionLocal,
  performAdminVipCodeActionLocal,
  saveApiConfigLocal,
} from '../lib/clientStore';
import { resetYouTubeCooldown } from '../lib/youtubeClient';
import type { ApiConfig, PaymentRequest, SubscriptionPlan, UserProfile, VipCode } from '../types';

interface AdminPanelProps {
  adminPasscode: string | null;
  onUnlock: (passcode: string) => void;
  onLock: () => void;
  onUserUpdated: () => void;
}

const DEFAULT_API_CONFIG: ApiConfig = {
  youtubeApiKey: DEFAULT_YOUTUBE_API_KEY,
  rapidApiKey: DEFAULT_RAPIDAPI_KEY,
  rapidApiHost: DEFAULT_RAPIDAPI_HOST,
};

export const AdminPanel: React.FC<AdminPanelProps> = ({
  adminPasscode,
  onUnlock,
  onLock,
  onUserUpdated,
}) => {
  const [passInput, setPassInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [vipCodes, setVipCodes] = useState<VipCode[]>([]);
  const [config, setConfig] = useState<ApiConfig>({ ...DEFAULT_API_CONFIG });
  const [loadingData, setLoadingData] = useState(false);
  const [savingKeys, setSavingKeys] = useState(false);
  const [keysSavedMsg, setKeysSavedMsg] = useState<string | null>(null);

  // VIP Code Creator state
  const [newCodePlan, setNewCodePlan] = useState<SubscriptionPlan>('monthly');
  const [customCodeText, setCustomCodeText] = useState('');
  const [creatingCode, setCreatingCode] = useState(false);
  const [vipCodeError, setVipCodeError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchOverview = (code: string) => {
    if (!isValidAdminPasscodeClient(code)) {
      onLock();
      return;
    }
    setLoadingData(true);
    setError(null);
    const data = getAdminOverviewLocal();
    setUsers(data.users);
    setPayments(data.payments);
    setVipCodes(data.vipCodes);
    setConfig({
      youtubeApiKey: data.config.youtubeApiKey || DEFAULT_API_CONFIG.youtubeApiKey,
      rapidApiKey: data.config.rapidApiKey || DEFAULT_API_CONFIG.rapidApiKey,
      rapidApiHost: data.config.rapidApiHost || DEFAULT_API_CONFIG.rapidApiHost,
    });
    setLoadingData(false);
  };

  useEffect(() => {
    if (adminPasscode) {
      fetchOverview(adminPasscode);
    }
  }, [adminPasscode]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedPasscode = passInput.trim().toUpperCase();
    if (!normalizedPasscode) return;

    if (!isValidAdminPasscodeClient(normalizedPasscode)) {
      setError('Kòd Admin pa kòrèk. Eseye ankò.');
      return;
    }

    setVerifying(true);
    setError(null);
    onUnlock('WESLEY2026#');
    setPassInput('');
    setVerifying(false);
  };

  const handleUserAction = (
    userId: string,
    action: 'approve_monthly' | 'approve_lifetime' | 'revoke' | 'block' | 'unblock'
  ) => {
    if (!adminPasscode) return;
    const data = performAdminUserActionLocal(userId, action);
    setUsers(data.users);
    setVipCodes(data.vipCodes);
    onUserUpdated();
  };

  const handlePaymentAction = (paymentId: string, action: 'approve' | 'reject') => {
    if (!adminPasscode) return;
    const data = performAdminPaymentActionLocal(paymentId, action);
    setUsers(data.users);
    setPayments(data.payments);
    setVipCodes(data.vipCodes);
    onUserUpdated();
  };

  const handleCreateVipCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode) return;
    setCreatingCode(true);
    setVipCodeError(null);
    const res = createAdminVipCodeLocal(newCodePlan, customCodeText.trim() || undefined);
    if (res.ok) {
      setVipCodes(res.vipCodes);
      setCustomCodeText('');
    } else {
      setVipCodeError(res.error);
    }
    setCreatingCode(false);
  };

  const handleVipCodeAction = (code: string, action: 'reset' | 'delete') => {
    if (!adminPasscode) return;
    const nextCodes = performAdminVipCodeActionLocal(code, action);
    setVipCodes(nextCodes);
  };

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch {
      // ignore
    }
  };

  const handleSaveKeys = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPasscode) return;
    setSavingKeys(true);
    setKeysSavedMsg(null);
    const updated = saveApiConfigLocal(config);
    resetYouTubeCooldown();
    setConfig(updated);
    setKeysSavedMsg('Kle API yo anrejistre avèk siksè.');
    setTimeout(() => setKeysSavedMsg(null), 3500);
    setSavingKeys(false);
  };

  if (!adminPasscode) {
    return (
      <section className="max-w-md mx-auto py-8">
        <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
          <div className="h-12 w-12 rounded-2xl bg-[#2563EB]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mb-4 shadow-[0_0_18px_rgba(56,189,248,0.2)]">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">Zòn Admin</h2>
          <p className="mt-1.5 text-sm text-[#8B9BB4]">
            Antre kòd sekrè Admin lan pou jere itilizatè yo, Codes VIP, peman Natcash, epi debloke telechajman MP3 gratis.
          </p>

          <form onSubmit={handleUnlockSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-passcode" className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                Kòd Admin
              </label>
              <input
                id="admin-passcode"
                type="password"
                required
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Antre kòd Admin lan..."
                className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-4 py-3 text-sm text-white font-mono-tabular placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none focus:ring-1 focus:ring-[#38BDF8] min-h-[48px]"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={verifying}
              className="w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3.5 text-sm font-bold text-white flex items-center justify-center gap-2 min-h-[48px] shadow-[0_0_18px_rgba(37,99,235,0.3)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] transition-all"
            >
              {verifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
              <span>Debloke Admin</span>
            </button>
          </form>
        </div>
      </section>
    );
  }

  const pendingPayments = payments.filter((p) => p.status === 'pending');

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-[#2563EB]/20 border border-[#38BDF8]/45 flex items-center justify-center text-[#38BDF8] shadow-[0_0_16px_rgba(56,189,248,0.2)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-white">
              Panèl Admin
            </h2>
            <p className="text-xs text-[#38BDF8] font-medium">
              Mòd Admin aktif · Telechajman MP3 gratis san limit debloke
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchOverview(adminPasscode)}
            className="min-h-[42px] px-3.5 rounded-xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md text-xs font-semibold text-[#CBD5E1] hover:text-white hover:border-white/15 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin text-[#38BDF8]' : ''}`} />
            <span>Aktyalize</span>
          </button>
          <button
            type="button"
            onClick={onLock}
            className="min-h-[42px] px-3.5 rounded-xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md text-xs font-semibold text-[#CBD5E1] hover:text-red-300 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sòti</span>
          </button>
        </div>
      </div>

      {/* Codes VIP & Cadeaux Manager */}
      <div className="rounded-3xl border border-[#D4AF37]/35 bg-[#0E1424]/85 backdrop-blur-md p-4 sm:p-6 space-y-4 shadow-[0_0_28px_rgba(212,175,55,0.08)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-display text-base sm:text-lg font-bold text-white">
              Codes VIP & Cadeaux ({vipCodes.length})
            </h3>
          </div>
          <span className="text-xs text-[#8B9BB4]">
            1 Code VIP = 1 Téléphone Seulement
          </span>
        </div>

        {/* Generator Form */}
        <form
          onSubmit={handleCreateVipCode}
          className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#070A12] border border-white/[0.08] shrink-0">
            <button
              type="button"
              onClick={() => setNewCodePlan('monthly')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                newCodePlan === 'monthly'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#8B9BB4] hover:text-white'
              }`}
            >
              30 Jours
            </button>
            <button
              type="button"
              onClick={() => setNewCodePlan('lifetime')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                newCodePlan === 'lifetime'
                  ? 'bg-[#2563EB] text-white shadow-[0_0_12px_rgba(37,99,235,0.35)]'
                  : 'text-[#8B9BB4] hover:text-white'
              }`}
            >
              À vie / Lifetime
            </button>
          </div>

          <input
            type="text"
            value={customCodeText}
            onChange={(e) => setCustomCodeText(e.target.value.toUpperCase())}
            placeholder="Code personnalisé (optionnel, ex: WES-7777)"
            className="flex-1 rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-xs font-mono-tabular uppercase text-white placeholder-[#5B6B82] focus:border-[#38BDF8] focus:outline-none min-h-[42px]"
          />

          <button
            type="submit"
            disabled={creatingCode}
            className="min-h-[42px] px-4 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 shadow-[0_0_16px_rgba(37,99,235,0.3)] transition-all"
          >
            {creatingCode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            <span>+ Créer un nouveau Code VIP</span>
          </button>
        </form>

        {vipCodeError && (
          <div className="rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
            {vipCodeError}
          </div>
        )}

        {/* Codes List */}
        <div className="space-y-2">
          {vipCodes.map((vc) => {
            const isUsed = Boolean(vc.usedByDeviceId);
            return (
              <div
                key={vc.code}
                className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono-tabular text-sm font-bold text-[#D4AF37]">
                      {vc.code}
                    </span>
                    <span className="text-xs text-[#8B9BB4]">
                      · {vc.plan === 'lifetime' ? 'À vie / Lifetime' : '30 Jours'}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        isUsed ? 'text-[#8B9BB4]' : 'text-[#38BDF8]'
                      }`}
                    >
                      ·{' '}
                      {isUsed
                        ? `Utilisé par ${vc.usedByName || vc.usedByEmail || 'Client'} (1 appareil verrouillé)`
                        : 'Disponible'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => copyCode(vc.code)}
                    className="min-h-[38px] px-3 rounded-xl border border-white/[0.08] bg-[#0E1424]/85 hover:border-[#38BDF8]/50 text-xs font-semibold text-[#CBD5E1] hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    {copiedCode === vc.code ? (
                      <Check className="w-3.5 h-3.5 text-[#38BDF8]" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copiedCode === vc.code ? 'Copié' : 'Copier'}</span>
                  </button>

                  {isUsed && (
                    <button
                      type="button"
                      onClick={() => handleVipCodeAction(vc.code, 'reset')}
                      className="min-h-[38px] px-3 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-semibold text-amber-200 flex items-center gap-1"
                      title="Réinitialiser cet appareil"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleVipCodeAction(vc.code, 'delete')}
                    className="min-h-[38px] min-w-[38px] rounded-xl border border-white/[0.08] hover:border-red-500/40 text-[#8B9BB4] hover:text-red-400 flex items-center justify-center transition-colors"
                    aria-label={`Supprimer ${vc.code}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Natcash Payment Requests */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base sm:text-lg font-bold text-white">
            Demann Peman Natcash ({pendingPayments.length} an atant)
          </h3>
        </div>

        {payments.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#8B9BB4] py-4">
            Pa gen okenn demann peman soumèt pou kounye a.
          </p>
        ) : (
          <div className="space-y-2.5">
            {payments.map((pay) => (
              <div
                key={pay.id}
                className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{pay.userName}</span>
                    <span className="text-xs text-[#8B9BB4]">· {pay.userEmail}</span>
                  </div>
                  <div className="text-xs text-[#94A3B8] flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>{pay.region === 'ayiti' ? '🇭🇹 Moun Ayiti' : '🌎 Moun Lòt Bò'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">${pay.amountUsd} ({pay.plan === 'lifetime' ? 'Lifetime' : '30 Jours'})</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">Tel: {pay.phone}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-white">Kòd: {pay.transactionCode}</span>
                    {pay.generatedVipCode && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono-tabular font-semibold text-[#D4AF37]">VIP: {pay.generatedVipCode}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {pay.status === 'pending' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handlePaymentAction(pay.id, 'approve')}
                        className="min-h-[40px] px-3.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white flex items-center gap-1.5 shadow-[0_0_14px_rgba(37,99,235,0.28)] transition-all"
                      >
                        <Check className="w-4 h-4" />
                        <span>Apwouve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePaymentAction(pay.id, 'reject')}
                        className="min-h-[40px] px-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-xs font-semibold text-red-300 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" />
                        <span>Refize</span>
                      </button>
                    </>
                  ) : (
                    <span
                      className={`text-xs font-semibold ${
                        pay.status === 'approved' ? 'text-[#38BDF8]' : 'text-red-400'
                      }`}
                    >
                      {pay.status === 'approved' ? 'Apwouve' : 'Refize'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Users */}
      <div className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-4 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#38BDF8]" />
          <h3 className="font-display text-base sm:text-lg font-bold text-white">
            Itilizatè Anrejistre ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <p className="text-xs sm:text-sm text-[#8B9BB4] py-4">
            Pa gen itilizatè anrejistre ankò.
          </p>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-white/[0.08] bg-[#090D18]/85 p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-white">{u.fullName}</span>
                    {u.vipCode && (
                      <span className="font-mono-tabular text-xs font-semibold text-[#D4AF37]">
                        · {u.vipCode}
                      </span>
                    )}
                    {u.blocked && (
                      <span className="text-xs font-semibold text-red-400">· Bloke</span>
                    )}
                  </div>
                  <div className="text-xs text-[#8B9BB4] flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate">{u.email}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-[#CBD5E1]">{u.songsPlayed || 0} mizik jwe</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        u.subscriptionStatus === 'active'
                          ? 'text-[#38BDF8] font-semibold'
                          : u.subscriptionStatus === 'pending'
                          ? 'text-amber-300 font-semibold'
                          : 'text-[#8B9BB4]'
                      }
                    >
                      {u.subscriptionStatus === 'active'
                        ? `Abòne (${u.subscriptionPlan === 'lifetime' ? '$150 À vie' : '$20/30j'})`
                        : u.subscriptionStatus === 'pending'
                        ? 'Peman an atant'
                        : 'Gratis'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {u.subscriptionStatus !== 'active' ? (
                    <>
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'approve_monthly')}
                        className="min-h-[38px] px-3 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-semibold text-white shadow-[0_0_12px_rgba(37,99,235,0.28)] transition-all"
                      >
                        Aktive $20/mwa
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUserAction(u.id, 'approve_lifetime')}
                        className="min-h-[38px] px-3 rounded-xl border border-[#D4AF37]/50 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 text-xs font-semibold text-[#D4AF37] transition-colors"
                      >
                        Aktive Lifetime
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUserAction(u.id, 'revoke')}
                      className="min-h-[38px] px-3 rounded-xl border border-white/15 hover:border-amber-500/40 text-xs font-semibold text-[#CBD5E1] hover:text-amber-300"
                    >
                      Retire Abònman
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleUserAction(u.id, u.blocked ? 'unblock' : 'block')}
                    className={`min-h-[38px] px-3 rounded-xl border text-xs font-semibold flex items-center gap-1 ${
                      u.blocked
                        ? 'border-[#38BDF8]/50 text-[#38BDF8]'
                        : 'border-red-500/30 text-red-300 hover:bg-red-500/10'
                    }`}
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>{u.blocked ? 'Debloke' : 'Bloke'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* API Keys Editor */}
      <form
        onSubmit={handleSaveKeys}
        className="rounded-3xl border border-white/[0.08] bg-[#0E1424]/85 backdrop-blur-md p-4 sm:p-6 space-y-4"
      >
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-[#38BDF8]" />
          <h3 className="font-display text-base sm:text-lg font-bold text-white">
            Konfigirasyon Kle API (YouTube & RapidAPI)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              YouTube Data API v3 Key
            </label>
            <input
              type="text"
              value={config.youtubeApiKey}
              onChange={(e) => setConfig((c) => ({ ...c, youtubeApiKey: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-xs font-mono-tabular text-white focus:border-[#38BDF8] focus:outline-none min-h-[44px]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              RapidAPI Key
            </label>
            <input
              type="text"
              value={config.rapidApiKey}
              onChange={(e) => setConfig((c) => ({ ...c, rapidApiKey: e.target.value }))}
              className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-xs font-mono-tabular text-white focus:border-[#38BDF8] focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
              RapidAPI Host (x-rapidapi-host)
            </label>
            <input
              type="text"
              value={config.rapidApiHost}
              onChange={(e) => setConfig((c) => ({ ...c, rapidApiHost: e.target.value }))}
              placeholder="youtube-mp36.p.rapidapi.com"
              className="w-full rounded-xl border border-white/[0.08] bg-[#070A12] px-3.5 py-2.5 text-xs font-mono-tabular text-white focus:border-[#38BDF8] focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {keysSavedMsg ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8]">
              <CheckCircle2 className="w-4 h-4" />
              {keysSavedMsg}
            </span>
          ) : (
            <span className="text-xs text-[#8B9BB4]">
              Chanjman yo aplike imedyatman pou tout rechèch ak telechajman MP3.
            </span>
          )}

          <button
            type="submit"
            disabled={savingKeys}
            className="min-h-[44px] px-5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-xs font-bold text-white flex items-center gap-2 shadow-[0_0_18px_rgba(37,99,235,0.3)] transition-all"
          >
            {savingKeys && <Loader2 className="w-4 h-4 animate-spin" />}
            <span>Anrejistre Kle API yo</span>
          </button>
        </div>
      </form>
    </section>
  );
};
