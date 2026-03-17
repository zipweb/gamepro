import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/billing-data.json');

function ensureFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(
      DATA_PATH,
      JSON.stringify(
        {
          plans: [
            { id: 'plan-monthly', key: 'monthly', interval: 'month', stripePriceId: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_monthly' },
            { id: 'plan-yearly', key: 'yearly', interval: 'year', stripePriceId: process.env.STRIPE_YEARLY_PRICE_ID || 'price_yearly' }
          ],
          subscriptions: [],
          checkoutSessions: [],
          customers: [],
          config: {
            customerPortalUrl: process.env.STRIPE_CUSTOMER_PORTAL_URL || '',
            stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
            stripePublishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
            billingEnabled: true
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

export const paymentsRepository = {
  getPlans() {
    return readData().plans;
  },
  getPlanByKey(key) {
    return readData().plans.find((p) => p.key === key) || null;
  },
  getConfig() {
    return readData().config;
  },
  updateConfig(configPatch) {
    const data = readData();
    data.config = { ...data.config, ...configPatch };
    writeData(data);
    return data.config;
  },
  saveCheckoutSession(row) {
    const data = readData();
    data.checkoutSessions.push(row);
    writeData(data);
    return row;
  },
  saveCustomer(row) {
    const data = readData();
    const idx = data.customers.findIndex((c) => c.email.toLowerCase() === row.email.toLowerCase());
    if (idx >= 0) data.customers[idx] = { ...data.customers[idx], ...row, updatedAt: new Date().toISOString() };
    else data.customers.push({ ...row, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    writeData(data);
  },
  getCustomerByEmail(email) {
    return readData().customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
  },
  upsertSubscription(row) {
    const data = readData();
    const idx = data.subscriptions.findIndex((s) => s.stripeSubscriptionId === row.stripeSubscriptionId);
    const normalized = {
      ...row,
      updatedAt: new Date().toISOString()
    };
    if (idx >= 0) data.subscriptions[idx] = { ...data.subscriptions[idx], ...normalized };
    else data.subscriptions.push({ ...normalized, createdAt: new Date().toISOString() });
    writeData(data);
    return idx >= 0 ? data.subscriptions[idx] : data.subscriptions.at(-1);
  },
  listSubscriptions() {
    return readData().subscriptions;
  },
  findSubscriptionByUserId(userId) {
    const data = readData();
    const subs = data.subscriptions.filter((s) => s.userId === userId);
    return subs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] || null;
  },
  findSubscriptionByStripeId(stripeSubscriptionId) {
    return readData().subscriptions.find((s) => s.stripeSubscriptionId === stripeSubscriptionId) || null;
  }
};
