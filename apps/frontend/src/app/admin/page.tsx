'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../components/admin/AdminGuard';
import '../../components/lms/lms.css';
import '../../components/admin/admin.css';

export default function AdminDashboardPage() {
  const { ready } = useAdminGuard();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('accessToken') || '';
    if (!ready) return;
    fetch('http://localhost:4000/api/v1/admin/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => undefined);
  }, [ready]);

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
      </div>
      <AdminNav />

      <section className="admin-kpi-grid">
        <div className="admin-kpi">
          <div className="admin-kpi-label">Total users</div>
          <div className="admin-kpi-value">{data?.totalUsers ?? '-'}</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label">Active subscriptions</div>
          <div className="admin-kpi-value">{data?.activeSubscriptions ?? '-'}</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label">Canceled subscriptions</div>
          <div className="admin-kpi-value">{data?.canceledSubscriptions ?? '-'}</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label">Total revenue (basic)</div>
          <div className="admin-kpi-value">${data?.revenueOverview?.totalRevenue ?? 0}</div>
        </div>
        <div className="admin-kpi">
          <div className="admin-kpi-label">Course completion rate</div>
          <div className="admin-kpi-value">{data?.courseCompletionRate ?? 0}%</div>
        </div>
      </section>

      <div className="card">
        <h3 className="section-title">Recent activity</h3>
        <ul>
          {(data?.recentActivity || []).map((a: any) => <li key={a.id}>{a.message}</li>)}
        </ul>
      </div>
    </main>
  );
}
