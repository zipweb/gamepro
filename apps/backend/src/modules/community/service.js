import crypto from 'node:crypto';
import { communityRepository } from './repository.js';
import { authRepository } from '../auth/repository.js';
import { gamificationService } from '../gamification/service.js';

function requireUser(user) {
  if (!user) throw new Error('Authentication required');
}

function profileFromUser(user) {
  return {
    id: user.id,
    name: user.name || user.email,
    avatar: user.avatarUrl || null,
    country: user.country || null,
    bio: user.bio || null,
    socialLinks: {
      instagram: user.socialLinks?.instagram || null,
      discord: user.socialLinks?.discord || null,
      telegram: user.socialLinks?.telegram || null
    }
  };
}

function withEngagement(post, currentUserId) {
  const comments = communityRepository.listComments().filter((c) => c.postId === post.id && !c.deletedAt);
  const likes = communityRepository.listPostLikes().filter((l) => l.postId === post.id);
  return {
    ...post,
    commentCount: comments.length,
    likesCount: likes.length,
    likedByMe: !!currentUserId && likes.some((l) => l.userId === currentUserId)
  };
}

function buildCommentTree(postId, currentUserId) {
  const comments = communityRepository.listComments().filter((c) => c.postId === postId && !c.deletedAt);
  const likes = communityRepository.listCommentLikes();
  const byParent = new Map();
  for (const comment of comments) {
    const key = comment.parentId || 'root';
    const arr = byParent.get(key) || [];
    arr.push(comment);
    byParent.set(key, arr);
  }

  function enrich(comment) {
    const user = authRepository.findUserById(comment.authorUserId);
    const commentLikes = likes.filter((l) => l.commentId === comment.id);
    return {
      ...comment,
      author: user ? profileFromUser(user) : null,
      likesCount: commentLikes.length,
      likedByMe: !!currentUserId && commentLikes.some((l) => l.userId === currentUserId),
      replies: (byParent.get(comment.id) || []).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).map(enrich)
    };
  }

  return (byParent.get('root') || []).sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt)).map(enrich);
}

export const communityService = {
  listPosts({ page = 1, pageSize = 10, currentUserId }) {
    const all = communityRepository.listPosts().filter((p) => !p.deletedAt).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const start = (page - 1) * pageSize;
    const items = all.slice(start, start + pageSize).map((post) => {
      const user = authRepository.findUserById(post.authorUserId);
      return {
        ...withEngagement(post, currentUserId),
        author: user ? profileFromUser(user) : null
      };
    });
    return { items, page, pageSize, hasNext: start + pageSize < all.length, total: all.length };
  },

  createPost({ user, title, body, imageUrl }) {
    requireUser(user);
    if (!title?.trim()) throw new Error('Post title is required');
    if (!body?.trim()) throw new Error('Post content is required');
    const now = new Date().toISOString();
    const post = communityRepository.createPost({
      id: crypto.randomUUID(),
      authorUserId: user.id,
      title: title.trim(),
      body: body.trim(),
      imageUrl: imageUrl?.trim() || null,
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
    gamificationService.awardCommunityPost(user.id, post.id);
    return post;
  },

  updatePost({ user, postId, title, body, imageUrl }) {
    requireUser(user);
    const post = communityRepository.updatePost(postId, (existing) => {
      if (existing.authorUserId !== user.id && user.globalRole !== 'ADMIN') throw new Error('Forbidden');
      return {
        ...existing,
        title: title?.trim() || existing.title,
        body: body?.trim() || existing.body,
        imageUrl: imageUrl === undefined ? existing.imageUrl : imageUrl,
        updatedAt: new Date().toISOString()
      };
    });
    if (!post) throw new Error('Post not found');
    return post;
  },

  deletePost({ user, postId, reason }) {
    requireUser(user);
    const post = communityRepository.updatePost(postId, (existing) => {
      if (existing.authorUserId !== user.id && user.globalRole !== 'ADMIN') throw new Error('Forbidden');
      return { ...existing, deletedAt: new Date().toISOString(), moderationReason: reason || null };
    });
    if (!post) throw new Error('Post not found');
    return { ok: true };
  },

  addComment({ user, postId, body, parentId }) {
    requireUser(user);
    if (!body?.trim()) throw new Error('Comment body is required');
    const post = communityRepository.listPosts().find((p) => p.id === postId && !p.deletedAt);
    if (!post) throw new Error('Post not found');
    if (parentId) {
      const parent = communityRepository.listComments().find((c) => c.id === parentId && !c.deletedAt);
      if (!parent) throw new Error('Parent comment not found');
    }
    const now = new Date().toISOString();
    const comment = communityRepository.createComment({
      id: crypto.randomUUID(),
      postId,
      authorUserId: user.id,
      parentId: parentId || null,
      body: body.trim(),
      createdAt: now,
      updatedAt: now,
      deletedAt: null
    });
    gamificationService.awardCommunityComment(user.id, comment.id);
    return comment;
  },

  getComments({ postId, currentUserId }) {
    return buildCommentTree(postId, currentUserId);
  },

  togglePostLike({ user, postId }) {
    requireUser(user);
    const post = communityRepository.listPosts().find((p) => p.id === postId && !p.deletedAt);
    if (!post) throw new Error('Post not found');
    const liked = communityRepository.togglePostLike(postId, user.id);
    return { liked };
  },

  toggleCommentLike({ user, commentId }) {
    requireUser(user);
    const comment = communityRepository.listComments().find((c) => c.id === commentId && !c.deletedAt);
    if (!comment) throw new Error('Comment not found');
    const liked = communityRepository.toggleCommentLike(commentId, user.id);
    return { liked };
  },

  getProfile(userId) {
    const user = authRepository.findUserById(userId);
    if (!user) throw new Error('User not found');
    return profileFromUser(user);
  },

  listModerationPosts() {
    return communityRepository.listPosts().sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }
};
