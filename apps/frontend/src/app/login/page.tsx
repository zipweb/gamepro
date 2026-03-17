'use client';

import { useState } from 'react';
import '../../components/lms/lms.css';
import '../../components/auth/auth.css';
import { Button } from '../../components/lms/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setMessage('');
    if (!email || !password) return setError('Email and password are required.');
    setLoading(true);
    const res = await fetch('http://localhost:4000/api/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-tenant-id': 'default' }, body: JSON.stringify({ email, password }) });
    setLoading(false);
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Login failed');
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    setMessage('Login successful. Redirecting...');
    window.location.href = '/dashboard';
  }

  return <main className="auth-shell"><h1>Welcome back</h1><div className="auth-card"><form onSubmit={onSubmit}><div className="form-field"><label htmlFor="email">Email</label><input autoFocus id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div className="form-field"><label htmlFor="password">Password</label><div className="input-inline"><input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} /><Button type="button" variant="ghost" onClick={() => setShowPassword((v) => !v)}>{showPassword ? 'Hide' : 'Show'}</Button></div></div><Button className="btn-primary" loading={loading} type="submit">Login</Button></form>{message && <p className="message">{message}</p>}{error && <p className="error">{error}</p>}<a href="/forgot-password">Forgot password?</a></div></main>;
}
