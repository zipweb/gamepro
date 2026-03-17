'use client';

import { useEffect, useState } from 'react';
import '../../components/lms/lms.css';
import { EmptyState, ErrorState, LinkButton, SkeletonCards } from '../../components/lms/ui';

type Track = { id: string; name: string; slug: string };
type Gamification = { totalXp: number; level: number; levelTitle: string; streak: { currentStreak: number }; progress: { percentToNextLevel: number; xpToNextLevel: number }; badges: Array<{ id: string; label: string }> };

export default function DashboardPage() {
  const [name, setName] = useState('Student');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gami, setGami] = useState<Gamification | null>(null);

  function load() {
    setLoading(true); setError('');
    const token = localStorage.getItem('accessToken');
    if (token) fetch('http://localhost:4000/api/v1/auth/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((d) => setName(d.user?.name || 'Student')).catch(() => undefined);
    if (token) fetch('http://localhost:4000/api/v1/gamification/me', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then(setGami).catch(() => undefined);
    fetch('http://localhost:4000/api/v1').then((r) => r.json()).then((d) => setTracks(d.tracks || [])).catch(() => setError('We could not load your dashboard data.')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return <main className="lms-shell">
    <section className="hero">
      <h1>Welcome back, {name}</h1>
      <p className="muted">Ready to continue your learning journey?</p>
      <div className="row"><LinkButton href="/courses" variant="primary">Continue course</LinkButton><LinkButton href="/community" variant="ghost">Go to community</LinkButton></div>
    </section>

    <div className="grid-3">
      <article className="card"><h3>Level</h3><p>{gami?.level ?? '-'}</p></article>
      <article className="card"><h3>XP</h3><p>{gami?.totalXp ?? 0}</p></article>
      <article className="card"><h3>Streak</h3><p>🔥 {gami?.streak?.currentStreak ?? 0} days</p></article>
    </div>

    {error && <ErrorState message={error} onRetry={load} />}
    <h2 className="section-title">Knowledge Tracks</h2>
    {loading ? <SkeletonCards /> : tracks.length === 0 ? <EmptyState title="No courses yet" description="New courses will appear here soon." ctaLabel="Browse catalog" ctaHref="/courses" /> :
      <div className="rail">{tracks.map((t) => <article className="card" key={t.id}><span className="pill">Track</span><h3>{t.name}</h3><p className="muted">Path: {t.slug}</p></article>)}</div>}
  </main>;
}
