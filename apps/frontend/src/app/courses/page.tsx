'use client';

import { useEffect, useState } from 'react';
import '../../components/lms/lms.css';
import { EmptyState, ErrorState, LinkButton, SkeletonCards } from '../../components/lms/ui';

type Course = { id: string; title: string; description?: string; lessonsCount: number; progress?: number };

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true); setError('');
    fetch('http://localhost:4000/api/v1/courses').then((r) => r.json()).then((d) => setCourses(d.items || [])).catch(() => setError('Unable to load courses right now.')).finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return <main className="lms-shell">
    <section className="hero"><h1>Courses</h1><p className="muted">Premium learning paths with clear progress and quick resume.</p></section>
    {error && <ErrorState message={error} onRetry={load} />}
    {loading ? <SkeletonCards count={4} /> : courses.length === 0 ? <EmptyState title="No courses yet" description="When courses are published, they will show up here." ctaLabel="Go to dashboard" ctaHref="/dashboard" /> :
      <div className="rail">{courses.map((course) => <article className="card" key={course.id}><span className="pill">{course.lessonsCount} lessons</span><h3>{course.title}</h3><p className="muted">{course.description || 'No description yet.'}</p><div className="progress"><span style={{ width: `${course.progress || 0}%` }} /></div><LinkButton href={`/courses/${course.id}`} variant="primary">Resume course</LinkButton></article>)}</div>}
  </main>;
}
