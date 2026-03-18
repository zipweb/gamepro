import http from 'node:http';
import { URL } from 'node:url';

// AUTH
import { handleAuthRoutes } from './modules/auth/controller.js';
import { seedAdminIfEmpty } from './modules/auth/service.js';

// COURSES
import { handleCourseRoutes } from './modules/courses/controller.js';

// PAYMENTS
import { handlePaymentsRoutes } from './modules/payments/controller.js';

// ADMIN
import { handleAdminRoutes } from './modules/admin/controller.js';

// COMMUNITY
import { handleCommunityRoutes } from './modules/community/controller.js';

// GAMIFICATION
import { handleGamificationRoutes } from './modules/gamification/controller.js';

// PAGE BUILDER
import { handlePageBuilderRoutes } from './modules/pagebuilder/controller.js';

const PORT = process.env.PORT || 4000;

//  cria servidor
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // CORS (IMPORTANTE pro frontend funcionar)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  try {
    // =========================
    // ROUTES
    // =========================

    // AUTH
    if (url.pathname.startsWith('/auth')) {
      return handleAuthRoutes(req, res);
    }

    // COURSES
    if (url.pathname.startsWith('/courses')) {
      return handleCourseRoutes(req, res);
    }

    // PAYMENTS
    if (url.pathname.startsWith('/payments')) {
      return handlePaymentsRoutes(req, res);
    }

    // ADMIN
    if (url.pathname.startsWith('/admin')) {
      return handleAdminRoutes(req, res);
    }

    // COMMUNITY
    if (url.pathname.startsWith('/community')) {
      return handleCommunityRoutes(req, res);
    }

    // GAMIFICATION
    if (url.pathname.startsWith('/gamification')) {
      return handleGamificationRoutes(req, res);
    }

    // PAGE BUILDER
    if (url.pathname.startsWith('/pagebuilder')) {
      return handlePageBuilderRoutes(req, res);
    }

    // =========================
    // HEALTH CHECK
    // =========================
    if (url.pathname === '/') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ status: 'API OK ' }));
    }

    // =========================
    // NOT FOUND
    // =========================
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found' }));

  } catch (error) {
    console.error(error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

//  inicia servidor
server.listen(PORT, async () => {
  console.log(`[backend] API listening on :${PORT}`);

  // cria admin automaticamente se não existir
  try {
    await seedAdminIfEmpty();
  } catch (err) {
    console.error('Erro ao criar admin inicial:', err);
  }
});
