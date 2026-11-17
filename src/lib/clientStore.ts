import type {
  ApiConfig,
  PaymentRequest,
  SubscriptionPlan,
  UserProfile,
  VipCode,
} from '../types';
import {
  DEFAULT_RAPIDAPI_HOST,
  DEFAULT_RAPIDAPI_KEY,
  DEFAULT_YOUTUBE_API_KEY,
  isDeviceFreeDownloadClaimed,
  loadLocalAccounts,
  loadLocalUser,
  markDeviceFreeDownloadClaimed,
  saveLocalAccount,
  saveLocalUser,
} from './storage';

const STORE_USERS_KEY = 'wesley_store_users_v1';
const STORE_PAYMENTS_KEY = 'wesley_store_payments_v1';
const STORE_VIP_CODES_KEY = 'wesley_store_vip_codes_v1';
const STORE_API_CONFIG_KEY = 'wesley_store_api_config_v1';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const INITIAL_GIFT_CODES = ['WES-1001', 'WES-1002', 'WES-1003', 'WES-1004', 'WES-1005'];

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage quota errors
  }
}

export function normalizeRapidApiHost(rawHost?: string | null): string {
  const cleaned = String(rawHost || '')
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/+$/, '');
  if (!cleaned || cleaned === 'rapidapi.com' || cleaned === 'www.rapidapi.com') {
    return DEFAULT_RAPIDAPI_HOST;
  }
  return cleaned;
}

export function getApiConfigLocal(): ApiConfig {
  const stored = readJson<Partial<ApiConfig>>(STORE_API_CONFIG_KEY, {});
  return {
    youtubeApiKey: (stored.youtubeApiKey || '').trim() || DEFAULT_YOUTUBE_API_KEY,
    rapidApiKey: (stored.rapidApiKey || '').trim() || DEFAULT_RAPIDAPI_KEY,
    rapidApiHost: normalizeRapidApiHost(stored.rapidApiHost),
  };
}

export function saveApiConfigLocal(next: Partial<ApiConfig>): ApiConfig {
  const current = getApiConfigLocal();
  const updated: ApiConfig = {
    youtubeApiKey:
      typeof next.youtubeApiKey === 'string' && next.youtubeApiKey.trim()
        ? next.youtubeApiKey.trim()
        : current.youtubeApiKey || DEFAULT_YOUTUBE_API_KEY,
    rapidApiKey:
      typeof next.rapidApiKey === 'string' && next.rapidApiKey.trim()
        ? next.rapidApiKey.trim()
        : current.rapidApiKey || DEFAULT_RAPIDAPI_KEY,
    rapidApiHost:
      typeof next.rapidApiHost === 'string' && next.rapidApiHost.trim()
        ? normalizeRapidApiHost(next.rapidApiHost)
        : current.rapidApiHost || DEFAULT_RAPIDAPI_HOST,
  };
  writeJson(STORE_API_CONFIG_KEY, updated);
  return updated;
}

