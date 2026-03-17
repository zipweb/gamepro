import fs from 'node:fs';
import path from 'node:path';

const LOG_PATH = path.resolve(process.cwd(), 'data/email-log.json');

function appendEmailLog(entry) {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const existing = fs.existsSync(LOG_PATH) ? JSON.parse(fs.readFileSync(LOG_PATH, 'utf8')) : [];
  existing.push(entry);
  fs.writeFileSync(LOG_PATH, JSON.stringify(existing, null, 2));
}

export function sendPasswordResetEmail({ to, resetLink }) {
  const subject = 'Reset your LMS password';
  const html = `<p>You requested a password reset.</p><p><a href="${resetLink}">Reset Password</a></p>`;
  appendEmailLog({
    templateKey: 'password_reset',
    to,
    subject,
    html,
    provider: 'smtp',
    host: process.env.SMTP_HOST ?? 'localhost',
    port: process.env.SMTP_PORT ?? '1025',
    createdAt: new Date().toISOString()
  });
  console.log(`[email] password-reset -> ${to}: ${resetLink}`);
}


export function sendWelcomeEmail({ to, loginEmail, generatedPassword, loginLink }) {
  const subject = 'Welcome to LMS Platform';
  const html = `<p>Welcome!</p><p>Login: ${loginEmail}</p><p>Password: ${generatedPassword}</p><p><a href="${loginLink}">Login here</a></p>`;
  appendEmailLog({
    templateKey: 'welcome_student',
    to,
    subject,
    html,
    provider: 'smtp',
    host: process.env.SMTP_HOST ?? 'localhost',
    port: process.env.SMTP_PORT ?? '1025',
    createdAt: new Date().toISOString()
  });
  console.log(`[email] welcome -> ${to}`);
}
