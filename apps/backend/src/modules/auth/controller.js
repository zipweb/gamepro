import { forgotPassword, getMe, login, logout, refresh, resetPassword } from './service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

export async function handleAuthRoutes(req, res, body, pathname) {
  try {
    if (req.method === 'POST' && pathname === '/api/v1/auth/login') {
      const tenantId = req.headers['x-tenant-id'];
      const result = login({ email: body.email, password: body.password, tenantId, ip: req.socket.remoteAddress });
      return send(res, 200, result);
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/logout') {
      logout(body.refreshToken);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/refresh') {
      const result = refresh(body.refreshToken);
      return send(res, 200, result);
    }

    if (req.method === 'GET' && pathname === '/api/v1/auth/me') {
      const auth = req.headers.authorization || '';
      const token = auth.replace('Bearer ', '');
      const result = getMe(token);
      return send(res, 200, result);
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/forgot-password') {
      await forgotPassword(body.email);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && pathname === '/api/v1/auth/reset-password') {
      await resetPassword({ token: body.token, newPassword: body.newPassword });
      return send(res, 200, { ok: true });
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
