"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";

interface CommonError {
  wrong: string;
  right: string;
  tip: string;
  count: number;
}

export function ProgressView() {
  const { profile, loading: profileLoading } = useProfile();
  const [errors, setErrors] = useState<CommonError[]>([]);
  const [loadingErrors, setLoadingErrors] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoadingErrors(false);
        return;
      }

      const { data, error } = await supabase
        .from("corrections_log")
        .select("wrong_text, correct_text, tip")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (active && !error && data) {
        const counts = new Map<string, CommonError>();
        for (const row of data) {
          const key = `${row.wrong_text}→${row.correct_text}`;
          const existing = counts.get(key);
          if (existing) {
            existing.count += 1;
          } else {
            counts.set(key, {
              wrong: row.wrong_text,
              right: row.correct_text,
              tip: row.tip ?? "",
              count: 1,
            });
          }
        }
        const sorted = Array.from(counts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        setErrors(sorted);
      }
      if (active) setLoadingErrors(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loading = profileLoading || loadingErrors;

  return (
    <div className="hb-shell">
      <div className="hb-root">
        <div className="hb-header">
          <div className="hb-header-top">
            <Link href="/app" className="hb-title-link">
              <h1 className="hb-title">Habla</h1>
            </Link>
            <div className="hb-header-actions">
              <Link href="/app" className="hb-link-btn">
                ← Volver a practicar
              </Link>
            </div>
          </div>
          <p className="hb-tagline">Mi progreso</p>
        </div>

        <div className="hb-panel">
          {loading ? (
            <div style={{ color: "#b9c2d6" }}>Cargando…</div>
          ) : (
            <>
              <div className="hb-progress-grid">
                <div className="hb-stat-card">
                  <p className="hb-stat-value">{profile?.streak_days ?? 0} 🔥</p>
                  <p className="hb-stat-label">
                    {(profile?.streak_days ?? 0) === 1
                      ? "día seguido practicando"
                      : "días seguidos practicando"}
                  </p>
                </div>
                <div className="hb-stat-card">
                  <p className="hb-stat-value">{errors.reduce((a, e) => a + e.count, 0)}</p>
                  <p className="hb-stat-label">correcciones registradas</p>
                </div>
              </div>

              <div className="hb-paper">
                <h3 className="hb-paper-title">Errores más comunes</h3>
                {errors.length === 0 ? (
                  <p className="hb-empty-state">
                    Todavía no hay correcciones registradas. ¡Practica en la pestaña de
                    Conversación y aquí verás en qué te equivocas más seguido!
                  </p>
                ) : (
                  <div className="hb-errors-list">
                    {errors.map((e, i) => (
                      <div key={i} className="hb-note-card" style={{ transform: "none" }}>
                        <div className="hb-note-line hb-note-wrong">{e.wrong}</div>
                        <div className="hb-note-arrow">→</div>
                        <div className="hb-note-line hb-note-right">{e.right}</div>
                        {e.tip && <div className="hb-note-tip">{e.tip}</div>}
                        <span className="hb-error-count" style={{ marginTop: 6, display: "inline-block" }}>
                          ×{e.count}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
