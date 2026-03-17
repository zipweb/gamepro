import crypto from 'node:crypto';

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function parseDuration(duration, fallbackSeconds) {
  if (!duration) return fallbackSeconds;
  const match = String(duration).match(/^(\d+)([smhd])$/);
  if (!match) return fallbackSeconds;
  const value = Number(match[1]);
  const unit = match[2];
  const factor = unit === 's' ? 1 : unit === 'm' ? 60 : unit === 'h' ? 3600 : 86400;
  return value * factor;
}

export function signJwt(payload, secret, expiresIn = '15m') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const exp = now + parseDuration(expiresIn, 900);
  const body = { ...payload, iat: now, exp };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

export function verifyJwt(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const [h, p, s] = parts;
  const data = `${h}.${p}`;
  const expected = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(s))) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) throw new Error('Token expired');
  return payload;
}
