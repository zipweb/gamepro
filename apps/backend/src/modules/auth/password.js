import crypto from 'node:crypto';

const SALT_BYTES = 16;

// PBKDF2 fallback implementation used when bcrypt package is unavailable in this environment.
export function hashPassword(plainPassword) {
  const salt = crypto.randomBytes(SALT_BYTES).toString('hex');
  const hash = crypto.pbkdf2Sync(plainPassword, salt, 100000, 64, 'sha512').toString('hex');
  return `pbkdf2$${salt}$${hash}`;
}

export function verifyPassword(plainPassword, storedHash) {
  const [scheme, salt, hash] = String(storedHash).split('$');
  if (scheme !== 'pbkdf2' || !salt || !hash) return false;
  const calculated = crypto.pbkdf2Sync(plainPassword, salt, 100000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(calculated), Buffer.from(hash));
}
