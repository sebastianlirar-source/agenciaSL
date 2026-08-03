import "server-only";
import Anthropic from "@anthropic-ai/sdk";

// Solo se importa desde src/app/api/**/route.ts. `server-only` hace que
// Next.js falle el build si algún componente cliente llega a importarlo.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const CLAUDE_MODEL = "claude-opus-5";

export function extractText(content: Anthropic.ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

export function parseClaudeJSON<T>(raw: string): T {
  const clean = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  const slice = start >= 0 && end >= 0 ? clean.slice(start, end + 1) : clean;
  return JSON.parse(slice) as T;
}
