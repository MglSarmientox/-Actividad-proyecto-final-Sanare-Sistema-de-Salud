import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
      {description ? <p className="text-ink-500">{description}</p> : null}
      {children}
    </header>
  );
}