import fs from 'node:fs';
import path from 'node:path';

const DATA_PATH = path.resolve(process.cwd(), 'data/community.json');

function ensureDataFile() {
  const dir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_PATH)) {
    fs.writeFileSync(DATA_PATH, JSON.stringify({ posts: [], comments: [], postLikes: [], commentLikes: [] }, null, 2));
  }
}

function readData() {
  ensureDataFile();
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export const communityRepository = {
  listPosts() {
    return readData().posts;
  },
  createPost(post) {
    const data = readData();
    data.posts.push(post);
    writeData(data);
    return post;
  },
  updatePost(postId, mutate) {
    const data = readData();
    const idx = data.posts.findIndex((p) => p.id === postId && !p.deletedAt);
    if (idx === -1) return null;
    data.posts[idx] = mutate(data.posts[idx]);
    writeData(data);
    return data.posts[idx];
  },
  listComments() {
    return readData().comments;
  },
  createComment(comment) {
    const data = readData();
    data.comments.push(comment);
    writeData(data);
    return comment;
  },
  updateComment(commentId, mutate) {
    const data = readData();
    const idx = data.comments.findIndex((c) => c.id === commentId && !c.deletedAt);
    if (idx === -1) return null;
    data.comments[idx] = mutate(data.comments[idx]);
    writeData(data);
    return data.comments[idx];
  },
  togglePostLike(postId, userId) {
    const data = readData();
    const existing = data.postLikes.find((l) => l.postId === postId && l.userId === userId);
    if (existing) {
      data.postLikes = data.postLikes.filter((l) => !(l.postId === postId && l.userId === userId));
      writeData(data);
      return false;
    }
    data.postLikes.push({ postId, userId, createdAt: new Date().toISOString() });
    writeData(data);
    return true;
  },
  toggleCommentLike(commentId, userId) {
    const data = readData();
    const existing = data.commentLikes.find((l) => l.commentId === commentId && l.userId === userId);
    if (existing) {
      data.commentLikes = data.commentLikes.filter((l) => !(l.commentId === commentId && l.userId === userId));
      writeData(data);
      return false;
    }
    data.commentLikes.push({ commentId, userId, createdAt: new Date().toISOString() });
    writeData(data);
    return true;
  },
  listPostLikes() {
    return readData().postLikes;
  },
  listCommentLikes() {
    return readData().commentLikes;
  }
};
