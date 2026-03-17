import crypto from 'node:crypto';
import { paymentsRepository } from './repository.js';
import { authRepository } from '../auth/repository.js';
import { hashPassword } from '../auth/password.js';
import { sendWelcomeEmail } from '../auth/email.js';
import { coursesRepository } from '../courses/repository.js';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function randomPassword() {
  return crypto.randomBytes(9).toString('base64url');
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function getAccessStateForUser(user) {
  const cfg = paymentsRepository.getConfig();
  if (cfg.billingEnabled === false) return { status: 'active', warning: null, blocked: false };
  if (!user || user.globalRole === 'ADMIN') return { status: 'active', warning: null, blocked: false };
  const sub = paymentsRepository.findSubscriptionByUserId(user.id);
  if (!sub) return { status: 'blocked', warning: 'No active subscription', blocked: true };

  if (sub.status === 'active') return { status: 'active', warning: null, blocked: false };
  if (sub.status === 'past_due') {
    const graceEnd = sub.gracePeriodEndsAt ? new Date(sub.gracePeriodEndsAt).getTime() : 0;
    if (graceEnd > Date.now()) {
      return { status: 'past_due', warning: `Payment failed. Grace period until ${sub.gracePeriodEndsAt}`, blocked: false };
    }
    return { status: 'blocked', warning: 'Grace period ended', blocked: true };
  }
  return { status: 'blocked', warning: 'Subscription canceled', blocked: true };
}

async function createStripeCheckoutSession(priceId, customerEmail) {
  const cfg = paymentsRepository.getConfig();
  const stripeSecret = cfg.stripeSecretKey || process.env.STRIPE_SECRET_KEY || '';
  if (!stripeSecret) {
    return { url: `${APP_URL}/paywall?mockCheckout=1`, id: `cs_test_${crypto.randomUUID()}` };
  }

  const body = new URLSearchParams();
  body.set('mode', 'subscription');
  body.set('line_items[0][price]', priceId);
  body.set('line_items[0][quantity]', '1');
  body.set('success_url', `${APP_URL}/dashboard?checkout=success`);
  body.set('cancel_url', `${APP_URL}/paywall?checkout=cancel`);
  if (customerEmail) body.set('customer_email', customerEmail);

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecret}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body.toString()
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Stripe checkout creation failed: ${err}`);
  }

  const data = await response.json();
  return { url: data.url, id: data.id };
}

export const paymentsService = {
  getPlans() {
    return paymentsRepository.getPlans();
  },

  async createCheckout({ planKey = 'monthly', customerEmail }) {
    const cfg = paymentsRepository.getConfig();
    if (cfg.billingEnabled === false) throw new Error('Billing is disabled');
    const plan = paymentsRepository.getPlanByKey(planKey);
    if (!plan) throw new Error('Plan not found');
    const session = await createStripeCheckoutSession(plan.stripePriceId, customerEmail);
    paymentsRepository.saveCheckoutSession({
      id: session.id,
      planKey,
      customerEmail,
      checkoutUrl: session.url,
      createdAt: new Date().toISOString()
    });
    return { checkoutUrl: session.url, sessionId: session.id, plan };
  },

  getPortalLink(email) {
    const cfg = paymentsRepository.getConfig();
    if (cfg.customerPortalUrl) return cfg.customerPortalUrl;
    return `${APP_URL}/paywall?portal=not-configured&email=${encodeURIComponent(email || '')}`;
  },

  setAdminBillingConfig({ customerPortalUrl }) {
    return paymentsRepository.updateConfig({ customerPortalUrl });
  },

  handleWebhook(event) {
    const type = event.type;
    const obj = event.data?.object || {};

    if (type === 'checkout.session.completed') {
      const email = obj.customer_details?.email || obj.customer_email;
      if (!email) return { ok: true, skipped: 'No email in checkout session' };

      let user = authRepository.findUserByEmail(email);
      let generatedPassword = null;
      if (!user) {
        generatedPassword = randomPassword();
        const hash = hashPassword(generatedPassword);
        user = authRepository.saveUser({
          id: crypto.randomUUID(),
          email,
          password: hash,
          passwordHash: hash,
          status: 'ACTIVE',
          globalRole: 'STUDENT',
          name: [obj.customer_details?.name || obj.customer_details?.first_name, obj.customer_details?.last_name].filter(Boolean).join(' ') || email,
          country: obj.customer_details?.address?.country || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          resetPasswordToken: null,
          resetPasswordExpires: null,
          resetPasswordUsedAt: null
        });
      }

      paymentsRepository.saveCustomer({
        email,
        stripeCustomerId: obj.customer,
        country: obj.customer_details?.address?.country || null
      });

      paymentsRepository.upsertSubscription({
        userId: user.id,
        email,
        stripeSubscriptionId: obj.subscription || `sub_${crypto.randomUUID()}`,
        status: 'active',
        gracePeriodEndsAt: null,
        currentPeriodEnd: addDays(new Date().toISOString(), 30)
      });

      coursesRepository.enrollUserInAllCourses(user.id);

      if (generatedPassword) {
        sendWelcomeEmail({ to: email, loginEmail: email, generatedPassword, loginLink: `${APP_URL}/login` });
      }

      return { ok: true, event: type };
    }

    if (type === 'invoice.payment_succeeded') {
      paymentsRepository.upsertSubscription({
        stripeSubscriptionId: obj.subscription,
        email: obj.customer_email || '',
        status: 'active',
        gracePeriodEndsAt: null,
        currentPeriodEnd: obj.lines?.data?.[0]?.period?.end ? new Date(obj.lines.data[0].period.end * 1000).toISOString() : addDays(new Date().toISOString(), 30)
      });
      return { ok: true, event: type };
    }

    if (type === 'invoice.payment_failed') {
      paymentsRepository.upsertSubscription({
        stripeSubscriptionId: obj.subscription,
        email: obj.customer_email || '',
        status: 'past_due',
        gracePeriodEndsAt: addDays(new Date().toISOString(), 10)
      });
      return { ok: true, event: type };
    }

    if (type === 'customer.subscription.updated') {
      paymentsRepository.upsertSubscription({
        stripeSubscriptionId: obj.id,
        email: '',
        status: obj.status === 'past_due' ? 'past_due' : obj.status === 'active' ? 'active' : 'canceled',
        gracePeriodEndsAt: obj.status === 'past_due' ? addDays(new Date().toISOString(), 10) : null,
        currentPeriodEnd: obj.current_period_end ? new Date(obj.current_period_end * 1000).toISOString() : null
      });
      return { ok: true, event: type };
    }

    if (type === 'customer.subscription.deleted') {
      paymentsRepository.upsertSubscription({
        stripeSubscriptionId: obj.id,
        email: '',
        status: 'canceled',
        gracePeriodEndsAt: null,
        currentPeriodEnd: null
      });
      return { ok: true, event: type };
    }

    return { ok: true, ignored: type };
  }
};
