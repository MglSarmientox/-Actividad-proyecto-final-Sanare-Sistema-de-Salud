const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as
  | string
  | undefined;

const GEMINI_MODEL =
  (import.meta.env.VITE_GEMINI_MODEL as string | undefined) ??
  'gemini-2.0-flash';

export type TriageResult = {
  specialty: string;
  confidence: number;
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  emergency: boolean;
};

const FALLBACK_RULES: Array<[RegExp, string]> = [
  [/\b(acn[eé]|erupci[oó]n|sarpullido|mancha|piel|quemadura)\b/i, 'Dermatología'],
  [/\b(coraz[oó]n|card[ií]aco|palpitaci[oó]n|presi[oó]n|tensi[oó]n|dolor de pecho|pecho)\b/i, 'Cardiología'],
  [/\b(embarazo|maternidad|menstrual|menstruaci[oó]n|regla|vaginal|ginecolog[aá])/i, 'Ginecología'],
  [/\b(ni[nñ]o|ni[nñ]a|beb[eé]|infantil|v[oó]mito en ni[nñ]o)\b/i, 'Pediatría'],
  [/\b(garganta|resfriado|gripa|tos|fiebre|dolor de cabeza|migra[nñ]a|est[oó]mago|diarrea)\b/i, 'Medicina General'],
];

const EMERGENCY_KEYWORDS = [
  'dificultad para respirar',
  'no respira',
  'pecho intenso',
  'pierde el conocimiento',
  'convulsion',
  'sangrado abundante',
  'accidente',
  'trauma',
  'quemadura grave',
  'intoxicacion',
];

function fallbackTriage(symptoms: string): TriageResult {
  const normalized = symptoms.toLowerCase();

  let specialty = 'Medicina General';
  for (const [pattern, match] of FALLBACK_RULES) {
    if (pattern.test(normalized)) {
      specialty = match;
      break;
    }
  }

  const emergency = EMERGENCY_KEYWORDS.some((keyword) =>
    normalized.includes(keyword),
  );

  return {
    specialty,
    confidence: emergency ? 0.95 : 0.6,
    reason: emergency
      ? 'Los síntomas indican una posible urgencia médica. Busca atención de urgencias.'
      : `Recomendación basada en los síntomas descritos. Se sugiere consulta con ${specialty}.`,
    urgency: emergency ? 'HIGH' : 'MEDIUM',
    emergency,
  };
}

function parseGeminiResponse(text: string): TriageResult | null {
  try {
    const json = text
      .trim()
      .replace(/^```(?:json)?\s*/, '')
      .replace(/```\s*$/, '');
    const parsed = JSON.parse(json) as Partial<TriageResult> & {
      specialty?: string;
    };
    if (!parsed.specialty) {
      return null;
    }
    return {
      specialty: parsed.specialty,
      confidence: Number(parsed.confidence ?? 0.8),
      reason: parsed.reason ?? '',
      urgency: parsed.urgency ?? 'MEDIUM',
      emergency: Boolean(parsed.emergency),
    };
  } catch {
    return null;
  }
}

export async function runTriage(
  symptoms: string,
  availableSpecialties: string[],
): Promise<TriageResult> {
  const specialtyList = availableSpecialties.join(', ');

  if (!GEMINI_API_KEY) {
    return fallbackTriage(symptoms);
  }

  const prompt = `
Eres un asistente de triaje médico de un centro de salud público de Colombia.
Analiza los síntomas del paciente y responde ÚNICAMENTE con JSON válido, sin markdown.

Reglas:
- Elige UNA especialidad de esta lista exacta: ${specialtyList}
- Si hay signos de urgencia vital (dificultad para respirar, trauma grave, convulsiones, sangrado abundante), marca emergency: true y no recomiendes una cita normal sino urgencias.
- urgency: LOW, MEDIUM o HIGH.
- confidence: número entre 0 y 1.
- reason: explicación breve en español para el paciente (máximo 2 frases).

Síntomas del paciente: "${symptoms}"

JSON:
{
  "specialty": "Nombre exacto de la especialidad",
  "confidence": 0.0,
  "reason": "explicación",
  "urgency": "MEDIUM",
  "emergency": false
}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.2 },
      }),
    });

    if (!response.ok) {
      return fallbackTriage(symptoms);
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return fallbackTriage(symptoms);
    }

    const result = parseGeminiResponse(text);
    if (!result) {
      return fallbackTriage(symptoms);
    }
    if (!availableSpecialties.includes(result.specialty)) {
      result.specialty = 'Medicina General';
    }
    return result;
  } catch {
    return fallbackTriage(symptoms);
  }
}