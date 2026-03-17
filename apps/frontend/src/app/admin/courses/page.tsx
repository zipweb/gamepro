'use client';

import { useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

export default function AdminCoursesPage() {
  const { ready, token } = useAdminGuard();
  const [message, setMessage] = useState('');

  async function createTrack() {
    await fetch('http://localhost:4000/api/v1/admin/tracks', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Track from Admin', slug: `track-${Date.now()}` }) });
    setMessage('Track created');
  }

  async function createCourse() {
    const trackId = prompt('Track ID', 'track-1') || 'track-1';
    await fetch('http://localhost:4000/api/v1/admin/courses', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ trackId, title: `Course ${Date.now()}`, description: 'Created from admin panel' }) });
    setMessage('Course created');
  }

  async function createModule() {
    const courseId = prompt('Course ID', 'course-1') || 'course-1';
    await fetch('http://localhost:4000/api/v1/admin/modules', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, title: 'New Module', position: 99 }) });
    setMessage('Module created');
  }

  async function createLesson() {
    const moduleId = prompt('Module ID', 'module-1') || 'module-1';
    await fetch('http://localhost:4000/api/v1/admin/lessons', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        moduleId,
        title: 'Admin Lesson',
        position: 99,
        localizations: [
          { locale: 'en', provider: 'youtube', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
          { locale: 'es', provider: 'dailymotion', sourceUrl: 'https://www.dailymotion.com/video/x7u5x4y' },
          { locale: 'fr', provider: 'bunny', sourceUrl: 'https://video.bunnycdn.com/play/abc/def' },
          { locale: 'pt-br', provider: 'embed', embedCode: '<iframe src="https://example.com/embed/ptbr"></iframe>' },
          { locale: 'pt-pt', provider: 'youtube', sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }
        ]
      })
    });
    setMessage('Lesson created');
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <h1>Courses Management</h1>
      <AdminNav />
      <div className="card">
        <h3 className="section-title">Quick actions</h3>
        <div className="admin-toolbar">
          <button onClick={createTrack}>Create track</button>
          <button onClick={createCourse}>Create course</button>
          <button onClick={createModule}>Create module</button>
          <button onClick={createLesson}>Create lesson</button>
        </div>
        {message && <p>{message}</p>}
      </div>
      <div className="card">
        <h3 className="section-title">Lesson localization support</h3>
        <p>Supported languages: en, es, fr, pt-br, pt-pt.</p>
        <p>Providers: YouTube, Bunny, Dailymotion, Embed code.</p>
      </div>
    </main>
  );
}
