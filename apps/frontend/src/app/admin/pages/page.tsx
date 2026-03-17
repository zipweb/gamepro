'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNav, useAdminGuard } from '../../../components/admin/AdminGuard';
import '../../../components/lms/lms.css';
import '../../../components/admin/admin.css';

type Block = {
  id: string;
  type: 'text' | 'image' | 'button' | 'video' | 'section' | 'columns' | 'logo' | 'nav' | 'link';
  props: Record<string, string>;
};

type BuilderPage = {
  id: string;
  name: string;
  slug: string;
  pageType: string;
  visibility: 'public' | 'private';
  content: { blocks: Block[] };
  layout?: {
    disableGlobalHeader?: boolean;
    disableGlobalFooter?: boolean;
    customHeaderBlocks?: Block[] | null;
    customFooterBlocks?: Block[] | null;
  };
};

const palette: Block['type'][] = ['section', 'columns', 'text', 'image', 'button', 'video', 'logo', 'nav', 'link'];

function createBlock(type: Block['type']): Block {
  return {
    id: `${type}-${Date.now()}-${Math.random().toString(16).slice(2, 7)}`,
    type,
    props: {
      text: type === 'text' ? 'Editable text' : type === 'button' ? 'Button' : type === 'logo' ? 'Logo' : type === 'link' ? 'Link' : '',
      src: type === 'image' ? 'https://picsum.photos/900/300' : '',
      href: ['button', 'logo', 'link'].includes(type) ? '/' : '',
      url: type === 'video' ? 'https://www.youtube.com/embed/dQw4w9WgXcQ' : '',
      items: type === 'nav' ? 'Home:/,Courses:/courses' : '',
      color: 'var(--text-color)',
      backgroundColor: type === 'section' ? 'var(--color-secondary)' : 'transparent',
      margin: '8px 0',
      padding: type === 'section' ? '24px' : '8px',
      fontSize: type === 'text' ? '20px' : '16px',
      fontWeight: type === 'text' ? '600' : '400',
      backgroundImage: ''
    }
  };
}

