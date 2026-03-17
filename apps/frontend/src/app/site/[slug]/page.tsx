'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import '../../../components/lms/lms.css';

type Block = { id: string; type: string; props: Record<string, string> };

type BuilderPage = {
  name: string;
  slug: string;
  content: { blocks: Block[] };
  resolvedLayout?: {
    headerBlocks: Block[];
    footerBlocks: Block[];
  };
};

function RenderBlock({ block }: { block: Block }) {
  const style: any = {
    color: block.props.color,
    backgroundColor: block.props.backgroundColor,
    margin: block.props.margin,
    padding: block.props.padding,
    fontSize: block.props.fontSize,
    fontWeight: block.props.fontWeight,
    backgroundImage: block.props.backgroundImage
      ? `url(${block.props.backgroundImage})`
      : undefined,
    backgroundSize: 'cover',
    borderRadius: '10px'
  };

  if (block.type === 'text') {
    return <p style={style}>{block.props.text}</p>;
  }

  if (block.type === 'image') {
    return (
      <img
        src={block.props.src}
        alt=""
        style={{
          width: '100%',
          borderRadius: 10,
          margin: block.props.margin
        }}
      />
    );
  }

  if (block.type === 'button') {
    return (
      <a className="button" href={block.props.href} style={style}>
        {block.props.text}
      </a>
    );
  }

  if (block.type === 'video') {
    return (
      <iframe
        title={block.id}
        src={block.props.url}
        style={{
          width: '100%',
          minHeight: 280,
          border: 0,
          borderRadius: 10,
          margin: block.props.margin
        }}
      />
    );
  }

  if (block.type === 'columns') {
    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12
        }}
      >
        <div className="card">Column A</div>
        <div className="card">Column B</div>
      </div>
    );
  }

  if (block.type === 'logo') {
    return (
      <a
        href={block.props.href || '/'}
        style={{ ...style, textDecoration: 'none' }}
      >
        {block.props.text || 'Logo'}
      </a>
    );
  }

  if (block.type === 'link') {
    return (
      <a href={block.props.href || '#'} style={style}>
        {block.props.text || 'Link'}
      </a>
    );
  }

  if (block.type === 'nav') {
    const items = (block.props.items || '')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);

    return (
      <nav className="row" style={{ ...style, gap: block.props.gap || '12px' }}>
        {items.map((it) => {
          const [label, href] = it.split(':');
          return (
            <a key={it} href={href || '#'}>
              {label}
            </a>
          );
        })}
      </nav>
    );
  }

  return (
    <section style={style}>
      <p>{block.props.text || 'Section'}</p>
    </section>
  );
}

export default function DynamicSitePage() {
  const params = useParams();
  const slug = String(params?.slug || '');

  const [page, setPage] = useState<BuilderPage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;

    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('accessToken') || ''
        : '';

    fetch(`http://localhost:4000/api/v1/pages/${slug}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) throw new Error(d.error || 'Failed to load page');
        setPage(d);
      })
      .catch((e) =>
        setError(e.message || 'Failed to load page')
      );
  }, [slug]);

  if (error) {
    return (
      <main className="lms-shell">
        <p className="warning">{error}</p>
      </main>
    );
  }

  if (!page) {
    return (
      <main className="lms-shell">
        <div className="skeleton h24" />
      </main>
    );
  }

  return (
    <main className="lms-shell" style={{ maxWidth: 1100 }}>
      {(page.resolvedLayout?.headerBlocks || []).map((block) => (
        <RenderBlock key={`header-${block.id}`} block={block} />
      ))}

      <h1>{page.name}</h1>

      {(page.content?.blocks || []).map((block) => (
        <RenderBlock key={block.id} block={block} />
      ))}

      {(page.resolvedLayout?.footerBlocks || []).map((block) => (
        <RenderBlock key={`footer-${block.id}`} block={block} />
      ))}
    </main>
  );
}