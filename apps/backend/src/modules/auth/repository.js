import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/auth-users.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) fs.writeFileSync(DATA_PATH, JSON.stringify({ users: [], refreshTokens: [] }, null, 2));
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export const authRepository = {
  findUserByEmail(email) {
    const data = readData();
    return data.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && !u.deletedAt) || null;
  },
  listUsers() {
    return readData().users;
  },
  findUserById(id) {
    const data = readData();
    return data.users.find((u) => u.id === id && !u.deletedAt) || null;
  },
  saveUser(user) {
    const data = readData();
    const idx = data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) data.users[idx] = user;
    else data.users.push(user);
    writeData(data);
    return user;
  },
  findUserByResetToken(tokenHash) {
    const data = readData();
    return data.users.find((u) => u.resetPasswordToken === tokenHash && !u.resetPasswordUsedAt && !u.deletedAt) || null;
  },
  storeRefreshToken(tokenRow) {
    const data = readData();
    data.refreshTokens.push(tokenRow);
    writeData(data);
  },
  findRefreshToken(tokenHash) {
    const data = readData();
    return data.refreshTokens.find((r) => r.tokenHash === tokenHash && !r.revokedAt) || null;
  },
  revokeRefreshToken(tokenHash) {
    const data = readData();
    const row = data.refreshTokens.find((r) => r.tokenHash === tokenHash && !r.revokedAt);
    if (row) row.revokedAt = new Date().toISOString();
    writeData(data);
  }
};
