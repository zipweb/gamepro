'use client';

import { useState } from 'react';
import '../../components/lms/lms.css';

export default function PaywallPage() {
  const [loading, setLoading] = useState(false);

  async function renewSubscription() {
    setLoading(true);
    const token = localStorage.getItem('accessToken');
    const res = await fetch('http://localhost:4000/api/v1/billing/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ planKey: 'monthly' })
    });
    const data = await res.json();
    if (data.checkoutUrl) window.location.href = data.checkoutUrl;
    setLoading(false);
  }

  async function openPortal() {
    const token = localStorage.getItem('accessToken');
    const res = await fetch('http://localhost:4000/api/v1/billing/portal', {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  }

  return (
    <main className="lms-shell">
      <h1>Your subscription expired</h1>
      <p>Your access is restricted until payment is updated.</p>
      <div className="row">
        <button onClick={renewSubscription} disabled={loading}>{loading ? 'Redirecting...' : 'Renew subscription'}</button>
        <button onClick={openPortal}>Manage billing</button>
      </div>
    </main>
  );
}
