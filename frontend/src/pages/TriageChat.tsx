import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Send, ShieldAlert, User } from 'lucide-react';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';
import { PageHeader } from '../components/ui/PageHeader';
import { api } from '../services/apiService';
import { runTriage, type TriageResult } from '../services/geminiService';
import type { Specialty } from '../types';

type ChatEntry =
  | { kind: 'user'; text: string }
  | { kind: 'ai'; result: TriageResult };

const SUGGESTIONS = [
  'Me duele la cabeza desde hace 3 días y tengo fiebre',
  'Mi hijo de 4 años tiene mucha tos y vómito',
  'Sentí palpitaciones y dolor en el pecho',
  'Tengo acné persistente en la cara',
];

function urgencyLabel(urgency: TriageResult['urgency']): string {
  const map = { LOW: 'Urgencia baja', MEDIUM: 'Consultar pronto', HIGH: 'Atención prioritaria' };
  return map[urgency];
}

function urgencyClass(urgency: TriageResult['urgency']): string {
  const map = {
    LOW: 'bg-green-100 text-green-800',
    MEDIUM: 'bg-amber-100 text-amber-800',
    HIGH: 'bg-orange-100 text-orange-800',
  };
  return map[urgency];
}

export function TriageChat() {
  const [symptoms, setSymptoms] = useState('');
  const [history, setHistory] = useState<ChatEntry[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = symptoms.trim();
    if (!text || loading) {
      return;
    }

    setError(null);
    setLoading(true);
    setHistory((current) => [...current, { kind: 'user', text }]);
    setSymptoms('');

    try {
      if (specialties.length === 0) {
        const fetched = await api.getSpecialties();
        setSpecialties(fetched);
      }
      const names =
        specialties.length > 0
          ? specialties.map((specialty) => specialty.name)
          : ['Medicina General', 'Pediatría', 'Ginecología', 'Cardiología', 'Dermatología'];

      const result = await runTriage(text, names);
      setHistory((current) => [...current, { kind: 'ai', result }]);
    } catch {
      setError('No se pudo completar el triaje. Intenta nuevamente.');
      setHistory((current) => current.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const lastResult = [...history].reverse().find(
    (entry): entry is Extract<ChatEntry, { kind: 'ai' }> => entry.kind === 'ai',
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <PageHeader
        title="Triaje inteligente"
        description="Describe tus síntomas y recibe la especialidad recomendada con IA (Google Gemini)."
      />

      {error ? <div className="mt-4"><Alert tone="error">{error}</Alert></div> : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
        <article className="rounded-2xl border border-ink-200 bg-white shadow-sm">
          <header className="flex items-center gap-2 border-b border-ink-200 px-5 py-4">
            <Bot className="size-5 text-primary-600" aria-hidden="true" />
            <h2 className="font-semibold text-ink-900">Asistente de triaje</h2>
          </header>

          <div className="space-y-4 px-5 py-5">
            {history.length === 0 ? (
              <p className="text-sm text-ink-500">
                Cuéntame qué te sucede. Ejemplo: “Me duele la garganta y tengo tos
                desde ayer”.
              </p>
            ) : (
              history.map((entry, index) =>
                entry.kind === 'user' ? (
                  <div
                    key={index}
                    className="flex justify-end"
                  >
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary-600 px-4 py-3 text-white">
                      {entry.text}
                    </p>
                  </div>
                ) : (
                  <div key={index} className="flex gap-3">
                    <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                      <Bot className="size-4" aria-hidden="true" />
                    </span>
                    <article className="max-w-[85%] space-y-3 rounded-2xl rounded-bl-sm border border-ink-200 bg-ink-50 px-4 py-3">
                      {entry.result.emergency ? (
                        <Alert tone="error">
                          Se detectaron signos de urgencia. Acude de inmediato a
                          urgencias o llama a emergencias.
                        </Alert>
                      ) : null}
                      <p className="text-sm text-ink-700">{entry.result.reason}</p>
                      <dl className="grid gap-2 text-sm sm:grid-cols-2">
                        <div className="space-y-1">
                          <dt className="text-xs font-medium text-ink-400">Especialidad</dt>
                          <dd className="font-semibold text-primary-700">
                            {entry.result.specialty}
                          </dd>
                        </div>
                        <div className="space-y-1">
                          <dt className="text-xs font-medium text-ink-400">Prioridad</dt>
                          <dd>
                            <span
                              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${urgencyClass(entry.result.urgency)}`}
                            >
                              {urgencyLabel(entry.result.urgency)}
                            </span>
                          </dd>
                        </div>
                      </dl>
                      {!entry.result.emergency ? (
                        <Link
                          to={`/reservar?especialidad=${encodeURIComponent(entry.result.specialty)}`}
                          className="inline-flex items-center gap-1 text-sm font-semibold text-primary-700 hover:underline"
                        >
                          Reservar con {entry.result.specialty}
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </Link>
                      ) : null}
                    </article>
                  </div>
                ),
              )
            )}
            {loading ? (
              <div className="flex gap-3" role="status">
                <span className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                  <Bot className="size-4" aria-hidden="true" />
                </span>
                <span className="flex items-center gap-2 text-sm text-ink-500">
                  <span
                    aria-hidden="true"
                    className="size-4 animate-spin rounded-full border-2 border-primary-600/30 border-t-primary-600"
                  />
                  Analizando síntomas…
                </span>
              </div>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-ink-200 p-4">
            <label htmlFor="symptoms" className="sr-only">
              Describe tus síntomas
            </label>
            <div className="flex gap-2">
              <input
                id="symptoms"
                value={symptoms}
                onChange={(event) => setSymptoms(event.target.value)}
                placeholder="Escribe tus síntomas…"
                className="w-full rounded-lg border border-ink-300 bg-white px-3 py-2.5 text-ink-900 placeholder:text-ink-400 focus:border-primary-500"
                maxLength={500}
              />
              <Button type="submit" loading={loading} aria-label="Enviar síntomas">
                <Send className="size-4" aria-hidden="true" />
              </Button>
            </div>
          </form>
        </article>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-ink-200 bg-white p-5">
            <h2 className="flex items-center gap-2 font-semibold text-ink-900">
              <ShieldAlert className="size-5 text-primary-600" aria-hidden="true" />
              Sugerencias
            </h2>
            <ul className="mt-3 space-y-2">
              {SUGGESTIONS.map((suggestion) => (
                <li key={suggestion}>
                  <button
                    type="button"
                    onClick={() => setSymptoms(suggestion)}
                    className="w-full rounded-lg border border-ink-200 bg-ink-50 px-3 py-2 text-left text-sm text-ink-600 hover:border-primary-300 hover:bg-primary-50"
                  >
                    {suggestion}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-sky-200 bg-sky-50 p-5 text-sm text-sky-800">
            <h2 className="flex items-center gap-2 font-semibold">
              <User className="size-5" aria-hidden="true" />
              Importante
            </h2>
            <p className="mt-2">
              Este triaje es una orientación inicial y no reemplaza la valoración
              médica. Ante urgencias, acude al servicio de urgencias más cercano.
            </p>
            {lastResult ? (
              <div className="mt-4">
                <p className="text-xs font-medium text-sky-700">
                  Último resultado
                </p>
                <p className="mt-1 font-semibold">{lastResult.result.specialty}</p>
              </div>
            ) : null}
          </section>
        </aside>
      </div>
    </section>
  );
}