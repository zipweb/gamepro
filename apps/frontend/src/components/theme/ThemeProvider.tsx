'use client';

import { useEffect, useState } from 'react';

type Branding = {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
};

type ToastItem = { id: number; message: string; tone: 'success' | 'error' | 'info' };

function applyBranding(branding: Branding) {
  const root = document.documentElement;
  root.style.setProperty('--color-primary', branding.primaryColor || '#7c5cff');
  root.style.setProperty('--color-secondary', branding.secondaryColor || '#1f2a46');
  root.style.setProperty('--color-accent', branding.accentColor || '#29d3ff');
  root.style.setProperty('--background-color', branding.backgroundColor || '#0b1020');
  root.style.setProperty('--text-color', branding.textColor || '#e6ecff');
  root.style.setProperty('--font-family', branding.fontFamily || 'Inter, system-ui, sans-serif');

  if (branding.faviconUrl) {
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const tenantId = localStorage.getItem('tenantId') || 'default';
    fetch(`http://localhost:4000/api/v1/branding?tenantId=${encodeURIComponent(tenantId)}`)
      .then((r) => r.json())
      .then((d) => applyBranding(d || {}))
      .catch(() => applyBranding({}));

    const listener = (event: Event) => {
      const custom = event as CustomEvent<{ message: string; tone: 'success' | 'error' | 'info' }>;
      const toast = { id: Date.now() + Math.random(), ...custom.detail };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => setToasts((prev) => prev.filter((item) => item.id !== toast.id)), 2800);
    };

    window.addEventListener('lms:toast', listener);
    return () => window.removeEventListener('lms:toast', listener);
  }, []);

  return (
    <>
      {children}
      <aside className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.tone}`}>{toast.message}</div>
        ))}
      </aside>
    </>
  );
}
