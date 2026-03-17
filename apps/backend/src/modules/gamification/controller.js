import { getMe } from '../auth/service.js';
import { gamificationService } from './service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function requireUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) throw new Error('Unauthorized');
  const result = getMe(token);
  if (!result?.user) throw new Error('Unauthorized');
  return result.user;
}

export function handleGamificationRoutes(req, res, pathname, searchParams) {
  try {
    if (!pathname.startsWith('/api/v1/gamification')) return false;
    const user = requireUser(req);

    if (req.method === 'GET' && pathname === '/api/v1/gamification/me') {
      return send(res, 200, gamificationService.getSummary(user.id));
    }

    if (req.method === 'GET' && pathname === '/api/v1/gamification/leaderboard') {
      const period = searchParams.get('period') || 'all';
      const limit = Number(searchParams.get('limit') || '20');
      return send(res, 200, gamificationService.getLeaderboard(period, limit));
    }

    if (req.method === 'GET' && pathname === '/api/v1/gamification/notifications') {
      return send(res, 200, { items: gamificationService.getNotifications(user.id) });
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
