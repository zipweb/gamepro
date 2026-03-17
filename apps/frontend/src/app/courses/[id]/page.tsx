'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../../../components/lms/lms.css';
import { Breadcrumbs, EmptyState, ErrorState, LinkButton } from '../../../components/lms/ui';

type Lesson = { id: string; title: string; position: number; completed?: boolean };
type Module = { id: string; title: string; lessons: Lesson[] };
type Course = {
  id: string;
  title: string;
  description?: string;
  modules: Module[];
  progress?: {
    completedLessons: number;
    totalLessons: number;
    percentage: number;
  };
};

export default function CourseDetailPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [course, setCourse] = useState<Course | null>(null);
  const [error, setError] = useState('');

  function load() {
    setError('');

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    fetch(`http://localhost:4000/api/v1/courses/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((r) => r.json())
      .then((d) => setCourse(d))
      .catch(() => setError('Could not load this course.'));
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  if (error) {
    return (
      <main className="lms-shell">
        <ErrorState message={error} onRetry={load} />
      </main>
    );
  }

  if (!course) {
    return (
      <main className="lms-shell">
        <div className="skeleton h220" />
      </main>
    );
  }

  const nextLesson = course.modules?.flatMap((m) => m.lessons || [])[0];

  return (
    <main className="lms-shell">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: course.title }
        ]}
      />

      <section className="hero">
        <h1>{course.title}</h1>
        <p className="muted">{course.description}</p>

        <div className="progress">
          <span style={{ width: `${course.progress?.percentage || 0}%` }} />
        </div>
      </section>

      <div className="grid-2">
        <section className="card video-card">
          <h3>Resume where you left off</h3>
          <p className="muted">Pick the next lesson instantly.</p>

          {nextLesson ? (
            <LinkButton href={`/lessons/${nextLesson.id}`} variant="primary">
              Continue lesson
            </LinkButton>
          ) : (
            <p className="muted">No lessons yet.</p>
          )}
        </section>

        <aside className="card">
          <h3>Modules</h3>

          {course.modules?.length === 0 ? (
            <EmptyState
              title="No lessons yet"
              description="This course is being prepared."
            />
          ) : (
            <ul className="sidebar-list">
              {course.modules?.flatMap((mod) =>
                mod.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <a
                      className={`sidebar-item ${
                        lesson.completed ? 'active' : ''
                      }`}
                      href={`/lessons/${lesson.id}`}
                    >
                      {lesson.position}. {lesson.title}{' '}
                      {lesson.completed ? '✓' : ''}
                    </a>
                  </li>
                ))
              )}
            </ul>
          )}
        </aside>
      </div>
    </main>
  );
}