'use client';

export const dynamic = 'force-dynamic';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import '../../components/lms/lms.css';
import '../../components/auth/auth.css';
import { Button } from '../../components/lms/ui';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError('');
    setMessage('');

    if (!token) {
      return setError('Reset token is missing.');
    }

    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters.');
    }

    const res = await fetch('http://localhost:4000/api/v1/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword })
    });

    if (!res.ok) {
      return setError('Reset failed');
    }

    setMessage('Password reset successful. You can now login.');
  }

  return (
    <main className="auth-shell">
      <h1>Create new password</h1>

      <div className="auth-card">
        <form onSubmit={onSubmit}>
          <div className="form-field">
            <label>New password</label>

            <div className="input-inline">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />

              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          <Button className="btn-primary" type="submit">
            Set password
          </Button>
        </form>

        {message && <p className="message">{message}</p>}
        {error && <p className="error">{error}</p>}
      </div>
    </main>
  );
}
