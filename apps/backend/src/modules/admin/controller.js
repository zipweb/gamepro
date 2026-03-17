import { getMe } from '../auth/service.js';
import { adminService } from './service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseAuthUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    return getMe(token).user;
  } catch {
    return null;
  }
}

function getTenantId(req, searchParams) {
  const fromHeader = req.headers['x-tenant-id'];
  const fromQuery = searchParams?.get?.('tenantId');
  return String(fromHeader || fromQuery || 'default');
}

function requireAdmin(req) {
  const user = parseAuthUser(req);
  if (!user || user.globalRole !== 'ADMIN') throw new Error('Admin access required');
  return user;
}

export function handleAdminRoutes(req, res, body, pathname, searchParams) {
  try {
    if (req.method === 'GET' && pathname === '/api/v1/branding') {
      const tenantId = getTenantId(req, searchParams);
      return send(res, 200, adminService.getBranding(tenantId));
    }

    if (!pathname.startsWith('/api/v1/admin')) return false;
    requireAdmin(req);
    const tenantId = getTenantId(req, searchParams);

    if (req.method === 'GET' && pathname === '/api/v1/admin/branding') {
      return send(res, 200, adminService.getBranding(tenantId));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/branding') {
      return send(res, 200, adminService.saveBranding(tenantId, body));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/dashboard') {
      return send(res, 200, adminService.getDashboardMetrics());
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/students') {
      const rows = adminService.listStudents({
        country: searchParams.get('country') || undefined,
        subscriptionStatus: searchParams.get('subscriptionStatus') || undefined,
        active: searchParams.get('active') || undefined
      });
      return send(res, 200, { items: rows });
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/students') {
      return send(res, 201, adminService.createStudent(body));
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/v1/admin/students/')) {
      const id = pathname.split('/')[5];
      return send(res, 200, adminService.updateStudent(id, body));
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/v1/admin/students/')) {
      const id = pathname.split('/')[5];
      return send(res, 200, adminService.deleteStudent(id));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/students/send-email') {
      return send(res, 200, adminService.sendEmailToStudents(body.userIds || [], body.subject || 'Message from Admin', body.message || ''));    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/subscriptions') {
      return send(res, 200, { items: adminService.listSubscriptions() });
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/tracks') return send(res, 201, adminService.createTrack(body));
    if (req.method === 'POST' && pathname === '/api/v1/admin/courses') return send(res, 201, adminService.createCourse(body));
    if (req.method === 'POST' && pathname === '/api/v1/admin/modules') return send(res, 201, adminService.createModule(body));
    if (req.method === 'POST' && pathname === '/api/v1/admin/lessons') return send(res, 201, adminService.createLesson(body));

    if (req.method === 'GET' && pathname === '/api/v1/admin/stripe') return send(res, 200, adminService.getStripeSettings());
    if (req.method === 'POST' && pathname === '/api/v1/admin/stripe') return send(res, 200, adminService.updateStripeSettings(body));

    if (req.method === 'GET' && pathname === '/api/v1/admin/checkouts') return send(res, 200, { items: adminService.listCheckoutPages(tenantId) });
    if (req.method === 'POST' && pathname === '/api/v1/admin/checkouts') return send(res, 201, adminService.saveCheckoutPage(body, tenantId));

    if (req.method === 'GET' && pathname === '/api/v1/admin/emails/templates') return send(res, 200, { items: adminService.listEmailTemplates(tenantId) });
    if (req.method === 'POST' && pathname === '/api/v1/admin/emails/templates') return send(res, 201, adminService.saveEmailTemplate(body, tenantId));
    if (req.method === 'GET' && pathname === '/api/v1/admin/emails/settings') return send(res, 200, adminService.getEmailSettings());
    if (req.method === 'POST' && pathname === '/api/v1/admin/emails/settings') return send(res, 200, adminService.saveEmailSettings(body));
    if (req.method === 'POST' && pathname === '/api/v1/admin/emails/test') return send(res, 200, adminService.sendTestEmail(body.toEmail));


    if (req.method === 'GET' && pathname === '/api/v1/admin/community/posts') {
      return send(res, 200, { items: adminService.listCommunityPosts() });
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/v1/admin/community/posts/')) {
      const postId = pathname.split('/')[6];
      return send(res, 200, adminService.moderateCommunityPost(postId, body.reason));
    }

    if (req.method === 'GET' && pathname === '/api/v1/admin/files') return send(res, 200, { items: adminService.listFiles() });
    if (req.method === 'POST' && pathname === '/api/v1/admin/files') return send(res, 201, adminService.uploadFile(body));

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
