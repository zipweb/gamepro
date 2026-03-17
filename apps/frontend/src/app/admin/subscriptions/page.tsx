'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

export default function AdminSubscriptionsPage() {
  const { ready, token } = useAdminGuard();
  const [items, setItems] = useState<any[]>([]);

  useEffect(() => {
    if (!ready) return;
    fetch('http://localhost:4000/api/v1/admin/subscriptions', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, [ready, token]);

  const badgeClass = (badge: string) => {
    if (badge === 'Active') return 'badge active';
    if (badge === 'Awaiting Payment') return 'badge awaiting';
    return 'badge blocked';
  };

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;
  return (
    <main className="lms-shell admin-shell">
      <h1>Subscriptions</h1>
      <AdminNav />
      <div className="card">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Internal status</th>
              <th>Grace period</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.stripeSubscriptionId}>
                <td>{s.email || s.userId}</td>
                <td><span className={badgeClass(s.badge)}>{s.badge}</span></td>
                <td>{s.status}</td>
                <td>{s.gracePeriodEndsAt || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
