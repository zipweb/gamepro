import crypto from 'node:crypto';
import { pageBuilderRepository } from './repository.js';

function block(type, props = {}) {
  return { id: crypto.randomUUID(), type, props };
}

const TEMPLATES = {
  landing: {
    name: 'Landing Page',
    blocks: [
      block('section', { backgroundColor: 'var(--background-color)', color: '#f8fbff', padding: '72px 28px', margin: '0 0 16px 0' }),
      block('text', { text: 'Launch faster with a proven LMS growth stack', fontSize: '44px', fontWeight: '800', color: '#f8fbff', margin: '0 0 12px 0' }),
      block('text', { text: 'Built for creators who want conversions, retention, and recurring revenue.', fontSize: '20px', color: '#b7c8ee', margin: '0 0 18px 0' }),
      block('button', { text: 'Start Free Trial', href: '/site/checkout-pro', backgroundColor: 'var(--color-primary)', color: 'var(--text-color)', padding: '13px 22px', margin: '0 8px 0 0' }),
      block('button', { text: 'See Demo', href: '/site/sales-pro', backgroundColor: 'var(--color-secondary)', color: '#dbe8ff', padding: '13px 22px' }),
      block('image', { src: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f', margin: '22px 0 0 0' })
    ]
  },

  sales: {
    name: 'Sales Page (Advanced)',
    blocks: [
      block('section', { backgroundColor: 'var(--background-color)', color: 'var(--text-color)', padding: '76px 28px', margin: '0 0 14px 0' }),
      block('text', { text: 'Double Your Course Revenue in 60 Days', fontSize: '48px', fontWeight: '900', color: 'var(--text-color)', margin: '0 0 10px 0' }),
      block('text', { text: 'A complete acquisition + retention framework, ready to deploy today.', fontSize: '22px', color: '#bfd1ff', margin: '0 0 20px 0' }),
      block('button', { text: 'Enroll Now', href: '/site/checkout-pro', backgroundColor: 'var(--color-primary)', color: 'var(--text-color)', padding: '14px 26px', margin: '0 10px 0 0' }),
      block('button', { text: 'Watch Case Study', href: '#video', backgroundColor: '#1d2946', color: '#d7e6ff', padding: '14px 26px' }),

      block('section', { backgroundColor: '#0d1528', color: '#e9f0ff', padding: '32px 24px', margin: '20px 0 12px 0' }),
      block('video', { url: 'https://www.youtube.com/embed/dQw4w9WgXcQ', margin: '0 0 12px 0' }),
      block('text', { text: '3-min strategy breakdown: positioning, funnel, and closing sequence.', color: '#adc2ed' }),

      block('section', { backgroundColor: 'var(--color-secondary)', color: '#f4f7ff', padding: '26px 20px', margin: '14px 0' }),
      block('text', { text: 'Benefits', fontSize: '32px', fontWeight: '800', color: 'var(--text-color)', margin: '0 0 8px 0' }),
      block('text', { text: '• Increase checkout conversion with conversion-tested page blocks\n• Boost completion rates with gamified lesson flows\n• Recover churn with streak-based reactivation campaigns', color: '#c6d6fa' }),

      block('section', { backgroundColor: '#111c35', color: 'var(--text-color)', padding: '24px 20px', margin: '14px 0' }),
      block('text', { text: 'Testimonials', fontSize: '30px', fontWeight: '800', margin: '0 0 10px 0' }),
      block('text', { text: '"We went from $12k to $43k MRR in 5 months." — Ana, Course Creator', color: '#d4e2ff', margin: '0 0 6px 0' }),
      block('text', { text: '"The funnel alone paid for itself in the first week." — Marcus, Coach', color: '#d4e2ff' }),

      block('section', { backgroundColor: 'var(--color-secondary)', color: 'var(--text-color)', padding: '30px 22px', margin: '14px 0' }),
      block('text', { text: 'Pricing', fontSize: '30px', fontWeight: '800', margin: '0 0 10px 0' }),
      block('columns', { gap: '14px', margin: '0 0 8px 0' }),
      block('text', { text: 'Starter — $49/mo\nScale — $99/mo\nElite — $199/mo', color: '#d8e6ff' }),
      block('button', { text: 'Claim Offer', href: '/site/checkout-pro', backgroundColor: 'var(--color-accent)', color: '#07111f', padding: '14px 24px', margin: '10px 0 0 0' }),

      block('section', { backgroundColor: '#0f1c35', color: 'var(--text-color)', padding: '26px 20px', margin: '14px 0' }),
      block('text', { text: 'FAQ', fontSize: '30px', fontWeight: '800', margin: '0 0 8px 0' }),
      block('text', { text: 'Q: Is this beginner friendly?\nA: Yes, all playbooks are step-by-step.\n\nQ: Is there a guarantee?\nA: 30-day money-back guarantee.', color: '#cfe0ff' }),
      block('button', { text: 'Get Instant Access', href: '/site/checkout-pro', backgroundColor: 'var(--color-primary)', color: 'var(--text-color)', padding: '14px 26px', margin: '12px 0 0 0' })
    ]
  },

  checkout: {
    name: 'Checkout Page (High Conversion)',
    blocks: [
      block('section', { backgroundColor: 'var(--background-color)', color: 'var(--text-color)', padding: '44px 24px', margin: '0 0 14px 0' }),
      block('text', { text: 'Complete Your Order', fontSize: '40px', fontWeight: '900', color: 'var(--text-color)' }),
      block('text', { text: 'Product Summary: Growth System + Templates + Community access', color: '#b8caee', margin: '8px 0 12px 0' }),

      block('section', { backgroundColor: 'var(--color-secondary)', color: 'var(--text-color)', padding: '20px', margin: '12px 0' }),
      block('text', { text: 'Pricing Toggle', fontSize: '24px', fontWeight: '700' }),
      block('button', { text: 'Monthly — $99', href: '#', backgroundColor: 'var(--color-primary)', color: 'var(--text-color)', padding: '10px 16px', margin: '8px 10px 8px 0' }),
      block('button', { text: 'Yearly — $79/mo (Save 20%)', href: '#', backgroundColor: '#1f2c4d', color: 'var(--text-color)', padding: '10px 16px' }),
      block('text', { text: '🔥 Annual plan saves $240 per year', color: '#86efac', margin: '10px 0 0 0' }),

      block('section', { backgroundColor: 'var(--color-secondary)', color: 'var(--text-color)', padding: '18px', margin: '12px 0' }),
      block('text', { text: 'Trust & Security', fontSize: '24px', fontWeight: '700' }),
      block('text', { text: '✅ SSL Secure Checkout\n✅ Stripe-powered payments\n✅ PCI-compliant processing', color: '#ccddff' }),

      block('section', { backgroundColor: '#101f30', color: 'var(--text-color)', padding: '18px', margin: '12px 0' }),
      block('text', { text: '30-Day Guarantee', fontSize: '24px', fontWeight: '700' }),
      block('text', { text: 'If you do not see value in 30 days, request a full refund. No questions asked.', color: '#c8dcff' }),

      block('section', { backgroundColor: 'var(--color-secondary)', color: 'var(--text-color)', padding: '18px', margin: '12px 0' }),
      block('text', { text: 'Trusted by 10,000+ creators worldwide', color: 'var(--text-color)' }),
      block('button', { text: 'Pay Securely Now', href: '/site/thank-you', backgroundColor: 'var(--color-accent)', color: '#04111d', padding: '14px 24px', margin: '10px 0 0 0' })
    ]
  },

  thank_you: {
    name: 'Thank You Page',
    blocks: [
      block('section', { backgroundColor: '#0d1b2a', color: 'var(--text-color)', padding: '58px 24px', margin: '0 0 12px 0' }),
      block('text', { text: '🎉 You’re In! Payment Confirmed', fontSize: '42px', fontWeight: '900', color: 'var(--text-color)' }),
      block('text', { text: 'Next steps:\n1) Check your email for account details\n2) Complete onboarding in 5 minutes\n3) Join the community to start your first win', color: '#c9ddff', margin: '12px 0' }),
      block('button', { text: 'Go to Login', href: '/login', backgroundColor: 'var(--color-primary)', color: 'var(--text-color)', padding: '13px 22px' })
    ]
  },

  lead_capture: {
    name: 'Lead Capture Page',
    blocks: [
      block('section', { backgroundColor: '#090f1d', color: 'var(--text-color)', padding: '72px 26px', margin: '0 0 12px 0' }),
      block('text', { text: 'Get the Free Conversion Playbook', fontSize: '46px', fontWeight: '900', color: 'var(--text-color)' }),
      block('text', { text: 'Download the exact system used to scale digital products to 6-figures.', color: '#c3d7ff', margin: '10px 0 16px 0' }),
      block('text', { text: 'Email Address', backgroundColor: '#111b33', color: '#9db6ea', padding: '14px', margin: '0 0 10px 0' }),
      block('button', { text: 'Send Me The Guide', href: '#', backgroundColor: 'var(--color-accent)', color: '#051015', padding: '14px 24px' }),
      block('text', { text: 'No spam. Unsubscribe anytime.', color: '#8ea4d2', margin: '10px 0 0 0' })
    ]
  }
};

function sanitizeVisibility(value) {
  return value === 'private' ? 'private' : 'public';
}

function normalizeLayoutSettings(layout = {}) {
  return {
    disableGlobalHeader: Boolean(layout.disableGlobalHeader),
    disableGlobalFooter: Boolean(layout.disableGlobalFooter),
    customHeaderBlocks: Array.isArray(layout.customHeaderBlocks) ? layout.customHeaderBlocks : null,
    customFooterBlocks: Array.isArray(layout.customFooterBlocks) ? layout.customFooterBlocks : null
  };
}

function resolveLayoutForPage(page) {
  const global = pageBuilderRepository.getGlobalLayout();
  const settings = normalizeLayoutSettings(page.layout);
  const headerBlocks = settings.disableGlobalHeader
    ? []
    : (settings.customHeaderBlocks ?? global.header?.blocks ?? []);
  const footerBlocks = settings.disableGlobalFooter
    ? []
    : (settings.customFooterBlocks ?? global.footer?.blocks ?? []);
  return { headerBlocks, footerBlocks, settings, updatedAt: global.updatedAt };
}

export const pageBuilderService = {
  listPages() {
    return pageBuilderRepository.listPages().filter((p) => !p.deletedAt);
  },
  getTemplateKeys() {
    return Object.keys(TEMPLATES);
  },
  createPage(input = {}) {
    const now = new Date().toISOString();
    const base = input.template && TEMPLATES[input.template] ? TEMPLATES[input.template] : { name: 'Blank page', blocks: [] };
    const page = {
      id: crypto.randomUUID(),
      name: input.name || base.name,
      slug: input.slug || `page-${Date.now()}`,
      pageType: input.pageType || 'landing',
      visibility: sanitizeVisibility(input.visibility),
      content: { blocks: input.content?.blocks || base.blocks },
      layout: normalizeLayoutSettings(input.layout),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    };
    return pageBuilderRepository.savePage(page);
  },
  updatePage(id, patch = {}) {
    const existing = pageBuilderRepository.getPageById(id);
    if (!existing) throw new Error('Page not found');
    const next = {
      ...existing,
      name: patch.name ?? existing.name,
      slug: patch.slug ?? existing.slug,
      pageType: patch.pageType ?? existing.pageType,
      visibility: patch.visibility ? sanitizeVisibility(patch.visibility) : existing.visibility,
      content: patch.content ?? existing.content,
      layout: patch.layout ? normalizeLayoutSettings(patch.layout) : existing.layout,
      updatedAt: new Date().toISOString()
    };
    return pageBuilderRepository.savePage(next);
  },
  deletePage(id) {
    const existing = pageBuilderRepository.getPageById(id);
    if (!existing) throw new Error('Page not found');
    return pageBuilderRepository.savePage({ ...existing, deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  },
  getGlobalLayout() {
    return pageBuilderRepository.getGlobalLayout();
  },
  updateGlobalLayout(patch = {}) {
    const current = pageBuilderRepository.getGlobalLayout();
    const next = {
      header: { blocks: Array.isArray(patch.header?.blocks) ? patch.header.blocks : current.header?.blocks || [] },
      footer: { blocks: Array.isArray(patch.footer?.blocks) ? patch.footer.blocks : current.footer?.blocks || [] },
      updatedAt: new Date().toISOString()
    };
    return pageBuilderRepository.saveGlobalLayout(next);
  },
  getPublicPageBySlug(slug, user) {
    const page = pageBuilderRepository.getPageBySlug(slug);
    if (!page) return null;
    if (page.visibility === 'private' && !user) throw new Error('Authentication required');
    return { ...page, resolvedLayout: resolveLayoutForPage(page) };
  }
};
