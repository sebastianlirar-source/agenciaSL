"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TOPICS } from "@/lib/constants";
import type { ReadingData } from "@/lib/types";
import { Spinner } from "./Spinner";

export function ReadingTab({
  level,
  onCompleted,
}: {
  level: string;
  onCompleted: () => void;
}) {
  const [topic, setTopic] = useState<string>(TOPICS[0]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ReadingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState(false);
  const supabase = createClient();

  const generate = async () => {
    setLoading(true);
    setData(null);
    setError(null);
    setAnswers({});
    setChecked(false);
    try {
      const res = await fetch("/api/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ level, topic }),
      });
      if (!res.ok) throw new Error("reading api error");
      setData(await res.json());
    } catch {
      setError("No se pudo generar la lectura. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
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
        activity_type: "reading",
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
          {data ? "Nueva lectura" : "Generar lectura"}
        </button>
      </div>

      {loading && <Spinner label="Escribiendo tu lectura…" />}
      {error && <div className="hb-form-error">{error}</div>}

      {data && (
        <div className="hb-paper">
          <h3 className="hb-paper-title">{data.title}</h3>
          <p className="hb-paper-text">{data.passage}</p>
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
