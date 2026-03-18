'use client';

import { Suspense } from 'react';
import ResetPasswordPage from './ResetPasswordPage';

export const dynamic = 'force-dynamic';

export default function Page() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