export function loadVipCodesLocal(): VipCode[] {
  const existing = readJson<VipCode[] | null>(STORE_VIP_CODES_KEY, null);
  if (Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const now = Date.now();
  const seeded: VipCode[] = INITIAL_GIFT_CODES.map((code, idx) => ({
    code,
    plan: 'monthly',
    createdAt: now - idx * 1000,
    usedByDeviceId: null,
    usedByEmail: null,
    usedByName: null,
    activatedAt: null,
    expiresAt: null,
    source: 'gift',
  }));
  writeJson(STORE_VIP_CODES_KEY, seeded);
  return seeded;
}

function saveVipCodesLocal(codes: VipCode[]): void {
  writeJson(STORE_VIP_CODES_KEY, codes);
}

export function loadPaymentsLocal(): PaymentRequest[] {
  const list = readJson<PaymentRequest[]>(STORE_PAYMENTS_KEY, []);
  return Array.isArray(list) ? list : [];
}

function savePaymentsLocal(payments: PaymentRequest[]): void {
  writeJson(STORE_PAYMENTS_KEY, payments);
}

export function enforceUserExpirationLocal(user: UserProfile): {
  user: UserProfile;
  expired: boolean;
} {
  if (
    user.subscriptionStatus === 'active' &&
    user.expiresAt !== null &&
    user.expiresAt !== undefined &&
    Date.now() > user.expiresAt
  ) {
    return {
      expired: true,
      user: {
        ...user,
        subscriptionStatus: 'free',
        subscriptionPlan: undefined,
        vipCode: undefined,
        vipDeviceId: undefined,
        expiresAt: null,
      },
    };
  }
  return { expired: false, user };
}

function loadUsersStoreRaw(): UserProfile[] {
  const storeUsers = readJson<UserProfile[]>(STORE_USERS_KEY, []);
  const users = Array.isArray(storeUsers) ? [...storeUsers] : [];
  const byEmail = new Map<string, number>();
  users.forEach((u, idx) => {
    if (u?.email) byEmail.set(u.email.toLowerCase(), idx);
  });

  // Merge any accounts saved in wesley_music_accounts_v1 or wesley_music_user_v1
  for (const acc of loadLocalAccounts()) {
    const emailKey = acc.email.toLowerCase();
    if (!byEmail.has(emailKey)) {
      byEmail.set(emailKey, users.length);
      users.push({
        ...acc.profile,
        password: acc.password || acc.profile.password,
      });
    } else {
      const idx = byEmail.get(emailKey)!;
      if (!users[idx].password && acc.password) {
        users[idx] = { ...users[idx], password: acc.password };
      }
    }
  }

  const activeUser = loadLocalUser();
  if (activeUser?.email) {
    const emailKey = activeUser.email.toLowerCase();
    if (!byEmail.has(emailKey)) {
      users.unshift(activeUser);
    }
  }

  return users;
}

function saveUsersStore(users: UserProfile[]): void {
  writeJson(STORE_USERS_KEY, users);
}

function syncProfileToSessionAndAccount(profile: UserProfile, password?: string): void {
  const existingAccounts = loadLocalAccounts();
  const matchedAccount = existingAccounts.find(
    (a) => a.email.toLowerCase() === profile.email.toLowerCase()
  );
  const resolvedPassword = password || matchedAccount?.password || profile.password || '';
  if (matchedAccount || resolvedPassword) {
    saveLocalAccount({
      fullName: profile.fullName,
      email: profile.email,
      password: resolvedPassword,
      profile,
    });
  }

  const active = loadLocalUser();
  if (active && active.email.toLowerCase() === profile.email.toLowerCase()) {
    saveLocalUser(profile);
  }
}

function sanitizeUserForClient(user: UserProfile): UserProfile {
  const { password: _pw, ...rest } = user;
  void _pw;
  return rest;
}

function generateUniqueVipCode(existingCodes: VipCode[]): string {
  const used = new Set(existingCodes.map((c) => c.code.toUpperCase()));
  for (let i = 0; i < 40; i++) {
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `WES-${num}`;
    if (!used.has(candidate)) return candidate;
  }
  return `WES-${Date.now().toString().slice(-5)}`;
}

export function registerLocalUser(params: {
  fullName: string;
  email: string;
  password: string;
  deviceId: string;
}): { ok: true; user: UserProfile } | { ok: false; error: string } {
  const fullName = params.fullName.trim();
  const email = params.email.trim().toLowerCase();
  const password = params.password;
  const deviceId = params.deviceId;

  if (!fullName || !email || !password) {
    return { ok: false, error: 'Veuillez remplir tous les champs.' };
  }

  const users = loadUsersStoreRaw();
  const existing = users.find((u) => u.email.toLowerCase() === email);
  if (existing) {
    return {
      ok: false,
      error: 'Un compte existe déjà avec cet e-mail. Veuillez vous connecter.',
    };
  }

  const deviceClaimed = isDeviceFreeDownloadClaimed(deviceId);
  const nowIso = new Date().toISOString();
  const created: UserProfile = {
    id: `usr_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    fullName,
    email,
    password,
    deviceId,
    songsPlayed: 0,
    subscriptionStatus: 'free',
    expiresAt: null,
    freeDownloadsLeft: deviceClaimed ? 0 : 1,
    blocked: false,
    createdAt: nowIso,
    lastActiveAt: nowIso,
  };

  users.unshift(created);
  saveUsersStore(users);

  const clientProfile = sanitizeUserForClient(created);
  saveLocalAccount({ fullName, email, password, profile: clientProfile });
  saveLocalUser(clientProfile);

  return { ok: true, user: clientProfile };
}

export function loginLocalUser(params: {
  email: string;
  password: string;
  deviceId: string;
}): { ok: true; user: UserProfile; expired: boolean } | { ok: false; error: string } {
  const email = params.email.trim().toLowerCase();
  const password = params.password;
  const deviceId = params.deviceId;

  const users = loadUsersStoreRaw();
  const idx = users.findIndex((u) => u.email.toLowerCase() === email);
  const accounts = loadLocalAccounts();
  const accMatch = accounts.find((a) => a.email.toLowerCase() === email);

  if (idx < 0 && !accMatch) {
    return { ok: false, error: 'Aucun compte trouvé avec cet e-mail.' };
  }

  const storedPassword =
    (idx >= 0 ? users[idx].password : undefined) ?? accMatch?.password;
  if (storedPassword && storedPassword !== password) {
    return { ok: false, error: 'Mot de passe incorrect.' };
  }

  const baseProfile: UserProfile =
    idx >= 0 ? users[idx] : { ...accMatch!.profile, password: accMatch!.password };

  const checked = enforceUserExpirationLocal(baseProfile);
  const deviceClaimed = isDeviceFreeDownloadClaimed(deviceId);
  const updatedWithPass: UserProfile = {
    ...checked.user,
    deviceId: deviceId || checked.user.deviceId,
    freeDownloadsLeft: deviceClaimed
      ? 0
      : typeof checked.user.freeDownloadsLeft === 'number'
      ? checked.user.freeDownloadsLeft
      : 1,
    lastActiveAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    users[idx] = updatedWithPass;
  } else {
    users.unshift(updatedWithPass);
  }
  saveUsersStore(users);

  const clientProfile = sanitizeUserForClient(updatedWithPass);
  syncProfileToSessionAndAccount(clientProfile, storedPassword || password);
  saveLocalUser(clientProfile);

  return { ok: true, user: clientProfile, expired: checked.expired };
}

export function syncLocalUser(
  email: string,
  deviceId: string
): { user: UserProfile | null; expired: boolean } {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return { user: null, expired: false };

  const users = loadUsersStoreRaw();
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  const localCurrent = loadLocalUser();

  const source =
    idx >= 0
      ? users[idx]
      : localCurrent && localCurrent.email.toLowerCase() === normalizedEmail
      ? localCurrent
      : null;

  if (!source) return { user: null, expired: false };

  const checked = enforceUserExpirationLocal(source);
  const deviceClaimed = isDeviceFreeDownloadClaimed(deviceId);
  const normalized: UserProfile = {
    ...checked.user,
    deviceId: checked.user.deviceId || deviceId,
    freeDownloadsLeft: deviceClaimed
      ? 0
      : typeof checked.user.freeDownloadsLeft === 'number'
      ? checked.user.freeDownloadsLeft
      : 1,
  };

  if (idx >= 0) {
    users[idx] = normalized;
  } else {
    users.unshift(normalized);
  }
  saveUsersStore(users);

  const clientProfile = sanitizeUserForClient(normalized);
  syncProfileToSessionAndAccount(clientProfile);

  return { user: clientProfile, expired: checked.expired };
}

export function recordLocalTrackPlay(email: string): void {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) return;
  const users = loadUsersStoreRaw();
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);
  if (idx >= 0) {
    users[idx] = {
      ...users[idx],
      songsPlayed: (users[idx].songsPlayed || 0) + 1,
      lastActiveAt: new Date().toISOString(),
    };
    saveUsersStore(users);
    syncProfileToSessionAndAccount(sanitizeUserForClient(users[idx]));
  }
}

export function claimLocalFreeDownload(email: string, deviceId: string): UserProfile | null {
  markDeviceFreeDownloadClaimed(deviceId);
  const normalizedEmail = email.trim().toLowerCase();
  const users = loadUsersStoreRaw();
  const idx = users.findIndex((u) => u.email.toLowerCase() === normalizedEmail);

  if (idx >= 0) {
    users[idx] = {
      ...users[idx],
      freeDownloadsLeft: 0,
      lastActiveAt: new Date().toISOString(),
    };
    saveUsersStore(users);
    const clientProfile = sanitizeUserForClient(users[idx]);
    syncProfileToSessionAndAccount(clientProfile);
    saveLocalUser(clientProfile);
    return clientProfile;
  }

  const localCurrent = loadLocalUser();
  if (localCurrent) {
    const updated: UserProfile = { ...localCurrent, freeDownloadsLeft: 0 };
    saveLocalUser(updated);
    syncProfileToSessionAndAccount(updated);
    return updated;
  }
  return null;
}

export function activateLocalVipCode(params: {
  code: string;
  email: string;
  fullName: string;
  deviceId: string;
}):
  | { ok: true; user: UserProfile; message: string }
  | { ok: false; error: string } {
  const cleanedCode = params.code.trim().toUpperCase();
  const email = params.email.trim().toLowerCase();
  const fullName = params.fullName.trim();
  const deviceId = params.deviceId.trim();

  if (!cleanedCode) {
    return { ok: false, error: 'Veuillez entrer un Code VIP.' };
  }

  const vipCodes = loadVipCodesLocal();
  const codeIdx = vipCodes.findIndex((c) => c.code.toUpperCase() === cleanedCode);
  if (codeIdx < 0) {
    return { ok: false, error: '⛔ Code VIP invalide ou introuvable.' };
  }

  const vip = vipCodes[codeIdx];

  // Strict 1 Code VIP = 1 Téléphone Seulement Lock
  if (vip.usedByDeviceId && vip.usedByDeviceId !== deviceId) {
    return {
      ok: false,
      error:
        '⛔ Ce code VIP a déjà été utilisé sur un autre téléphone. Veuillez acheter un nouveau code VIP.',
    };
  }

  // Check if same-device code is already expired
  if (vip.usedByDeviceId === deviceId && vip.expiresAt && Date.now() > vip.expiresAt) {
    return {
      ok: false,
      error: 'Ce code VIP de 30 jours a expiré. Veuillez acheter un nouveau code VIP.',
    };
  }

  const now = Date.now();
  const expiresAt =
    vip.plan === 'lifetime'
      ? null
      : vip.usedByDeviceId === deviceId && vip.expiresAt
      ? vip.expiresAt
      : now + THIRTY_DAYS_MS;

  vipCodes[codeIdx] = {
    ...vip,
    usedByDeviceId: deviceId,
    usedByEmail: email || vip.usedByEmail,
    usedByName: fullName || vip.usedByName,
    activatedAt: vip.activatedAt || now,
    expiresAt,
  };
  saveVipCodesLocal(vipCodes);

  const users = loadUsersStoreRaw();
  let userIdx = users.findIndex((u) => u.email.toLowerCase() === email);
  const localCurrent = loadLocalUser();

  const existingUser: UserProfile =
    userIdx >= 0
      ? users[userIdx]
      : localCurrent && localCurrent.email.toLowerCase() === email
      ? localCurrent
      : {
          id: `usr_${now.toString(36)}`,
          fullName: fullName || 'Membre VIP',
          email,
          deviceId,
          songsPlayed: 0,
          subscriptionStatus: 'free',
          blocked: false,
          createdAt: new Date(now).toISOString(),
          lastActiveAt: new Date(now).toISOString(),
        };

  const updatedUser: UserProfile = {
    ...existingUser,
    deviceId,
    subscriptionStatus: 'active',
    subscriptionPlan: vip.plan,
    vipCode: vip.code,
    vipDeviceId: deviceId,
    expiresAt,
    lastActiveAt: new Date(now).toISOString(),
  };

  if (userIdx >= 0) {
    users[userIdx] = updatedWithOptionalPass(users[userIdx], updatedUser);
  } else {
    users.unshift(updatedUser);
  }
  saveUsersStore(users);

  const clientProfile = sanitizeUserForClient(updatedUser);
  syncProfileToSessionAndAccount(clientProfile);
  saveLocalUser(clientProfile);

  return {
    ok: true,
    user: clientProfile,
    message: '🎉 KAPBOUM ! Votre accès VIP est activé sur cet appareil !',
  };
}

function updatedWithOptionalPass(prev: UserProfile, next: UserProfile): UserProfile {
  return {
    ...next,
    password: next.password ?? prev.password,
  };
}

export function submitLocalPayment(params: {
  email: string;
  fullName: string;
  deviceId: string;
  region: 'ayiti' | 'diaspora';
  phone: string;
  transactionCode: string;
  plan: SubscriptionPlan;
}): { ok: true; user: UserProfile; payment: PaymentRequest } {
  const email = params.email.trim().toLowerCase();
  const fullName = params.fullName.trim();
  const deviceId = params.deviceId.trim();
  const now = new Date().toISOString();

  const users = loadUsersStoreRaw();
  const userIdx = users.findIndex((u) => u.email.toLowerCase() === email);
  const localCurrent = loadLocalUser();

  const targetUser: UserProfile =
    userIdx >= 0
      ? users[userIdx]
      : localCurrent || {
          id: `usr_${Date.now().toString(36)}`,
          fullName: fullName || 'Itilizatè',
          email,
          deviceId,
          songsPlayed: 0,
          subscriptionStatus: 'free',
          blocked: false,
          createdAt: now,
          lastActiveAt: now,
        };

  const updatedUser: UserProfile = {
    ...targetUser,
    deviceId: deviceId || targetUser.deviceId,
    subscriptionStatus:
      targetUser.subscriptionStatus === 'active' ? 'active' : 'pending',
    subscriptionPlan:
      targetUser.subscriptionStatus === 'active'
        ? targetUser.subscriptionPlan
        : params.plan,
    lastActiveAt: now,
  };

  if (userIdx >= 0) {
    users[userIdx] = updatedWithOptionalPass(users[userIdx], updatedUser);
  } else {
    users.unshift(updatedUser);
  }
  saveUsersStore(users);

  const payments = loadPaymentsLocal();
  const newPayment: PaymentRequest = {
    id: `pay_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    userId: updatedUser.id,
    userName: updatedUser.fullName,
    userEmail: updatedUser.email,
    deviceId,
    region: params.region,
    phone: params.phone.trim(),
    transactionCode: params.transactionCode.trim(),
    plan: params.plan,
    amountUsd: params.plan === 'lifetime' ? 150 : 20,
    status: 'pending',
    createdAt: now,
  };
  payments.unshift(newPayment);
  savePaymentsLocal(payments);

  const clientProfile = sanitizeUserForClient(updatedUser);
  syncProfileToSessionAndAccount(clientProfile);
  saveLocalUser(clientProfile);

  return { ok: true, user: clientProfile, payment: newPayment };
}

export function getAdminOverviewLocal(): {
  users: UserProfile[];
  payments: PaymentRequest[];
  vipCodes: VipCode[];
  config: ApiConfig;
} {
  const rawUsers = loadUsersStoreRaw();
  let mutated = false;
  const users = rawUsers.map((u) => {
    const check = enforceUserExpirationLocal(u);
    if (check.expired) mutated = true;
    return check.user;
  });
  if (mutated) {
    saveUsersStore(users);
  }

  return {
    users: users.map(sanitizeUserForClient),
    payments: loadPaymentsLocal(),
    vipCodes: loadVipCodesLocal(),
    config: getApiConfigLocal(),
  };
}

export function performAdminUserActionLocal(
  userId: string,
  action: 'approve_monthly' | 'approve_lifetime' | 'revoke' | 'block' | 'unblock'
): { users: UserProfile[]; vipCodes: VipCode[] } {
  const users = loadUsersStoreRaw();
  const vipCodes = loadVipCodesLocal();
  const idx = users.findIndex((u) => u.id === userId);

  if (idx >= 0) {
    const user = users[idx];
    const now = Date.now();

    if (action === 'approve_monthly' || action === 'approve_lifetime') {
      const plan: SubscriptionPlan = action === 'approve_lifetime' ? 'lifetime' : 'monthly';
      const expiresAt = plan === 'lifetime' ? null : now + THIRTY_DAYS_MS;
      const newCode = generateUniqueVipCode(vipCodes);
      const lockedDeviceId = user.deviceId || `dev_admin_${user.id}`;

      vipCodes.unshift({
        code: newCode,
        plan,
        createdAt: now,
        usedByDeviceId: lockedDeviceId,
        usedByEmail: user.email,
        usedByName: user.fullName,
        activatedAt: now,
        expiresAt,
        source: 'payment',
      });

      users[idx] = {
        ...user,
        subscriptionStatus: 'active',
        subscriptionPlan: plan,
        vipCode: newCode,
        vipDeviceId: lockedDeviceId,
        expiresAt,
      };
    } else if (action === 'revoke') {
      users[idx] = {
        ...user,
        subscriptionStatus: 'free',
        subscriptionPlan: undefined,
        vipCode: undefined,
        vipDeviceId: undefined,
        expiresAt: null,
      };
    } else if (action === 'block') {
      users[idx] = { ...user, blocked: true };
    } else if (action === 'unblock') {
      users[idx] = { ...user, blocked: false };
    }

    saveUsersStore(users);
    saveVipCodesLocal(vipCodes);
    syncProfileToSessionAndAccount(sanitizeUserForClient(users[idx]));
  }

  return {
    users: users.map(sanitizeUserForClient),
    vipCodes,
  };
}

export function performAdminPaymentActionLocal(
  paymentId: string,
  action: 'approve' | 'reject'
): { users: UserProfile[]; payments: PaymentRequest[]; vipCodes: VipCode[] } {
  const users = loadUsersStoreRaw();
  const payments = loadPaymentsLocal();
  const vipCodes = loadVipCodesLocal();
  const payIdx = payments.findIndex((p) => p.id === paymentId);

  if (payIdx >= 0) {
    const payment = payments[payIdx];
    const userIdx = users.findIndex(
      (u) =>
        u.id === payment.userId ||
        u.email.toLowerCase() === payment.userEmail.toLowerCase()
    );

    if (action === 'approve') {
      const now = Date.now();
      const expiresAt = payment.plan === 'lifetime' ? null : now + THIRTY_DAYS_MS;
      const newCode = generateUniqueVipCode(vipCodes);
      const lockedDeviceId =
        payment.deviceId ||
        (userIdx >= 0 ? users[userIdx].deviceId : undefined) ||
        `dev_pay_${payment.id}`;

      vipCodes.unshift({
        code: newCode,
        plan: payment.plan,
        createdAt: now,
        usedByDeviceId: lockedDeviceId,
        usedByEmail: payment.userEmail,
        usedByName: payment.userName,
        activatedAt: now,
        expiresAt,
        source: 'payment',
      });

      payments[payIdx] = {
        ...payment,
        status: 'approved',
        generatedVipCode: newCode,
      };

      if (userIdx >= 0) {
        users[userIdx] = {
          ...users[userIdx],
          subscriptionStatus: 'active',
          subscriptionPlan: payment.plan,
          vipCode: newCode,
          vipDeviceId: lockedDeviceId,
          expiresAt,
        };
        syncProfileToSessionAndAccount(sanitizeUserForClient(users[userIdx]));
      }
    } else {
      payments[payIdx] = { ...payment, status: 'rejected' };
      if (userIdx >= 0 && users[userIdx].subscriptionStatus === 'pending') {
        users[userIdx] = {
          ...users[userIdx],
          subscriptionStatus: 'free',
          subscriptionPlan: undefined,
        };
        syncProfileToSessionAndAccount(sanitizeUserForClient(users[userIdx]));
      }
    }

    savePaymentsLocal(payments);
    saveUsersStore(users);
    saveVipCodesLocal(vipCodes);
  }

  return {
    users: users.map(sanitizeUserForClient),
    payments,
    vipCodes,
  };
}

export function createAdminVipCodeLocal(
  plan: SubscriptionPlan,
  customCode?: string
): { ok: true; vipCodes: VipCode[] } | { ok: false; error: string } {
  const vipCodes = loadVipCodesLocal();
  const cleanedCustom = customCode ? customCode.trim().toUpperCase() : '';
  const code = cleanedCustom || generateUniqueVipCode(vipCodes);

  if (vipCodes.some((c) => c.code.toUpperCase() === code)) {
    return { ok: false, error: `Le code ${code} existe déjà.` };
  }

  vipCodes.unshift({
    code,
    plan,
    createdAt: Date.now(),
    usedByDeviceId: null,
    usedByEmail: null,
    usedByName: null,
    activatedAt: null,
    expiresAt: null,
    source: 'gift',
  });
  saveVipCodesLocal(vipCodes);
  return { ok: true, vipCodes };
}

export function performAdminVipCodeActionLocal(
  code: string,
  action: 'reset' | 'delete'
): VipCode[] {
  const normalized = code.trim().toUpperCase();
  let vipCodes = loadVipCodesLocal();

  if (action === 'delete') {
    vipCodes = vipCodes.filter((c) => c.code.toUpperCase() !== normalized);
  } else if (action === 'reset') {
    vipCodes = vipCodes.map((c) =>
      c.code.toUpperCase() === normalized
        ? {
            ...c,
            usedByDeviceId: null,
            usedByEmail: null,
            usedByName: null,
            activatedAt: null,
            expiresAt: null,
          }
        : c
    );
  }

  saveVipCodesLocal(vipCodes);
  return vipCodes;
}
