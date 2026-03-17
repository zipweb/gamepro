import crypto from 'node:crypto';
import { authRepository } from './repository.js';
import { hashPassword, verifyPassword } from './password.js';
import { signJwt, verifyJwt } from './jwt.js';
import { sendPasswordResetEmail } from './email.js';
import { getAccessStateForUser } from '../payments/service.js';
import { gamificationService } from '../gamification/service.js';

const ACCESS_TTL = process.env.ACCESS_TOKEN_TTL ?? '15m';
const REFRESH_TTL = process.env.REFRESH_TOKEN_TTL ?? '30d';
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'dev_access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const loginAttempts = new Map();

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function generateResetToken() {
  return crypto.randomBytes(48).toString('hex');
}

function rateLimitKey(email, ip) {
  return `${email.toLowerCase()}::${ip ?? 'unknown'}`;
}

export function assertLoginRateLimit(email, ip) {
  const key = rateLimitKey(email, ip);
  const now = Date.now();
  const record = loginAttempts.get(key) ?? { count: 0, start: now };
  if (now - record.start > 10 * 60 * 1000) {
    loginAttempts.set(key, { count: 0, start: now });
    return;
  }
  if (record.count >= 10) throw new Error('Too many attempts. Try again later.');
}

function markFailedAttempt(email, ip) {
  const key = rateLimitKey(email, ip);
  const now = Date.now();
  const record = loginAttempts.get(key) ?? { count: 0, start: now };
  record.count += 1;
  loginAttempts.set(key, record);
}

function clearAttempts(email, ip) {
  loginAttempts.delete(rateLimitKey(email, ip));
}

function issueTokens(user, tenantId) {
  const accessToken = signJwt({ sub: user.id, role: user.globalRole, tenantId, type: 'access' }, ACCESS_SECRET, ACCESS_TTL);
  const refreshToken = signJwt({ sub: user.id, role: user.globalRole, tenantId, type: 'refresh' }, REFRESH_SECRET, REFRESH_TTL);
  authRepository.storeRefreshToken({
    userId: user.id,
    tenantId,
    tokenHash: sha256(refreshToken),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    revokedAt: null
  });
  return { accessToken, refreshToken };
}


export function sanitizeUser(user) {
  if (!user) return null;
  const { password, passwordHash, resetPasswordToken, resetPasswordExpires, resetPasswordUsedAt, ...safe } = user;
  return safe;
}

export function login({ email, password, tenantId, ip }) {
  assertLoginRateLimit(email, ip);
  const user = authRepository.findUserByEmail(email);
  if (!user || user.status !== 'ACTIVE') {
    markFailedAttempt(email, ip);
    throw new Error('Invalid credentials');
  }
  const storedPassword = user.password || user.passwordHash;
  if (!storedPassword || !verifyPassword(password, storedPassword)) {
    markFailedAttempt(email, ip);
    throw new Error('Invalid credentials');
  }
  clearAttempts(email, ip);
  gamificationService.awardDailyLogin(user.id);
  return { user: sanitizeUser(user), access: getAccessStateForUser(user), ...issueTokens(user, tenantId) };
}

export function refresh(refreshToken) {
  const payload = verifyJwt(refreshToken, REFRESH_SECRET);
  if (payload.type !== 'refresh') throw new Error('Invalid refresh token');
  const row = authRepository.findRefreshToken(sha256(refreshToken));
  if (!row) throw new Error('Refresh token revoked');
  const user = authRepository.findUserById(payload.sub);
  if (!user) throw new Error('User not found');
  authRepository.revokeRefreshToken(sha256(refreshToken));
  return { user: sanitizeUser(user), access: getAccessStateForUser(user), ...issueTokens(user, payload.tenantId) };
}

export function logout(refreshToken) {
  authRepository.revokeRefreshToken(sha256(refreshToken));
}

export function getMe(accessToken) {
  const payload = verifyJwt(accessToken, ACCESS_SECRET);
  if (payload.type !== 'access') throw new Error('Invalid access token');
  const user = authRepository.findUserById(payload.sub);
  if (!user) throw new Error('User not found');
  return { user: sanitizeUser(user), access: getAccessStateForUser(user), tenantId: payload.tenantId };
}

export function forgotPassword(email) {
  const user = authRepository.findUserByEmail(email);
  if (!user) return { ok: true };
  const token = generateResetToken();
  user.resetPasswordToken = sha256(token);
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  user.resetPasswordUsedAt = null;
  authRepository.saveUser(user);

  const resetLink = `${APP_URL}/reset-password?token=${token}`;
  sendPasswordResetEmail({ to: user.email, resetLink });
  return { ok: true };
}

export function resetPassword({ token, newPassword }) {
  const hashed = sha256(token);
  const user = authRepository.findUserByResetToken(hashed);
  if (!user) throw new Error('Invalid reset token');
  if (!user.resetPasswordExpires || new Date(user.resetPasswordExpires).getTime() < Date.now()) throw new Error('Reset token expired');
  const newHash = hashPassword(newPassword);
  user.password = newHash;
  user.passwordHash = newHash;
  user.resetPasswordUsedAt = new Date().toISOString();
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  user.updatedAt = new Date().toISOString();
  authRepository.saveUser(user);
  return { ok: true };
}


export function seedAdminIfEmpty() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) return;
  const existing = authRepository.findUserByEmail(adminEmail);
  if (existing) return;
  const seedHash = hashPassword(adminPassword);
  authRepository.saveUser({
    id: crypto.randomUUID(),
    email: adminEmail,
    password: seedHash,
    passwordHash: seedHash,
    status: 'ACTIVE',
    globalRole: 'ADMIN',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    resetPasswordToken: null,
    resetPasswordExpires: null,
    resetPasswordUsedAt: null
  });
}
