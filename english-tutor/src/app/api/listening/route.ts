import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL, extractText, parseClaudeJSON } from "@/lib/anthropic";
import { levelInfo } from "@/lib/constants";
import type { ListeningData } from "@/lib/types";

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
  const system = `You create short English listening dialogues for ${info.code} Spanish-speaking learners (${info.hint}), between two speakers "A" and "B". Length and complexity must match ${info.code}: about 50-70 words total with very simple, short sentences for A1, up to 150-180 words with natural, idiomatic speech for C2. Respond ONLY with strict JSON, no markdown fences, matching exactly:
{"title":"short title","lines":[{"speaker":"A","text":"..."}],"questions":[{"question":"...","options":["a","b","c","d"],"correct":0,"explanation":"short explanation in Spanish"}]}
Include exactly 3 multiple-choice comprehension questions. Keep each line natural and conversational.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1536,
      system,
      messages: [{ role: "user", content: `Topic: ${topic}` }],
    });

    const parsed = parseClaudeJSON<ListeningData>(extractText(response.content));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/listening]", err);
    return NextResponse.json(
      { error: "No se pudo generar el audio" },
      { status: 502 }
    );
  }
}
