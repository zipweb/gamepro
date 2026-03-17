'use client';

import { ReactNode } from 'react';

export function Button({
  children,
  variant = 'secondary',
  loading,
  disabled,
  className = '',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger'; loading?: boolean }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${className}`.trim()}
    >
      {loading && <span className="btn-spinner" aria-hidden="true" />}
      <span>{children}</span>
    </button>
  );
}

export function LinkButton({ href, children, variant = 'secondary' }: { href: string; children: ReactNode; variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <a className={`button btn btn-${variant}`} href={href}>{children}</a>;
}

export function EmptyState({ title, description, ctaLabel, ctaHref }: { title: string; description: string; ctaLabel?: string; ctaHref?: string }) {
  return (
    <div className="card empty-state">
      <div className="empty-icon">◌</div>
      <h3>{title}</h3>
      <p className="muted">{description}</p>
      {ctaLabel && ctaHref && <LinkButton href={ctaHref} variant="primary">{ctaLabel}</LinkButton>}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card error-state">
      <h3>Something went wrong</h3>
      <p className="muted">{message}</p>
      {onRetry && <Button variant="danger" onClick={onRetry}>Retry</Button>}
    </div>
  );
}

export function SkeletonCards({ count = 3 }: { count?: number }) {
  return <div className="rail">{Array.from({ length: count }).map((_, i) => <div key={i} className="skeleton h84" />)}</div>;
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <nav className="breadcrumbs" aria-label="breadcrumbs">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {item.href ? <a href={item.href}>{item.label}</a> : <strong>{item.label}</strong>}
          {index < items.length - 1 && <span className="muted"> / </span>}
        </span>
      ))}
    </nav>
  );
}
