import { CircleAlert, CircleCheck, Info } from 'lucide-react';
import type { ReactNode } from 'react';

type Tone = 'error' | 'success' | 'info';

const toneStyles: Record<Tone, string> = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-green-200 bg-green-50 text-green-800',
  info: 'border-sky-200 bg-sky-50 text-sky-800',
};

const toneIcons: Record<Tone, typeof Info> = {
  error: CircleAlert,
  success: CircleCheck,
  info: Info,
};

export function Alert({
  tone = 'info',
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  const Icon = toneIcons[tone];
  return (
    <p
      role="alert"
      className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${toneStyles[tone]}`}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}