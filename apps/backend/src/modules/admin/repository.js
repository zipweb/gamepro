import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_PATH = path.resolve(process.cwd(), 'data/admin-data.json');

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(
        {
          activities: [],
          checkoutPages: [],
          emailTemplates: [
            {
              id: 'tpl-welcome-default',
              name: 'Welcome Template',
              subject: 'Welcome to LMS',
              logoUrl: '',
              colors: { primary: '#2b7cff', secondary: '#ffffff', button: '#2b7cff' },
              buttons: [{ label: 'Login', url: 'http://localhost:3000/login' }],
              content: '<p>Welcome to our LMS platform</p>',
              updatedAt: new Date().toISOString(),
              createdAt: new Date().toISOString()
            }
          ],
          files: [],
          outboundEmails: [],
          emailSettings: {
            host: process.env.SMTP_HOST || '',
            port: process.env.SMTP_PORT || '1025',
            user: process.env.SMTP_USER || '',
            password: process.env.SMTP_PASS || ''
          },
          brandingByTenant: {
            default: {
              tenantId: 'default',
              logoUrl: '',
              faviconUrl: '',
              primaryColor: '#7c5cff',
              secondaryColor: '#1f2a46',
              accentColor: '#29d3ff',
              backgroundColor: '#0b1020',
              textColor: '#e6ecff',
              fontFamily: 'Inter, system-ui, sans-serif'
            }
          }
        },
        null,
        2
      )
    );
  }
}

function readData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

function stamp(row) {
  const now = new Date().toISOString();
  return { id: row.id || crypto.randomUUID(), createdAt: row.createdAt || now, updatedAt: now, ...row };
}

export const adminRepository = {
  logActivity(activity) {
    const data = readData();
    data.activities.unshift(stamp(activity));
    data.activities = data.activities.slice(0, 100);
    writeData(data);
  },
  listActivities() {
    return readData().activities;
  },
  listCheckoutPages() {
    return readData().checkoutPages;
  },
  saveCheckoutPage(page) {
    const data = readData();
    const row = stamp(page);
    const idx = data.checkoutPages.findIndex((x) => x.id === row.id);
    if (idx >= 0) data.checkoutPages[idx] = row;
    else data.checkoutPages.push(row);
    writeData(data);
    return row;
  },
  listEmailTemplates() {
    return readData().emailTemplates;
  },
  getEmailSettings() {
    return readData().emailSettings || { host: '', port: '1025', user: '', password: '' };
  },
  saveEmailSettings(settings) {
    const data = readData();
    data.emailSettings = { ...data.emailSettings, ...settings };
    writeData(data);
    return data.emailSettings;
  },
  saveEmailTemplate(template) {
    const data = readData();
    const row = stamp(template);
    const idx = data.emailTemplates.findIndex((x) => x.id === row.id);
    if (idx >= 0) data.emailTemplates[idx] = row;
    else data.emailTemplates.push(row);
    writeData(data);
    return row;
  },
  listFiles() {
    return readData().files;
  },
  saveFile(file) {
    const data = readData();
    const row = stamp(file);
    data.files.push(row);
    writeData(data);
    return row;
  },
  logOutboundEmail(email) {
    const data = readData();
    data.outboundEmails.push(stamp(email));
    writeData(data);
  },

  getBranding(tenantId = 'default') {
    const data = readData();
    const map = data.brandingByTenant || {};
    const fallback = map.default || {
      tenantId: 'default',
      logoUrl: '',
      faviconUrl: '',
      primaryColor: '#7c5cff',
      secondaryColor: '#1f2a46',
      accentColor: '#29d3ff',
      backgroundColor: '#0b1020',
      textColor: '#e6ecff',
      fontFamily: 'Inter, system-ui, sans-serif'
    };
    return { ...fallback, ...(map[tenantId] || {}), tenantId };
  },
  saveBranding(tenantId = 'default', patch = {}) {
    const data = readData();
    data.brandingByTenant = data.brandingByTenant || {};
    const current = this.getBranding(tenantId);
    data.brandingByTenant[tenantId] = { ...current, ...patch, tenantId };
    writeData(data);
    return data.brandingByTenant[tenantId];
  },
};
