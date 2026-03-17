'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

export default function AdminCommunityPage() {
  const { ready, token } = useAdminGuard();
  const [items, setItems] = useState<any[]>([]);

  async function load() {
    const res = await fetch('http://localhost:4000/api/v1/admin/community/posts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setItems(data.items || []);
  }

  useEffect(() => {
    if (!ready) return;
    load().catch(() => undefined);
  }, [ready]);

  async function removePost(id: string) {
    await fetch(`http://localhost:4000/api/v1/admin/community/posts/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ reason: 'Policy violation' })
    });
    await load();
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <h1>Community moderation</h1>
      <AdminNav />
      {items.map((post) => (
        <article className="card" key={post.id}>
          <h3>{post.title}</h3>
          <p>{post.body}</p>
          <p className="muted">{post.deletedAt ? 'Removed' : 'Active'}</p>
          {!post.deletedAt && <button onClick={() => removePost(post.id)}>Delete post</button>}
        </article>
      ))}
    </main>
  );
}
