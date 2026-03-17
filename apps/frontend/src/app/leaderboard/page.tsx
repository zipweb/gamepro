'use client';

import { useEffect, useState } from 'react';
import '../../components/lms/lms.css';

type Row = { rank: number; userId: string; name: string; xp: number };

export default function LeaderboardPage() {
  const [period, setPeriod] = useState('weekly');
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || '';
    fetch(`http://localhost:4000/api/v1/gamification/leaderboard?period=${period}&limit=20`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => setRows(d.items || []))
      .catch(() => undefined);
  }, [period]);

  return (
    <main className="lms-shell">
      <section className="hero">
        <h1>Leaderboard</h1>
        <p className="muted">Compete with top learners by XP.</p>
        <div className="row">
          <button className={period === 'weekly' ? 'primary' : ''} onClick={() => setPeriod('weekly')}>Weekly</button>
          <button className={period === 'monthly' ? 'primary' : ''} onClick={() => setPeriod('monthly')}>Monthly</button>
          <button className={period === 'all' ? 'primary' : ''} onClick={() => setPeriod('all')}>All time</button>
        </div>
      </section>

      {rows.map((row) => (
        <article className="card" key={row.userId}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <h3>#{row.rank} {row.name}</h3>
            <span className="pill">{row.xp} XP</span>
          </div>
        </article>
      ))}
    </main>
  );
}
