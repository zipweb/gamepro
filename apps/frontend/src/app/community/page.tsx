'use client';

import { FormEvent, useEffect, useState } from 'react';
import '../../components/lms/lms.css';
import { Button, EmptyState, ErrorState, SkeletonCards } from '../../components/lms/ui';
import { emitToast } from '../../components/theme/toast';

type Profile = { id: string; name: string };
type Post = { id: string; title: string; body: string; authorUserId: string; author?: Profile | null; likesCount: number; commentCount: number; likedByMe: boolean };
type Comment = { id: string; body: string; author?: Profile | null; likesCount: number; likedByMe: boolean; replies: Comment[] };

function CommentNode({ comment, token, onReply, onLike }: { comment: Comment; token: string; onReply: (id: string, body: string) => Promise<void>; onLike: (id: string) => Promise<void> }) {
  const [reply, setReply] = useState('');
  return <li className="card" style={{ marginTop: 8 }}><p><strong>{comment.author?.name || 'User'}</strong> {comment.body}</p><div className="row"><Button variant="ghost" onClick={() => onLike(comment.id)}>{comment.likedByMe ? 'Unlike' : 'Like'} ({comment.likesCount})</Button>{!!token && <><input value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Reply..." /><Button onClick={async () => { if (!reply.trim()) return; await onReply(comment.id, reply); setReply(''); }}>Reply</Button></>}</div>{comment.replies?.length > 0 && <ul style={{ marginLeft: 16, paddingLeft: 10 }}>{comment.replies.map((child) => <CommentNode key={child.id} comment={child} token={token} onReply={onReply} onLike={onLike} />)}</ul>}</li>;
}

export default function CommunityPage() {
  const [token, setToken] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [form, setForm] = useState({ title: '', body: '' });

  async function loadPosts() {
    setLoading(true); setError('');
    try {
      const res = await fetch('http://localhost:4000/api/v1/community/posts?page=1&pageSize=8', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      const data = await res.json();
      setPosts(data.items || []);
    } catch {
      setError('We could not load community posts.');
    } finally { setLoading(false); }
  }

  async function loadComments(postId: string) {
    const res = await fetch(`http://localhost:4000/api/v1/community/posts/${postId}/comments`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
    const data = await res.json(); setComments(data.items || []);
  }

  useEffect(() => { const t = localStorage.getItem('accessToken') || ''; setToken(t); }, []);
  useEffect(() => { loadPosts().catch(() => undefined); }, [token]);

  async function createPost(e: FormEvent) {
    e.preventDefault();
    const res = await fetch('http://localhost:4000/api/v1/community/posts', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(form) });
    if (res.ok) { setForm({ title: '', body: '' }); emitToast('Post published.', 'success'); await loadPosts(); }
  }

  return <main className="lms-shell">
    <section className="hero"><h1>Community</h1><p className="muted">Share progress, ask questions, and celebrate wins.</p></section>
    {token && <form className="card" onSubmit={createPost}><h3>Create post</h3><input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /><textarea placeholder="Write your post..." value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={4} /><div className="row"><Button className="btn-primary" type="submit">Publish</Button></div></form>}
    {error && <ErrorState message={error} onRetry={() => loadPosts()} />}
    {loading ? <SkeletonCards count={4} /> : posts.length === 0 ? <EmptyState title="No posts yet" description="Start the conversation in your learning community." /> :
      <section>{posts.map((post) => <article key={post.id} className="card" style={{ marginBottom: 12 }}><h3>{post.title}</h3><p className="muted">by {post.author?.name || 'Unknown'}</p><p>{post.body}</p><div className="row"><Button variant="ghost">{post.likedByMe ? 'Unlike' : 'Like'} ({post.likesCount})</Button><Button onClick={async () => { setActivePostId(post.id); await loadComments(post.id); }}>Comments ({post.commentCount})</Button></div>{activePostId === post.id && <div className="card" style={{ marginTop: 10 }}><h4>Comments</h4><ul style={{ listStyle: 'none', padding: 0 }}>{comments.map((comment) => <CommentNode key={comment.id} comment={comment} token={token} onReply={async () => undefined} onLike={async () => undefined} />)}</ul></div>}</article>)}</section>}
  </main>;
}
