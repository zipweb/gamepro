'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

type Branding = {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  fontFamily: string;
};

const DEFAULTS: Branding = {
  logoUrl: '',
  faviconUrl: '',
  primaryColor: '#7c5cff',
  secondaryColor: '#1f2a46',
  accentColor: '#29d3ff',
  backgroundColor: '#0b1020',
  textColor: '#e6ecff',
  fontFamily: 'Inter, system-ui, sans-serif'
};

export default function AdminBrandingPage() {
  const { ready, token } = useAdminGuard();
  const [brand, setBrand] = useState<Branding>(DEFAULTS);
  const [tenantId, setTenantId] = useState('default');

  useEffect(() => {
    const storedTenant = localStorage.getItem('tenantId') || 'default';
    setTenantId(storedTenant);
  }, []);

  useEffect(() => {
    if (!ready) return;
    fetch(`http://localhost:4000/api/v1/admin/branding?tenantId=${encodeURIComponent(tenantId)}`, { headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId } })
      .then((r) => r.json())
      .then((d) => setBrand({ ...DEFAULTS, ...d }))
      .catch(() => undefined);
  }, [ready, tenantId]);

  async function save() {
    localStorage.setItem('tenantId', tenantId);
    await fetch(`http://localhost:4000/api/v1/admin/branding?tenantId=${encodeURIComponent(tenantId)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'x-tenant-id': tenantId, 'Content-Type': 'application/json' },
      body: JSON.stringify(brand)
    });
    alert('Branding saved');
  }

  const previewVars = useMemo(() => ({
    '--color-primary': brand.primaryColor,
    '--color-secondary': brand.secondaryColor,
    '--color-accent': brand.accentColor,
    '--background-color': brand.backgroundColor,
    '--text-color': brand.textColor,
    '--font-family': brand.fontFamily
  } as React.CSSProperties), [brand]);

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <h1>White-label Branding</h1>
      <AdminNav />

      <section className="card">
        <h3>Brand Settings</h3>
        <div className="row">
          <input placeholder="Tenant ID" value={tenantId} onChange={(e) => setTenantId(e.target.value || 'default')} />
          <input placeholder="Logo URL" value={brand.logoUrl} onChange={(e) => setBrand({ ...brand, logoUrl: e.target.value })} />
          <input placeholder="Favicon URL" value={brand.faviconUrl} onChange={(e) => setBrand({ ...brand, faviconUrl: e.target.value })} />
          <input placeholder="Primary color" value={brand.primaryColor} onChange={(e) => setBrand({ ...brand, primaryColor: e.target.value })} />
          <input placeholder="Secondary color" value={brand.secondaryColor} onChange={(e) => setBrand({ ...brand, secondaryColor: e.target.value })} />
          <input placeholder="Accent color" value={brand.accentColor} onChange={(e) => setBrand({ ...brand, accentColor: e.target.value })} />
          <input placeholder="Background color" value={brand.backgroundColor} onChange={(e) => setBrand({ ...brand, backgroundColor: e.target.value })} />
          <input placeholder="Text color" value={brand.textColor} onChange={(e) => setBrand({ ...brand, textColor: e.target.value })} />
          <input placeholder="Font family (or google(Font Name))" value={brand.fontFamily} onChange={(e) => setBrand({ ...brand, fontFamily: e.target.value })} />
        </div>
        <button className="primary" onClick={save}>Save Branding</button>
      </section>

      <section className="card" style={previewVars}>
        <h3>Live Preview</h3>
        <div className="hero">
          {brand.logoUrl ? <img src={brand.logoUrl} alt="logo" style={{ maxHeight: 42 }} /> : <span className="pill">Logo preview</span>}
          <h2 style={{ marginTop: 10 }}>Your branded LMS experience</h2>
          <p className="muted">Dashboard, courses, community, checkout, emails, and builder components inherit this theme.</p>
          <div className="row">
            <button className="primary">Primary CTA</button>
            <button>Secondary CTA</button>
          </div>
        </div>
      </section>
    </main>
  );
}
