'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';

export default function AdminEmailsPage() {
  const { ready, token } = useAdminGuard();

  const [templates, setTemplates] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null>(null);
  const [smtp, setSmtp] = useState<any>({ host: '', port: '1025', user: '', password: '' });
  const [branding, setBranding] = useState<any>({
    primaryColor: '#7c5cff',
    secondaryColor: '#1f2a46',
    logoUrl: ''
  });

  const [tenantId, setTenantId] = useState('default');

  // ✅ SSR-safe tenantId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTenantId(localStorage.getItem('tenantId') || 'default');
    }
  }, []);

  function load() {
    fetch('http://localhost:4000/api/v1/admin/emails/templates', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    })
      .then((r) => r.json())
      .then((d) => setTemplates(d.items || []));

    fetch('http://localhost:4000/api/v1/admin/emails/settings', {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    })
      .then((r) => r.json())
      .then(setSmtp);

    // ✅ corrigido com crase
    fetch(`http://localhost:4000/api/v1/admin/branding?tenantId=${encodeURIComponent(tenantId)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId
      }
    })
      .then((r) => r.json())
      .then(setBranding)
      .catch(() => undefined);
  }

  // ✅ inclui tenantId
  useEffect(() => {
    if (ready) load();
  }, [ready, tenantId]);

  async function saveTemplate() {
    const payload = editing || {
      name: `Template ${Date.now()}`,
      subject: 'Custom subject',
      logoUrl: branding.logoUrl || 'https://example.com/logo.png',
      colors: {
        primary: branding.primaryColor || '#222',
        secondary: branding.secondaryColor || '#fff',
        button: branding.primaryColor || '#2b7cff'
      },
      buttons: [{ label: 'Open LMS', url: 'https://gamepro.network' }],
      content: '<p>Custom content</p>'
    };

    await fetch('http://localhost:4000/api/v1/admin/emails/templates', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    setEditing(null);
    load();
  }

  async function saveSmtp() {
    await fetch('http://localhost:4000/api/v1/admin/emails/settings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(smtp)
    });

    alert('SMTP settings saved');
  }

  async function sendTestEmail() {
    const toEmail = prompt('Test recipient email');
    if (!toEmail) return;

    await fetch('http://localhost:4000/api/v1/admin/emails/test', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'x-tenant-id': tenantId,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ toEmail })
    });

    alert('Test email queued');
  }

  const preview = useMemo(() => ({
    name: editing?.name || 'Branded Template Preview',
    subject: editing?.subject || 'Your LMS update',
    logoUrl: editing?.logoUrl || branding.logoUrl,
    colors: {
      primary: editing?.colors?.primary || branding.primaryColor,
      secondary: editing?.colors?.secondary || branding.secondaryColor,
      button: editing?.colors?.button || branding.primaryColor
    },
    content: editing?.content || '<p>Welcome to your branded LMS email experience.</p>',
    buttons: editing?.buttons || [
      { label: 'Go to dashboard', url: 'https://gamepro.network/dashboard' }
    ]
  }), [editing, branding]);

  if (!ready) {
    return <main className="lms-shell">Checking admin access...</main>;
  }

  return (
    <main className="lms-shell">
      <h1>Email System</h1>
      <AdminNav />

      <div className="card">
        <h3>Email Templates</h3>

        <button
          onClick={() =>
            setEditing({
              name: '',
              subject: '',
              content: '<p></p>',
              logoUrl: branding.logoUrl || '',
              colors: {
                primary: branding.primaryColor || '#222',
                secondary: branding.secondaryColor || '#fff',
                button: branding.primaryColor || '#2b7cff'
              },
              buttons: []
            })
          }
        >
          New template
        </button>

        <button onClick={saveTemplate} disabled={!editing}>
          Save template
        </button>

        {editing && (
          <div className="row">
            <input
              placeholder="Template name"
              value={editing.name || ''}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
            <input
              placeholder="Subject"
              value={editing.subject || ''}
              onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
            />
            <input
              placeholder="Logo URL"
              value={editing.logoUrl || ''}
              onChange={(e) => setEditing({ ...editing, logoUrl: e.target.value })}
            />
            <input
              placeholder="Primary color"
              value={editing.colors?.primary || ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  colors: { ...(editing.colors || {}), primary: e.target.value }
                })
              }
            />
            <input
              placeholder="Secondary color"
              value={editing.colors?.secondary || ''}
              onChange={(e) =>
                setEditing({
                  ...editing,
                  colors: { ...(editing.colors || {}), secondary: e.target.value }
                })
              }
            />
            <textarea
              placeholder="HTML content"
              value={editing.content || ''}
              onChange={(e) => setEditing({ ...editing, content: e.target.value })}
            />
            <textarea
              placeholder='Buttons JSON [{"label":"Open","url":"https://..."}]'
              value={JSON.stringify(editing.buttons || [])}
              onChange={(e) => {
                try {
                  setEditing({ ...editing, buttons: JSON.parse(e.target.value) });
                } catch {}
              }}
            />
          </div>
        )}

        {templates.map((t) => (
          <div className="card" key={t.id}>
            <p><b>{t.name}</b></p>
            <p>Subject: {t.subject}</p>
            <p>Primary color: {t.colors?.primary}</p>
            <button onClick={() => setEditing(t)}>Edit</button>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Live Email Preview</h3>

        <div style={{ border: '1px solid #223052', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ background: preview.colors.primary, color: '#fff', padding: 16 }}>
            {preview.logoUrl ? (
              <img src={preview.logoUrl} alt="logo" style={{ maxHeight: 36 }} />
            ) : (
              <strong>{preview.name}</strong>
            )}
            <p style={{ marginTop: 8 }}>{preview.subject}</p>
          </div>

          <div style={{ background: '#fff', color: '#111', padding: 16 }}>
            <div dangerouslySetInnerHTML={{ __html: preview.content }} />

            <div className="row">
              {(preview.buttons || []).map((b: any) => (
                <a
                  key={b.label + b.url}
                  className="button"
                  style={{ background: preview.colors.button, color: '#fff' }}
                  href={b.url}
                >
                  {b.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>SMTP Settings</h3>

        <div className="row">
          <input placeholder="Host" value={smtp.host || ''} onChange={(e) => setSmtp({ ...smtp, host: e.target.value })} />
          <input placeholder="Port" value={smtp.port || ''} onChange={(e) => setSmtp({ ...smtp, port: e.target.value })} />
          <input placeholder="User" value={smtp.user || ''} onChange={(e) => setSmtp({ ...smtp, user: e.target.value })} />
          <input placeholder="Password" value={smtp.password || ''} onChange={(e) => setSmtp({ ...smtp, password: e.target.value })} />
        </div>

        <div className="row">
          <button onClick={saveSmtp}>Save SMTP</button>
          <button onClick={sendTestEmail}>Send test email</button>
        </div>
      </div>
    </main>
  );
}