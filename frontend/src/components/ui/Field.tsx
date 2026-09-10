import type { ReactNode } from 'react';

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label htmlFor={htmlFor} className="block space-y-1.5">
      <span className="block text-sm font-medium text-ink-700">{label}</span>
      {children}
      {hint ? <span className="block text-xs text-ink-400">{hint}</span> : null}
    </label>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>,
) {
  return (
    <input
      {...props}
      className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-900 placeholder:text-ink-400 focus:border-primary-500 ${props.className ?? ''}`}
    />
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>,
) {
  return (
    <select
      {...props}
      className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-900 focus:border-primary-500 ${props.className ?? ''}`}
    />
  );
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>,
) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-ink-300 bg-white px-3 py-2 text-ink-900 placeholder:text-ink-400 focus:border-primary-500 ${props.className ?? ''}`}
    />
  );
}