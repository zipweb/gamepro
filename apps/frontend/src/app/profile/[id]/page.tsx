'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../../../components/lms/lms.css';

type Profile = {
  id: string;
  name: string;
  avatar?: string | null;
  country?: string | null;
  bio?: string | null;
  socialLinks?: {
    instagram?: string | null;
    discord?: string | null;
    telegram?: string | null;
  };
};

export default function ProfilePage() {
  const params = useParams();
  const id = String(params?.id || '');

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:4000/api/v1/community/profiles/${id}`)
      .then((r) => r.json())
      .then(setProfile)
      .catch(() => undefined);
  }, [id]);

  if (!profile) {
    return (
      <main className="lms-shell">
        <div className="skeleton h24" />
      </main>
    );
  }

  return (
    <main className="lms-shell">
      <section className="hero">
        <h1>{profile.name}</h1>
        <p className="muted">
          {profile.country || 'Country not set'}
        </p>
      </section>

      <article className="card">
        <p><strong>Bio:</strong> {profile.bio || 'No bio yet.'}</p>
        <p><strong>Instagram:</strong> {profile.socialLinks?.instagram || '-'}</p>
        <p><strong>Discord:</strong> {profile.socialLinks?.discord || '-'}</p>
        <p><strong>Telegram:</strong> {profile.socialLinks?.telegram || '-'}</p>
      </article>

      <a className="button" href="/community">
        Back to community
      </a>
    </main>
  );
}