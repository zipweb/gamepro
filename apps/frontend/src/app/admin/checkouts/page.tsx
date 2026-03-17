'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

export default function AdminCheckoutsPage() {
  const { ready, token } = useAdminGuard();
  const [items, setItems] = useState<any[]>([]);
  const [tenantId, setTenantId] = useState('default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || 'default');
    }
  }, []);

  function load() {
    fetch('http://localhost:4000/api/v1/admin/checkouts', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }

  useEffect(() => {
    if (ready) load();
  }, [ready, tenantId]);

  async function createCheckoutPage() {
    await fetch('http://localhost:4000/api/v1/admin/checkouts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Checkout ${Date.now()}`,
        type: 'subscription',
        billingCycle: 'monthly',
        pricing: 49,
        language: 'en',
        customization: {
          colors: { primary: '#2b7cff', secondary: '#fff' },
          logo: 'https://example.com/logo.png',
          layout: 'centered'
        }
      })
    });
    load();
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <h1>Checkout Management</h1>
      <AdminNav />
      <div className="card admin-toolbar">
        <button onClick={createCheckoutPage}>Create checkout page</button>
      </div>
      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Pricing</th>
              <th>Language</th>
              <th>Layout</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.type}</td>
                <td>{i.pricing}</td>
                <td>{i.language}</td>
                <td>{i.customization?.layout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}