const modules = [
  'auth',
  'courses',
  'community',
  'payments',
  'checkout',
  'gamification',
  'pagebuilder',
  'admin',
  'dashboard'
];

export default function HomePage() {
  return (
    <main style={{ fontFamily: 'sans-serif', padding: 24 }}>
      <h1>LMS Frontend Foundation</h1>
      <p>Next.js app scaffold with modular domain folders.</p>
      <ul>
        {modules.map((mod) => (
          <li key={mod}>{mod}</li>
        ))}
      </ul>
      <p><a href="/login">Go to login</a></p>
      <p><a href="/dashboard">Student dashboard</a></p>
      <p><a href="/courses">Course list</a></p>
      <p><a href="/community">Community feed</a></p>
      <p><a href="/leaderboard">Leaderboard</a></p>
      <p><a href="/paywall">Paywall</a></p>
      <p><a href="/admin">Admin Panel</a></p>
      <p><a href="/admin/pages">Page Builder</a></p>
      <p><a href="/admin/layout">Global Layout</a></p>
      <p><a href="/admin/branding">Branding</a></p>
    </main>
  );
}
