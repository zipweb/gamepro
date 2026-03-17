import { getMe } from '../auth/service.js';
import { pageBuilderService } from './service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    return getMe(token).user;
  } catch {
    return null;
  }
}

function requireAdmin(req) {
  const user = getUser(req);
  if (!user || user.globalRole !== 'ADMIN') throw new Error('Admin access required');
  return user;
}

export function handlePageBuilderRoutes(req, res, body, pathname) {
  try {
    if (req.method === 'GET' && pathname.startsWith('/api/v1/pages/')) {
      const slug = pathname.split('/')[4];
      const user = getUser(req);
      const page = pageBuilderService.getPublicPageBySlug(slug, user);
      if (!page) return send(res, 404, { error: 'Page not found' });
      return send(res, 200, page);
    }

    if (pathname.startsWith('/api/v1/admin/layout')) {
      requireAdmin(req);
      if (req.method === 'GET' && pathname === '/api/v1/admin/layout') {
        return send(res, 200, pageBuilderService.getGlobalLayout());
      }
      if (req.method === 'PATCH' && pathname === '/api/v1/admin/layout') {
        return send(res, 200, pageBuilderService.updateGlobalLayout(body));
      }
      return false;
    }

    if (!pathname.startsWith('/api/v1/admin/pages')) return false;
    requireAdmin(req);

    if (req.method === 'GET' && pathname === '/api/v1/admin/pages') {
      return send(res, 200, { items: pageBuilderService.listPages(), templates: pageBuilderService.getTemplateKeys() });
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/pages') {
      return send(res, 201, pageBuilderService.createPage(body));
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/v1/admin/pages/')) {
      const id = pathname.split('/')[5];
      return send(res, 200, pageBuilderService.updatePage(id, body));
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/v1/admin/pages/')) {
      const id = pathname.split('/')[5];
      pageBuilderService.deletePage(id);
      return send(res, 200, { ok: true });
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
