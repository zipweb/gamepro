import { coursesService } from './service.js';
import { getMe } from '../auth/service.js';
import { getAccessStateForUser } from '../payments/service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function getUserFromAuth(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    return getMe(token).user;
  } catch {
    return null;
  }
}


function requireLearningAccess(user) {
  if (!user) throw new Error('Unauthorized');
  const access = getAccessStateForUser(user);
  if (access.blocked) throw new Error('Subscription blocked');
  return access;
}

function requireAdmin(req) {
  const user = getUserFromAuth(req);
  if (!user || user.globalRole !== 'ADMIN') throw new Error('Admin access required');
  return user;
}

export function handleCourseRoutes(req, res, body, pathname, searchParams) {
  try {
    if (req.method === 'GET' && pathname === '/api/v1/courses') {
      return send(res, 200, { items: coursesService.listCourses() });
    }

    if (req.method === 'GET' && pathname.startsWith('/api/v1/courses/')) {
      const id = pathname.split('/')[4];
      const user = getUserFromAuth(req);
      if (user && user.globalRole === 'STUDENT') requireLearningAccess(user);
      const course = coursesService.getCourse(id, user?.id);
      if (!course) return send(res, 404, { error: 'Course not found' });
      return send(res, 200, course);
    }

    if (req.method === 'GET' && pathname.startsWith('/api/v1/lessons/')) {
      const id = pathname.split('/')[4];
      const lang = searchParams.get('lang');
      const user = getUserFromAuth(req);
      if (user && user.globalRole === 'STUDENT') requireLearningAccess(user);
      const lesson = coursesService.getLesson({ lessonId: id, lang, acceptLanguage: req.headers['accept-language'] });
      if (!lesson) return send(res, 404, { error: 'Lesson not found' });
      return send(res, 200, lesson);
    }

    if (req.method === 'POST' && pathname.startsWith('/api/v1/lessons/') && pathname.endsWith('/complete')) {
      const id = pathname.split('/')[4];
      const user = getUserFromAuth(req);
      if (!user) return send(res, 401, { error: 'Unauthorized' });
      if (user.globalRole === 'STUDENT') requireLearningAccess(user);
      return send(res, 200, coursesService.completeLesson({ userId: user.id, lessonId: id }));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/tracks') {
      requireAdmin(req);
      return send(res, 201, coursesService.createTrack(body));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/courses') {
      requireAdmin(req);
      return send(res, 201, coursesService.createCourse(body));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/modules') {
      requireAdmin(req);
      return send(res, 201, coursesService.createModule(body));
    }

    if (req.method === 'POST' && pathname === '/api/v1/admin/lessons') {
      requireAdmin(req);
      return send(res, 201, coursesService.createLesson(body));
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
