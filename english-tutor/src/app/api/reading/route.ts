import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL, extractText, parseClaudeJSON } from "@/lib/anthropic";
import { levelInfo } from "@/lib/constants";
import type { ReadingData } from "@/lib/types";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const level: string = body?.level;
  const topic: string = body?.topic;

  if (!level || !topic) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const info = levelInfo(level);
  const system = `You create short English reading passages for ${info.code} Spanish-speaking learners (${info.hint}). Passage length and complexity must match ${info.code}: about 60-80 words with very simple present-tense sentences for A1, up to 180-220 words with rich, idiomatic language for C2. Respond ONLY with strict JSON, no markdown fences, matching exactly:
{"title":"short title","passage":"150-word passage in English","questions":[{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"short explanation in Spanish"}]}
Include exactly 3 multiple-choice comprehension questions.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      system,
      messages: [{ role: "user", content: `Topic: ${topic}` }],
    });

    const parsed = parseClaudeJSON<ReadingData>(extractText(response.content));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/reading]", err);
    return NextResponse.json(
      { error: "No se pudo generar la lectura" },
      { status: 502 }
    );
  }
}
