"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TOPICS } from "@/lib/constants";
import type { ListeningData } from "@/lib/types";
import { Spinner } from "./Spinner";

export function ListeningTab({
  level,
  onCompleted,
}: {
  level: string;
  onCompleted: () => void;
}) {
  const [topic, setTopic] = useState<string>(TOPICS[1]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ListeningData | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const supabase = createClient();

  const generate = async () => {
    setLoading(true);
    setData(null);
    setAnswers({});
    setChecked(false);
    setShowScript(false);
    try {
      const res = await fetch("/api/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic }),
      });
      if (!res.ok) throw new Error("listening api error");
      setData(await res.json());
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const play = () => {
    if (!data) return;
    window.speechSynthesis.cancel();
    const voices = window.speechSynthesis.getVoices();
    const enVoices = voices.filter((v) => v.lang.startsWith("en"));
    setSpeaking(true);
    let idx = 0;
    const speakNext = () => {
      if (idx >= data.lines.length) {
        setSpeaking(false);
        return;
      }
      const line = data.lines[idx];
      const utter = new SpeechSynthesisUtterance(line.text);
      utter.lang = "en-US";
      utter.rate = rate;
      utter.pitch = line.speaker === "A" ? 1 : 1.25;
      if (enVoices.length) {
        utter.voice = enVoices[line.speaker === "A" ? 0 : enVoices.length - 1];
      }
      utter.onend = () => {
        idx += 1;
        speakNext();
      };
      window.speechSynthesis.speak(utter);
    };
    speakNext();
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const score =
    data?.questions.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0),
      0
    ) ?? 0;

  const check = async () => {
    setChecked(true);
    if (!data) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("activity_log").insert({
        user_id: user.id,
        activity_type: "listening",
        level,
        topic,
        score,
        max_score: data.questions.length,
      });
    }
    onCompleted();
  };

  return (
    <div className="hb-panel">
      <div className="hb-controls">
        <select className="hb-select" value={topic} onChange={(e) => setTopic(e.target.value)}>
          {TOPICS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="hb-primary-btn" onClick={generate} disabled={loading}>
          {data ? "Nuevo audio" : "Generar audio"}
        </button>
      </div>

      {loading && <Spinner label="Preparando el audio…" />}

      {data && (
        <div className="hb-paper">
          <h3 className="hb-paper-title">{data.title}</h3>
          <div className="hb-audio-controls">
            <button className="hb-primary-btn" onClick={speaking ? stop : play}>
              {speaking ? "⏹ Detener" : "▶ Escuchar"}
            </button>
            <label className="hb-rate-label">
              Velocidad
              <select
                className="hb-select hb-select-small"
                value={rate}
                onChange={(e) => setRate(Number(e.target.value))}
              >
                <option value={0.75}>0.75x</option>
                <option value={1}>1x</option>
                <option value={1.25}>1.25x</option>
              </select>
            </label>
            <button className="hb-ghost-btn" onClick={() => setShowScript((s) => !s)}>
              {showScript ? "Ocultar transcripción" : "Ver transcripción"}
            </button>
          </div>

          {showScript && (
            <div className="hb-transcript">
              {data.lines.map((l, i) => (
                <p key={i}>
                  <strong>{l.speaker}:</strong> {l.text}
                </p>
              ))}
            </div>
          )}

          <div className="hb-quiz">
            {data.questions.map((q, i) => (
              <div key={i} className="hb-question">
                <p className="hb-question-text">
                  {i + 1}. {q.question}
                </p>
                <div className="hb-options">
                  {q.options.map((opt, j) => {
                    const isSelected = answers[i] === j;
                    const isCorrect = checked && j === q.correct;
                    const isWrong = checked && isSelected && j !== q.correct;
                    return (
                      <button
                        key={j}
                        className={`hb-option ${isSelected ? "hb-option-selected" : ""} ${
                          isCorrect ? "hb-option-correct" : ""
                        } ${isWrong ? "hb-option-wrong" : ""}`}
                        onClick={() =>
                          !checked && setAnswers((a) => ({ ...a, [i]: j }))
                        }
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {checked && <p className="hb-explanation">{q.explanation}</p>}
              </div>
            ))}
          </div>
          {!checked ? (
            <button
              className="hb-primary-btn"
              onClick={check}
              disabled={Object.keys(answers).length < data.questions.length}
            >
              Corregir respuestas
            </button>
          ) : (
            <p className="hb-score">
              Puntaje: {score} / {data.questions.length}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
