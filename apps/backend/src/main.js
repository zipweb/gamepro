import http from 'node:http';
import { URL } from 'node:url';
import { handleAuthRoutes } from './modules/auth/controller.js';
import { seedAdminIfEmpty } from './modules/auth/service.js';
import { handleCourseRoutes } from './modules/courses/controller.js';
import { coursesService } from './modules/courses/service.js';
import { handlePaymentsRoutes } from './modules/payments/controller.js';
import { handleAdminRoutes } from './modules/admin/controller.js';
import { handleCommunityRoutes } from './modules/community/controller.js';
import { handleGamificationRoutes } from './modules/gamification/controller.js';
import { handlePageBuilderRoutes } from './modules/pagebuilder/controller.js';

const port = Number(process.env.API_PORT ?? 4000);
seedAdminIfEmpty();

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return send(res, 200, { status: 'ok' });
  }

  let body = {};
  if (req.method !== 'GET') {
    try {
      body = await parseBody(req);
    } catch (error) {
      return send(res, 400, { error: error.message });
    }
  }

  const handledAuth = await handleAuthRoutes(req, res, body, url.pathname);
  if (handledAuth !== false) return;

  const handledCourses = handleCourseRoutes(req, res, body, url.pathname, url.searchParams);
  if (handledCourses !== false) return;

  const handledPayments = await handlePaymentsRoutes(req, res, body, url.pathname);
  if (handledPayments !== false) return;

  const handledAdmin = handleAdminRoutes(req, res, body, url.pathname, url.searchParams);
  if (handledAdmin !== false) return;

  const handledCommunity = handleCommunityRoutes(req, res, body, url.pathname, url.searchParams);
  if (handledCommunity !== false) return;

  const handledGamification = handleGamificationRoutes(req, res, url.pathname, url.searchParams);
  if (handledGamification !== false) return;

  const handledPages = handlePageBuilderRoutes(req, res, body, url.pathname, url.searchParams);
  if (handledPages !== false) return;

  if (req.method === 'GET' && url.pathname === '/api/v1') {
    return send(res, 200, {
      service: 'lms-backend',
      version: 'v1',
      modules: ['auth', 'courses', 'community', 'payments', 'checkout', 'gamification', 'pagebuilder', 'admin'],
      tracks: coursesService.listTracks()
    });
  }

  return send(res, 404, { error: 'Not Found' });
});

server.listen(port, () => {
  console.log(`[backend] API listening on :${port}`);
});
