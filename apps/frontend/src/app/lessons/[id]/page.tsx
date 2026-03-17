'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../../../components/lms/lms.css';
import { Breadcrumbs, Button, ErrorState, LinkButton } from '../../../components/lms/ui';
import { emitToast } from '../../../components/theme/toast';

type Localization = {
  provider: string;
  sourceUrl?: string;
  embedCode?: string;
  locale: string;
};

type Lesson = {
  id: string;
  title: string;
  selectedLanguage: string;
  localization?: Localization;
  availableLanguages: string[];
};

export default function LessonPage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [lang, setLang] = useState('');
  const [error, setError] = useState('');
  const [loadingComplete, setLoadingComplete] = useState(false);

  function load(selected?: string) {
    setError('');

    const q = selected ? `?lang=${encodeURIComponent(selected)}` : '';

    fetch(`http://localhost:4000/api/v1/lessons/${id}${q}`)
      .then((r) => r.json())
      .then((d) => {
        setLesson(d);
        setLang(d.selectedLanguage || selected || 'en');
      })
      .catch(() => setError('Could not load this lesson.'));
  }

  useEffect(() => {
    if (id) load();
  }, [id]);

  async function markComplete() {
    setLoadingComplete(true);

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    const res = await fetch(
      `http://localhost:4000/api/v1/lessons/${id}/complete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      }
    );

    setLoadingComplete(false);

    emitToast(
      res.ok
        ? 'Lesson completed. Great work!'
        : 'Could not update lesson progress.',
      res.ok ? 'success' : 'error'
    );
  }

  if (error) {
    return (
      <main className="lms-shell">
        <ErrorState message={error} onRetry={() => load()} />
      </main>
    );
  }

  if (!lesson) {
    return (
      <main className="lms-shell">
        <div className="skeleton h220" />
      </main>
    );
  }

  return (
    <main className="lms-shell">
      <Breadcrumbs
        items={[
          { label: 'Courses', href: '/courses' },
          { label: 'Lesson' }
        ]}
      />

      <section className="hero">
        <h1>{lesson.title}</h1>

        <div className="row">
          <label htmlFor="language">Language:</label>

          <select
            id="language"
            value={lang}
            onChange={(e) => {
              setLang(e.target.value);
              load(e.target.value);
            }}
          >
            {(lesson.availableLanguages || ['en']).map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="card video-card">
        <h3>Lesson player</h3>

        {!lesson.localization ? (
          <div className="skeleton h220" />
        ) : (
          <p className="muted">
            Provider: {lesson.localization.provider}{' '}
            {lesson.localization.sourceUrl && (
              <a href={lesson.localization.sourceUrl}>
                Open source
              </a>
            )}
          </p>
        )}

        <div className="row">
          <LinkButton href="/courses" variant="ghost">
            Previous
          </LinkButton>

          <LinkButton href="/courses" variant="secondary">
            Next
          </LinkButton>

          <Button
            variant="primary"
            onClick={markComplete}
            loading={loadingComplete}
          >
            Mark complete
          </Button>
        </div>
      </section>
    </main>
  );
}