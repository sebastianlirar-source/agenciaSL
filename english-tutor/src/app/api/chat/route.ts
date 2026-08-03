import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_MODEL, extractText, parseClaudeJSON } from "@/lib/anthropic";
import { levelInfo } from "@/lib/constants";
import type { ChatApiMessage, ChatApiResponse } from "@/lib/types";

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
  const messages: ChatApiMessage[] = body?.messages;

  if (!level || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
  }

  const info = levelInfo(level);
  const system = `You are Habla, a warm, encouraging English conversation tutor for a ${info.code} (${info.label.split(" · ")[1]}) Spanish-speaking learner. Style guide for this level: ${info.hint}. Keep the conversation going naturally with a follow-up question. Keep replies to 2-4 sentences, strictly using ${info.code}-appropriate vocabulary and sentence complexity — simpler for A1/A2, richer and more idiomatic for C1/C2. Gently correct meaningful grammar/vocabulary mistakes in the learner's LAST message only (skip trivial typos), calibrated to what matters at ${info.code} (e.g. basic verb conjugation at A1-A2, nuance and idiom at C1-C2). Respond ONLY with strict JSON, no markdown fences, no preamble, matching exactly this shape:
{"reply": "your English reply continuing the conversation", "corrections": [{"wrong": "phrase learner wrote", "right": "corrected phrase", "tip": "very short tip in Spanish, under 12 words"}]}
If there are no meaningful errors, "corrections" must be an empty array.`;

  try {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const parsed = parseClaudeJSON<ChatApiResponse>(extractText(response.content));
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("[/api/chat]", err);
    return NextResponse.json(
      { error: "No se pudo generar la respuesta" },
      { status: 502 }
    );
  }
}
