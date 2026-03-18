'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import '../../components/lms/lms.css';
import '../../components/auth/auth.css';
import { Button } from '../../components/lms/ui';

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');

  return (
    <div>
      <h1>Resetar senha</h1>
      <input
        type="password"
        placeholder="Nova senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <Button>Enviar</Button>
    </div>
  );
}
