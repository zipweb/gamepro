'use client';

import { useState } from 'react';
import '../../components/lms/lms.css';
import '../../components/auth/auth.css';
import { Button } from '../../components/lms/ui';
import { emitToast } from '../../components/theme/toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email) return setError('Email is required.');
    setLoading(true);
    const res = await fetch('http://localhost:4000/api/v1/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
    setLoading(false);
    if (!res.ok) return setError('Request failed.');
    setMessage('If your account exists, a reset email has been sent.');
    emitToast('Reset email sent.', 'info');
  }

  return <main className="auth-shell"><h1>Forgot password</h1><div className="auth-card"><form onSubmit={onSubmit}><div className="form-field"><label>Email</label><input autoFocus type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><Button className="btn-primary" loading={loading} type="submit">Send reset email</Button></form>{message && <p className="message">{message}</p>}{error && <p className="error">{error}</p>}</div></main>;
}
