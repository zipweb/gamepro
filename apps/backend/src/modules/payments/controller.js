import { paymentsService } from './service.js';
import { getMe } from '../auth/service.js';

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

export async function handlePaymentsRoutes(req, res, body, pathname) {
  try {
    if (req.method === 'POST' && pathname === '/api/v1/billing/checkout') {
      const user = getUser(req);
      const result = await paymentsService.createCheckout({ planKey: body.planKey, customerEmail: user?.email || body.email });
      return send(res, 200, result);
    }

    if (req.method === 'GET' && pathname === '/api/v1/billing/plans') {
      return send(res, 200, { items: paymentsService.getPlans() });
    }

    if (req.method === 'GET' && pathname === '/api/v1/billing/portal') {
      const user = getUser(req);
      if (!user) return send(res, 401, { error: 'Unauthorized' });
      return send(res, 200, { url: paymentsService.getPortalLink(user.email) });
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/billing/config') {
      const user = getUser(req);
      if (!user || user.globalRole !== 'ADMIN') return send(res, 403, { error: 'Admin access required' });
      return send(res, 200, paymentsService.setAdminBillingConfig(body));
    }

    if (req.method === 'POST' && pathname === '/api/v1/webhooks/stripe') {
      const result = paymentsService.handleWebhook(body);
      return send(res, 200, result);
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
