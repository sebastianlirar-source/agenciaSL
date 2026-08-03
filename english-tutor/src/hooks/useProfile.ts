"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/lib/types";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}
function yesterdayISO() {
  return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    let active = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (active) setLoading(false);
        return;
      }
      if (active) setUserId(user.id);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (active && !error && data) setProfile(data as Profile);
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Al cambiar el nivel: refleja el cambio de inmediato y lo persiste en Supabase.
  const setLevel = useCallback(
    async (level: string) => {
      if (!userId) return;
      setProfile((p) => (p ? { ...p, level } : p));
      await supabase.from("profiles").update({ level }).eq("id", userId);
    },
    [supabase, userId]
  );

  // Llamar tras completar una sesión de reading/listening: actualiza la racha
  // de días consecutivos usando last_practice_date.
  const bumpStreak = useCallback(async () => {
    if (!userId || !profile) return;
    const today = todayISO();
    if (profile.last_practice_date === today) return; // ya contaba hoy

    const newStreak =
      profile.last_practice_date === yesterdayISO() ? profile.streak_days + 1 : 1;

    const { error } = await supabase
      .from("profiles")
      .update({ streak_days: newStreak, last_practice_date: today })
      .eq("id", userId);

    if (!error) {
      setProfile((p) =>
        p ? { ...p, streak_days: newStreak, last_practice_date: today } : p
      );
    }
  }, [supabase, userId, profile]);

  return { profile, loading, userId, setLevel, bumpStreak };
}
