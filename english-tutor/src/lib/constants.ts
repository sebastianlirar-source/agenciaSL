export const TOPICS = [
  "viajes",
  "trabajo",
  "vida diaria",
  "tecnología",
  "cultura pop",
  "comida",
  "medio ambiente",
  "relaciones",
  "noticias",
  "deportes",
] as const;

export type Topic = (typeof TOPICS)[number];

export interface LevelInfo {
  code: string;
  label: string;
  hint: string;
}

export const LEVELS: LevelInfo[] = [
  { code: "A1", label: "A1 · Principiante", hint: "Frases muy simples, presente, vocabulario básico" },
  { code: "A2", label: "A2 · Básico", hint: "Frases cortas, rutinas, pasado simple" },
  { code: "B1", label: "B1 · Intermedio", hint: "Conversación cotidiana, opiniones simples" },
  { code: "B2", label: "B2 · Intermedio alto", hint: "Ideas complejas, matices, fluidez" },
  { code: "C1", label: "C1 · Avanzado", hint: "Vocabulario amplio, expresiones idiomáticas" },
  { code: "C2", label: "C2 · Casi nativo", hint: "Precisión y naturalidad total" },
];

export function levelInfo(code: string): LevelInfo {
  return LEVELS.find((l) => l.code === code) ?? LEVELS[2];
}
