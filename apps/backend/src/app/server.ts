import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { registerDomainRoutes } from './routes.js';

export function createServer() {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  registerDomainRoutes(app);

  return app;
}
