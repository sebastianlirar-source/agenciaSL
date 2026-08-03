"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Correction } from "@/lib/types";
import { Spinner } from "./Spinner";

interface Msg {
  role: "user" | "assistant";
  reply: string;
  learnerCorrections?: Correction[];
}

const GREETINGS: Record<string, string> = {
  A1: "Hi! My name is Habla. What is your name?",
  A2: "Hi! I'm Habla. What did you do yesterday?",
  B1: "Hi! I'm your conversation partner today. Tell me — how has your week been so far?",
  B2: "Hey there! I'm curious — what's something that's been on your mind lately?",
  C1: "Hi! Let's dive right in — what's a topic you have strong opinions about?",
  C2: "Hello! I'd love to hear your take on something nuanced — what's a debate you find genuinely interesting?",
};

export function ConversationTab({ level }: { level: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    { role: "assistant", reply: GREETINGS[level] || GREETINGS.B1 },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  const supportsSpeech =
    typeof window !== "undefined" &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    setMessages([{ role: "assistant", reply: GREETINGS[level] || GREETINGS.B1 }]);
  }, [level]);

  const startMic = () => {
    if (!supportsSpeech) return;
    try {
      const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const rec = new SR();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e: any) => {
        const transcript = e.results[0][0].transcript;
        setInput((prev) => (prev ? prev + " " + transcript : transcript));
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recognitionRef.current = rec;
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  };
  const stopMic = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const logCorrections = async (corrections: Correction[]) => {
    if (corrections.length === 0) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("corrections_log").insert(
      corrections.map((c) => ({
        user_id: user.id,
        wrong_text: c.wrong,
        correct_text: c.right,
        tip: c.tip,
      }))
    );
  };

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const nextHistory: Msg[] = [...messages, { role: "user", reply: text }];
    setMessages(nextHistory);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level,
          messages: nextHistory.map((m) => ({ role: m.role, content: m.reply })),
        }),
      });
      if (!res.ok) throw new Error("chat api error");
      const parsed = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          reply: parsed.reply,
          learnerCorrections: parsed.corrections || [],
        },
      ]);
      logCorrections(parsed.corrections || []);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          reply: "Sorry, I had trouble responding — could you try again?",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hb-panel hb-convo">
      <div className="hb-convo-scroll" ref={scrollRef}>
        {messages.map((m, i) => {
          const nextMsg = messages[i + 1];
          const corrections = m.role === "user" ? nextMsg?.learnerCorrections : null;
          return (
            <div key={i} className={`hb-row hb-row-${m.role}`}>
              <div className={`hb-bubble hb-bubble-${m.role}`}>{m.reply}</div>
              {corrections && corrections.length > 0 && (
                <div className="hb-margin-note">
                  {corrections.map((c, j) => (
                    <div key={j} className="hb-note-card">
                      <div className="hb-note-line hb-note-wrong">{c.wrong}</div>
                      <div className="hb-note-arrow">→</div>
                      <div className="hb-note-line hb-note-right">{c.right}</div>
                      <div className="hb-note-tip">{c.tip}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        {loading && <Spinner label="Habla está pensando…" />}
      </div>
      <div className="hb-input-row">
        <button
          className={`hb-mic ${listening ? "hb-mic-active" : ""}`}
          onClick={listening ? stopMic : startMic}
          disabled={!supportsSpeech}
          title={supportsSpeech ? "Hablar" : "Micrófono no disponible en este navegador"}
        >
          🎤
        </button>
        <input
          className="hb-text-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Escribe (o habla) tu respuesta en inglés…"
        />
        <button className="hb-send" onClick={send} disabled={loading || !input.trim()}>
          Enviar
        </button>
      </div>
    </div>
  );
}
