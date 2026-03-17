import type { Express } from 'express';

const domains = [
  'auth',
  'courses',
  'community',
  'payments',
  'checkout',
  'gamification',
  'admin',
  'analytics'
];

export function registerDomainRoutes(app: Express) {
  app.get('/api/v1', (_req, res) => {
    res.json({
      service: 'lms-backend',
      version: 'v1',
      modules: domains
    });
  });

  for (const domain of domains) {
    app.get(`/api/v1/${domain}/health`, (_req, res) => {
      res.json({ domain, status: 'ready' });
    });
  }
}
