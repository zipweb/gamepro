import { getMe } from '../auth/service.js';
import { communityService } from './service.js';

function send(res, code, payload) {
  res.writeHead(code, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function parseUser(req) {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (!token) return null;
  try {
    return getMe(token).user;
  } catch {
    return null;
  }
}

export function handleCommunityRoutes(req, res, body, pathname, searchParams) {
  try {
    if (!pathname.startsWith('/api/v1/community')) return false;
    const user = parseUser(req);

    if (req.method === 'GET' && pathname === '/api/v1/community/posts') {
      const page = Number(searchParams.get('page') || '1');
      const pageSize = Number(searchParams.get('pageSize') || '10');
      return send(res, 200, communityService.listPosts({ page, pageSize, currentUserId: user?.id }));
    }

    if (req.method === 'POST' && pathname === '/api/v1/community/posts') {
      return send(res, 201, communityService.createPost({ user, title: body.title, body: body.body, imageUrl: body.imageUrl }));
    }

    if (req.method === 'PATCH' && pathname.startsWith('/api/v1/community/posts/')) {
      const postId = pathname.split('/')[5];
      return send(res, 200, communityService.updatePost({ user, postId, title: body.title, body: body.body, imageUrl: body.imageUrl }));
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/v1/community/posts/')) {
      const postId = pathname.split('/')[5];
      return send(res, 200, communityService.deletePost({ user, postId, reason: body.reason }));
    }

    if (req.method === 'POST' && pathname.endsWith('/like') && pathname.startsWith('/api/v1/community/posts/')) {
      const postId = pathname.split('/')[5];
      return send(res, 200, communityService.togglePostLike({ user, postId }));
    }

    if (req.method === 'GET' && pathname.startsWith('/api/v1/community/posts/') && pathname.endsWith('/comments')) {
      const postId = pathname.split('/')[5];
      return send(res, 200, { items: communityService.getComments({ postId, currentUserId: user?.id }) });
    }

    if (req.method === 'POST' && pathname.startsWith('/api/v1/community/posts/') && pathname.endsWith('/comments')) {
      const postId = pathname.split('/')[5];
      return send(res, 201, communityService.addComment({ user, postId, body: body.body, parentId: body.parentId }));
    }

    if (req.method === 'POST' && pathname.startsWith('/api/v1/community/comments/') && pathname.endsWith('/like')) {
      const commentId = pathname.split('/')[5];
      return send(res, 200, communityService.toggleCommentLike({ user, commentId }));
    }

    if (req.method === 'GET' && pathname.startsWith('/api/v1/community/profiles/')) {
      const userId = pathname.split('/')[5];
      return send(res, 200, communityService.getProfile(userId));
    }

    return false;
  } catch (error) {
    return send(res, 400, { error: error.message || 'Request failed' });
  }
}
