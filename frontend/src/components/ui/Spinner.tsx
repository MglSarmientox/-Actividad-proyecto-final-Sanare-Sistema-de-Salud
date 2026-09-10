export function Spinner({ label = 'Cargando…' }: { label?: string }) {
  return (
    <p className="flex items-center gap-3 text-ink-500" role="status">
      <span
        aria-hidden="true"
        className="size-5 animate-spin rounded-full border-2 border-primary-600/30 border-t-primary-600"
      />
      {label}
    </p>
  );
}