function renderBlock(block: Block) {
  const style: any = {
    color: block.props.color,
    backgroundColor: block.props.backgroundColor,
    margin: block.props.margin,
    padding: block.props.padding,
    fontSize: block.props.fontSize,
    fontWeight: block.props.fontWeight,
    backgroundImage: block.props.backgroundImage ? `url(${block.props.backgroundImage})` : undefined,
    backgroundSize: 'cover',
    borderRadius: '10px'
  };

  if (block.type === 'text') return <p contentEditable suppressContentEditableWarning style={style}>{block.props.text}</p>;
  if (block.type === 'image') return <img src={block.props.src} alt="block" style={{ width: '100%', borderRadius: 10, margin: block.props.margin }} />;
  if (block.type === 'button') return <a className="button" href={block.props.href} style={{ ...style, background: block.props.backgroundColor || 'var(--color-primary)', color: block.props.color || '#fff' }}>{block.props.text}</a>;
  if (block.type === 'video') return <iframe title={block.id} src={block.props.url} style={{ width: '100%', minHeight: 280, border: 0, borderRadius: 10, margin: block.props.margin }} />;
  if (block.type === 'columns') return <div style={{ ...style, display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}><div className="card">Column A</div><div className="card">Column B</div></div>;
  if (block.type === 'logo') return <a href={block.props.href} style={{ ...style, textDecoration: 'none' }}>{block.props.text || 'Logo'}</a>;
  if (block.type === 'link') return <a href={block.props.href} style={style}>{block.props.text || 'Link'}</a>;
  if (block.type === 'nav') {
    const items = (block.props.items || '').split(',').map((x) => x.trim()).filter(Boolean);
    return <div className="row" style={{ ...style, gap: '12px' }}>{items.map((item) => <span key={item}>{item.split(':')[0]}</span>)}</div>;
  }
  return <section style={style}><p>Section container</p></section>;
}

export default function AdminPagesBuilderPage() {
  const { ready, token } = useAdminGuard();
  const [pages, setPages] = useState<BuilderPage[]>([]);
  const [templates, setTemplates] = useState<string[]>([]);
  const [selectedPageId, setSelectedPageId] = useState('');
  const selected = useMemo(() => pages.find((p) => p.id === selectedPageId) || null, [pages, selectedPageId]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  async function load() {
    const res = await fetch('http://localhost:4000/api/v1/admin/pages', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPages(data.items || []);
    setTemplates(data.templates || []);
    if (!selectedPageId && data.items?.[0]?.id) setSelectedPageId(data.items[0].id);
  }

  useEffect(() => {
    if (!ready) return;
    load().catch(() => undefined);
  }, [ready]);

  async function createPage(template?: string) {
    await fetch('http://localhost:4000/api/v1/admin/pages', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: `Page ${Date.now()}`, slug: `page-${Date.now()}`, pageType: template || 'landing', template, visibility: 'public' })
    });
    await load();
  }

  async function savePage(next: BuilderPage) {
    await fetch(`http://localhost:4000/api/v1/admin/pages/${next.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(next)
    });
    await load();
  }

  async function removePage(pageId: string) {
    await fetch(`http://localhost:4000/api/v1/admin/pages/${pageId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSelectedPageId('');
    await load();
  }

  function mutateSelected(mutator: (p: BuilderPage) => BuilderPage) {
    if (!selected) return;
    const next = mutator(selected);
    setPages((prev) => prev.map((p) => (p.id === next.id ? next : p)));
  }

  if (!ready) return <main className="lms-shell">Checking admin access...</main>;

  return (
    <main className="lms-shell admin-shell">
      <h1>Page Builder</h1>
      <AdminNav />

      <div className="card">
        <div className="row">
          <button onClick={() => createPage()}>New blank page</button>
          {templates.map((tpl) => <button key={tpl} onClick={() => createPage(tpl)}>Use {tpl} template</button>)}
          <select value={selectedPageId} onChange={(e) => setSelectedPageId(e.target.value)}>
            <option value="">Select a page</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          {selected && <a className="button" href={`/site/${selected.slug}`} target="_blank">Open rendered page</a>}
          {selected && <button onClick={() => removePage(selected.id)}>Delete page</button>}
        </div>
      </div>

      {selected && (
        <div className="grid-2" style={{ alignItems: 'start' }}>
          <aside className="card">
            <h3>Components</h3>
            {palette.map((type) => (
              <div key={type} draggable onDragStart={(e) => e.dataTransfer.setData('componentType', type)} className="sidebar-item" style={{ cursor: 'grab', marginBottom: 8 }}>{type}</div>
            ))}

            <h3 style={{ marginTop: 16 }}>Page Settings</h3>
            <input value={selected.name} onChange={(e) => mutateSelected((p) => ({ ...p, name: e.target.value }))} placeholder="Page name" />
            <input value={selected.slug} onChange={(e) => mutateSelected((p) => ({ ...p, slug: e.target.value }))} placeholder="Slug" />
            <select value={selected.pageType} onChange={(e) => mutateSelected((p) => ({ ...p, pageType: e.target.value }))}>
              <option value="landing">landing</option>
              <option value="checkout">checkout</option>
              <option value="sales">sales</option>
              <option value="thank_you">thank_you</option>
              <option value="lead_capture">lead_capture</option>
            </select>
            <select value={selected.visibility} onChange={(e) => mutateSelected((p) => ({ ...p, visibility: e.target.value as 'public' | 'private' }))}>
              <option value="public">public</option>
              <option value="private">private</option>
            </select>

            <label className="row"><input type="checkbox" checked={!!selected.layout?.disableGlobalHeader} onChange={(e) => mutateSelected((p) => ({ ...p, layout: { ...(p.layout || {}), disableGlobalHeader: e.target.checked } }))} />Disable global header</label>
            <label className="row"><input type="checkbox" checked={!!selected.layout?.disableGlobalFooter} onChange={(e) => mutateSelected((p) => ({ ...p, layout: { ...(p.layout || {}), disableGlobalFooter: e.target.checked } }))} />Disable global footer</label>
            <label className="row"><input type="checkbox" checked={Array.isArray(selected.layout?.customHeaderBlocks)} onChange={(e) => mutateSelected((p) => ({ ...p, layout: { ...(p.layout || {}), customHeaderBlocks: e.target.checked ? (p.layout?.customHeaderBlocks || [createBlock('logo')]) : null } }))} />Custom header</label>
            <label className="row"><input type="checkbox" checked={Array.isArray(selected.layout?.customFooterBlocks)} onChange={(e) => mutateSelected((p) => ({ ...p, layout: { ...(p.layout || {}), customFooterBlocks: e.target.checked ? (p.layout?.customFooterBlocks || [createBlock('text')]) : null } }))} />Custom footer</label>

            <button className="primary" onClick={() => savePage(selected)}>Save page JSON</button>
          </aside>

          <section className="card" onDragOver={(e) => e.preventDefault()} onDrop={(e) => {
            const type = e.dataTransfer.getData('componentType') as Block['type'];
            if (!type) return;
            mutateSelected((p) => ({ ...p, content: { blocks: [...(p.content?.blocks || []), createBlock(type)] } }));
          }}>
            <h3>Live Preview</h3>
            {(selected.content?.blocks || []).map((block, index) => (
              <div key={block.id} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(e) => e.preventDefault()} onDrop={() => {
                if (draggedIndex === null) return;
                mutateSelected((p) => {
                  const blocks = [...p.content.blocks];
                  const [item] = blocks.splice(draggedIndex, 1);
                  blocks.splice(index, 0, item);
                  return { ...p, content: { blocks } };
                });
                setDraggedIndex(null);
              }} className="card" style={{ marginBottom: 10 }}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{block.type}</strong>
                  <button onClick={() => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.filter((b) => b.id !== block.id) } }))}>Remove</button>
                </div>
                {renderBlock(block)}
                <div className="row" style={{ marginTop: 8 }}>
                  <input value={block.props.text || ''} placeholder="text" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, text: e.target.value } } : b) } }))} />
                  <input value={block.props.href || ''} placeholder="href" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, href: e.target.value } } : b) } }))} />
                  <input value={block.props.items || ''} placeholder="nav items" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, items: e.target.value } } : b) } }))} />
                  <input value={block.props.color || ''} placeholder="color" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, color: e.target.value } } : b) } }))} />
                  <input value={block.props.backgroundColor || ''} placeholder="background color" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, backgroundColor: e.target.value } } : b) } }))} />
                  <input value={block.props.padding || ''} placeholder="padding" onChange={(e) => mutateSelected((p) => ({ ...p, content: { blocks: p.content.blocks.map((b) => b.id === block.id ? { ...b, props: { ...b.props, padding: e.target.value } } : b) } }))} />
                </div>
              </div>
            ))}
          </section>
        </div>
      )}
    </main>
  );
}
