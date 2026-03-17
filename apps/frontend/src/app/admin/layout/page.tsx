'use client';

import { useEffect, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

type Block = { id: string; type: 'logo' | 'text' | 'nav' | 'button' | 'link' | 'section'; props: Record<string, string> };
type GlobalLayout = { header: { blocks: Block[] }; footer: { blocks: Block[] } };

const palette: Block['type'][] = ['section', 'logo', 'text', 'nav', 'button', 'link'];

function makeBlock(type: Block['type']): Block {
  const base = {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    type,
    props: { text: '', href: '/', color: '#e2e8f0', backgroundColor: 'transparent', padding: '8px', margin: '8px 0', items: 'Home:/,Courses:/courses', fontSize: '16px', fontWeight: '500' }
  };
  if (type === 'logo') base.props.text = 'Your Logo';
  if (type === 'text') base.props.text = 'Editable global text';
  if (type === 'button') { base.props.text = 'Action'; base.props.backgroundColor = '#7c5cff'; base.props.color = '#fff'; }
  if (type === 'link') { base.props.text = 'Simple link'; base.props.color = '#93c5fd'; }
  if (type === 'section') base.props.backgroundColor = '#0f172a';
  return base;
}

function Preview({ block }: { block: Block }) {
  const style: any = {
    color: block.props.color,
    backgroundColor: block.props.backgroundColor,
    margin: block.props.margin,
    padding: block.props.padding,
    fontSize: block.props.fontSize,
    fontWeight: block.props.fontWeight,
    borderRadius: 8
  };
  if (block.type === 'logo') return <a href={block.props.href} style={{ ...style, textDecoration: 'none' }}>{block.props.text || 'Logo'}</a>;
  if (block.type === 'text') return <p style={style}>{block.props.text}</p>;
  if (block.type === 'button') return <a href={block.props.href} className="button" style={style}>{block.props.text}</a>;
  if (block.type === 'link') return <a href={block.props.href} style={style}>{block.props.text}</a>;
  if (block.type === 'nav') {
    const items = (block.props.items || '').split(',').map((x) => x.trim()).filter(Boolean);
    return <div className="row" style={{ gap: block.props.gap || '12px', ...style }}>{items.map((it) => <span key={it}>{it.split(':')[0]}</span>)}</div>;
  }
  return <section style={style}>Section container</section>;
}

export default function AdminLayoutPage() {
  const { ready, token } = useAdminGuard();
  const [layout, setLayout] = useState<GlobalLayout>({ header: { blocks: [] }, footer: { blocks: [] } });
  const [target, setTarget] = useState<'header' | 'footer'>('header');

  async function load() {
    const res = await fetch('http://localhost:4000/api/v1/admin/layout', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setLayout({ header: { blocks: data.header?.blocks || [] }, footer: { blocks: data.footer?.blocks || [] } });
  }

  useEffect(() => {
    if (!ready) return;
    load().catch(() => undefined);
  }, [ready]);

  function mutate(which: 'header' | 'footer', updater: (blocks: Block[]) => Block[]) {
    setLayout((prev) => ({ ...prev, [which]: { blocks: updater(prev[which].blocks) } }));
  }

  async function save() {
    await fetch('http://localhost:4000/api/v1/admin/layout', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    });
    await load();
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  const blocks = layout[target].blocks;

  return (
    <main className="lms-shell admin-shell">
      <h1>Global Layout</h1>
      <AdminNav />

      <div className="card row">
        <button className={target === 'header' ? 'primary' : ''} onClick={() => setTarget('header')}>Edit Header</button>
        <button className={target === 'footer' ? 'primary' : ''} onClick={() => setTarget('footer')}>Edit Footer</button>
        <button className="primary" onClick={save}>Save Global Layout</button>
      </div>

      <div className="grid-2">
        <aside className="card">
          <h3>Components</h3>
          {palette.map((type) => (
            <div key={type} className="sidebar-item" draggable onDragStart={(e) => e.dataTransfer.setData('componentType', type)}>{type}</div>
          ))}
          <p className="muted" style={{ marginTop: 8 }}>Drag items into the preview area.</p>
        </aside>

        <section
          className="card"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            const type = e.dataTransfer.getData('componentType') as Block['type'];
            if (!type) return;
            mutate(target, (prev) => [...prev, makeBlock(type)]);
          }}
        >
          <h3>{target === 'header' ? 'Header' : 'Footer'} Preview</h3>
          {blocks.map((block) => (
            <article key={block.id} className="card" style={{ marginBottom: 10 }}>
              <div className="row" style={{ justifyContent: 'space-between' }}>
                <strong>{block.type}</strong>
                <button onClick={() => mutate(target, (prev) => prev.filter((b) => b.id !== block.id))}>Remove</button>
              </div>
              <Preview block={block} />
              <div className="row" style={{ marginTop: 8 }}>
                <input value={block.props.text || ''} placeholder="text" onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, text: e.target.value } } : b))} />
                <input value={block.props.href || ''} placeholder="href" onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, href: e.target.value } } : b))} />
                <input value={block.props.items || ''} placeholder="nav items label:url,..." onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, items: e.target.value } } : b))} />
                <input value={block.props.color || ''} placeholder="color" onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, color: e.target.value } } : b))} />
                <input value={block.props.backgroundColor || ''} placeholder="background" onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, backgroundColor: e.target.value } } : b))} />
                <input value={block.props.padding || ''} placeholder="padding" onChange={(e) => mutate(target, (prev) => prev.map((b) => b.id === block.id ? { ...b, props: { ...b.props, padding: e.target.value } } : b))} />
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
