'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

export default function AdminStripePage() {
  const { ready, token } = useAdminGuard();
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    if (!ready) return;
    fetch('http://localhost:4000/api/v1/admin/stripe', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then(setSettings);
  }, [ready, token]);

  async function save() {
    await fetch('http://localhost:4000/api/v1/admin/stripe', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    alert('Saved');
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;
  return (
    <main className="lms-shell admin-shell">
      <h1>Stripe Settings</h1>
      <AdminNav />
      <div className="card">
        <h3 className="section-title">Billing configuration</h3>
        <div className="admin-toolbar">
          <input className="input" placeholder="Stripe Secret Key" value={settings.stripeSecretKey || ''} onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })} />
          <input className="input" placeholder="Stripe Publishable Key" value={settings.stripePublishableKey || ''} onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })} />
          <input className="input" placeholder="Customer Portal Link" value={settings.customerPortalUrl || ''} onChange={(e) => setSettings({ ...settings, customerPortalUrl: e.target.value })} />
          <label>
            <input type="checkbox" checked={settings.billingEnabled !== false} onChange={(e) => setSettings({ ...settings, billingEnabled: e.target.checked })} />
            {' '}Billing enabled
          </label>
          <button onClick={save}>Save settings</button>
        </div>
      </div>
    </main>
  );
}
