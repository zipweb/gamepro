'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';
import { Button, EmptyState, ErrorState } from '../../../components/lms/ui';
import { emitToast } from '../../../components/theme/toast';

type Student = { id: string; email: string; name?: string; country?: string; status: string; subscriptionBadge?: string };

export default function AdminStudentsPage() {
  const { ready, token } = useAdminGuard();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  function load() {
    setLoading(true); setError('');
    fetch('http://localhost:4000/api/v1/admin/students', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()).then((d) => setStudents(d.items || [])).catch(() => setError('Could not load students.')).finally(() => setLoading(false));
  }

  useEffect(() => { if (ready && token) load(); }, [ready, token]);

  async function deleteStudent(id: string) {
    await fetch(`http://localhost:4000/api/v1/admin/students/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setConfirmId(null);
    emitToast('Student removed.', 'success');
    load();
  }

  if (!ready) return <main className="lms-shell"><div className="skeleton h24" /></main>;

  return <main className="lms-shell admin-shell">
    <h1>Students Management</h1>
    <AdminNav />
    <div className="card admin-toolbar"><Button onClick={load}>Refresh</Button><Button disabled={selected.length === 0}>Send email ({selected.length})</Button></div>
    {error && <ErrorState message={error} onRetry={load} />}
    {loading ? <div className="skeleton h220" /> : students.length === 0 ? <EmptyState title="No students yet" description="Invite students to begin tracking cohorts." /> :
      <div className="card"><table className="admin-table"><thead><tr><th></th><th>Name</th><th>Email</th><th>Status</th><th>Subscription</th><th>Actions</th></tr></thead><tbody>{students.map((s) => <tr key={s.id}><td><input type="checkbox" checked={selected.includes(s.id)} onChange={(e) => setSelected((prev) => e.target.checked ? [...prev, s.id] : prev.filter((x) => x !== s.id))} /></td><td>{s.name || '-'}</td><td>{s.email}</td><td>{s.status}</td><td><span className={`badge ${s.subscriptionBadge === 'Active' ? 'active' : s.subscriptionBadge === 'Awaiting Payment' ? 'awaiting' : 'blocked'}`}>{s.subscriptionBadge || 'Blocked'}</span></td><td><Button variant="danger" onClick={() => setConfirmId(s.id)}>Delete</Button></td></tr>)}</tbody></table></div>}

    {confirmId && <div className="modal-overlay" onClick={() => setConfirmId(null)}><div className="card modal" onClick={(e) => e.stopPropagation()}><h3>Delete student?</h3><p className="muted">This action cannot be undone.</p><div className="row"><Button variant="ghost" onClick={() => setConfirmId(null)}>Cancel</Button><Button variant="danger" onClick={() => deleteStudent(confirmId)}>Confirm delete</Button></div></div></div>}
  </main>;
}
