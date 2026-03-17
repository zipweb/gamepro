'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import './admin.css';

export function useAdminGuard() {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken') || '';
    if (!accessToken) {
      window.location.href = '/login';
      return;
    }
    setToken(accessToken);
    fetch('http://localhost:4000/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.user || d.user.globalRole !== 'ADMIN') {
          window.location.href = '/dashboard';
          return;
        }
        setReady(true);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  return { ready, token };
}

export function AdminNav() {
  const pathname = usePathname();
  const links = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/students', label: 'Students' },
    { href: '/admin/courses', label: 'Courses' },
    { href: '/admin/subscriptions', label: 'Subscriptions' },
    { href: '/admin/emails', label: 'Emails' },
    { href: '/admin/stripe', label: 'Stripe' },
    { href: '/admin/checkouts', label: 'Checkouts' },
    { href: '/admin/community', label: 'Community' },
    { href: '/admin/pages', label: 'Page Builder' },
    { href: '/admin/layout', label: 'Global Layout' },
    { href: '/admin/branding', label: 'Branding' }
  ];

  return (
    <nav className="admin-nav">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <a key={link.href} className={`admin-nav-link ${active ? 'active' : ''}`} href={link.href}>
            {link.label}
          </a>
        );
      })}
    </nav>
  );
}
