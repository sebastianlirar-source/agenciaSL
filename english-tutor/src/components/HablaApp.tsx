"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useProfile } from "@/hooks/useProfile";
import { LevelSelector } from "./LevelSelector";
import { ConversationTab } from "./ConversationTab";
import { ReadingTab } from "./ReadingTab";
import { ListeningTab } from "./ListeningTab";

type Tab = "convo" | "reading" | "listening";

export function HablaApp() {
  const [tab, setTab] = useState<Tab>("convo");
  const { profile, loading, setLevel, bumpStreak } = useProfile();
  const router = useRouter();
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="hb-shell">
        <div className="hb-root">
          <div style={{ padding: 40, color: "#b9c2d6" }}>Cargando…</div>
        </div>
      </div>
    );
  }

  const level = profile?.level ?? "B1";

  return (
    <div className="hb-shell">
      <div className="hb-root">
        <div className="hb-header">
          <div className="hb-header-top">
            <h1 className="hb-title">Habla</h1>
            <div className="hb-header-actions">
              <LevelSelector level={level} setLevel={setLevel} />
              <Link href="/progreso" className="hb-link-btn">
                📈 Mi progreso
              </Link>
              <button className="hb-link-btn" onClick={handleSignOut}>
                Salir
              </button>
            </div>
          </div>
          <p className="hb-tagline">
            Tu tutor conversacional de inglés — practica, lee y escucha con
            corrección en tiempo real, a tu nivel.
          </p>
        </div>

        <div className="hb-tabs">
          <button
            className={`hb-tab ${tab === "convo" ? "hb-tab-active" : ""}`}
            onClick={() => setTab("convo")}
          >
            💬 Conversación
          </button>
          <button
            className={`hb-tab ${tab === "reading" ? "hb-tab-active" : ""}`}
            onClick={() => setTab("reading")}
          >
            📖 Reading
          </button>
          <button
            className={`hb-tab ${tab === "listening" ? "hb-tab-active" : ""}`}
            onClick={() => setTab("listening")}
          >
            🎧 Listening
          </button>
        </div>

        {tab === "convo" && <ConversationTab level={level} />}
        {tab === "reading" && <ReadingTab level={level} onCompleted={bumpStreak} />}
        {tab === "listening" && <ListeningTab level={level} onCompleted={bumpStreak} />}
      </div>
    </div>
  );
}
