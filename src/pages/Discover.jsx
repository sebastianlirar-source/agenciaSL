import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import SwipeCard from '../components/SwipeCard'
import MatchModal from '../components/MatchModal'
import Logo from '../components/Logo'
import { DiscoverCardSkeleton } from '../components/Skeleton'

export default function Discover() {
  const { user } = useAuth()
  const { profile, mySports } = useProfile()

  const [sportsCatalog, setSportsCatalog] = useState([])
  const [filterSportId, setFilterSportId] = useState('')
  const [candidates, setCandidates] = useState([])
  const [index, setIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState(null)
  const [history, setHistory] = useState([])

  const myOwnSportIds = new Set(mySports.map((s) => s.sport_id))

  useEffect(() => {
    supabase
      .from('sports')
      .select('*')
      .order('id')
      .then(({ data }) => setSportsCatalog(data ?? []))
  }, [])

  const loadCandidates = useCallback(async () => {
    setLoading(true)
    setIndex(0)

    const { data: myLikes } = await supabase
      .from('likes')
      .select('to_user_id')
      .eq('from_user_id', user.id)
    const excluded = new Set([user.id, ...(myLikes ?? []).map((l) => l.to_user_id)])

    let eligibleIds = null
    if (filterSportId) {
      const { data: bySport } = await supabase
        .from('user_sports')
        .select('user_id')
        .eq('sport_id', filterSportId)
      eligibleIds = new Set((bySport ?? []).map((r) => r.user_id))
    }

    const { data: profiles } = await supabase.from('profiles').select('*')
    const base = (profiles ?? []).filter(
      (p) => !excluded.has(p.user_id) && (!eligibleIds || eligibleIds.has(p.user_id))
    )

    if (base.length === 0) {
      setCandidates([])
      setLoading(false)
      return
    }

    const ids = base.map((p) => p.user_id)
    const { data: sportsRows } = await supabase
      .from('user_sports')
      .select('user_id, nivel, sports ( id, nombre )')
      .in('user_id', ids)

    const sportsByUser = {}
    for (const row of sportsRows ?? []) {
      if (!row.sports) continue
      if (!sportsByUser[row.user_id]) sportsByUser[row.user_id] = []
      sportsByUser[row.user_id].push({ sport_id: row.sports.id, nombre: row.sports.nombre, nivel: row.nivel })
    }

    const myIds = new Set(mySports.map((s) => s.sport_id))

    const enriched = base
      .map((p) => ({ ...p, sports: sportsByUser[p.user_id] ?? [] }))
      .filter((p) => p.sports.length > 0)
      .map((p) => ({
        ...p,
        sharedCount: p.sports.filter((s) => myIds.has(s.sport_id)).length,
      }))
      .sort((a, b) => b.sharedCount - a.sharedCount)

    setCandidates(enriched)
    setLoading(false)
  }, [user.id, filterSportId, mySports])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  async function handleSwipe(direction, candidate) {
    let matched = false

    if (direction === 'right') {
      const { error } = await supabase
        .from('likes')
        .insert({ from_user_id: user.id, to_user_id: candidate.user_id })

      if (!error) {
        const [a, b] = [user.id, candidate.user_id].sort()
        const { data: matchRow } = await supabase
          .from('matches')
          .select('*')
          .eq('user1_id', a)
          .eq('user2_id', b)
          .maybeSingle()

        if (matchRow) {
          const sharedSports = candidate.sports.filter((s) => myOwnSportIds.has(s.sport_id))
          setMatch({ ...matchRow, myProfile: profile, otherProfile: candidate, sharedSports })
          matched = true
        }
      }
    }

    // Un match ya celebrado no se puede deshacer: solo apilamos pases y likes sin match.
    if (!matched) {
      setHistory((h) => [...h, { candidate, direction }])
    }
    setIndex((i) => i + 1)
  }

  async function handleUndo() {
    const last = history[history.length - 1]
    if (!last) return
    setHistory((h) => h.slice(0, -1))
    setIndex((i) => Math.max(0, i - 1))
    if (last.direction === 'right') {
      await supabase
        .from('likes')
        .delete()
        .eq('from_user_id', user.id)
        .eq('to_user_id', last.candidate.user_id)
    }
  }

  const visible = candidates.slice(index, index + 2)

  return (
    <div className="flex h-dvh flex-col pb-16">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Descubrir</h1>
        </div>
        <select
          value={filterSportId}
          onChange={(e) => setFilterSportId(e.target.value)}
          className="mt-2 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value="">Todos los deportes</option>
          {sportsCatalog.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre}
            </option>
          ))}
        </select>
      </header>

      <div className="relative mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-4">
        {loading ? (
          <div className="relative h-[70vh] w-full max-h-[560px]">
            <DiscoverCardSkeleton />
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 font-semibold text-slate-500 dark:text-slate-400">
              No hay más perfiles por ahora
            </p>
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                onClick={loadCandidates}
                className="rounded-full bg-electric px-5 py-2 text-sm font-bold text-white"
              >
                Volver a buscar
              </button>
              {filterSportId && (
                <button
                  onClick={() => setFilterSportId('')}
                  className="text-sm font-semibold text-slate-500 underline underline-offset-2 dark:text-slate-400"
                >
                  Ampliar búsqueda a todos los deportes
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative h-[70vh] w-full max-h-[560px]">
            {visible
              .map((candidate, i) => (
                <SwipeCard
                  key={candidate.user_id}
                  candidate={candidate}
                  isTop={i === 0}
                  sharedIds={myOwnSportIds}
                  onSwipe={(dir) => handleSwipe(dir, candidate)}
                />
              ))
              .reverse()}
          </div>
        )}
      </div>

      {!loading && visible.length > 0 && (
        <div className="flex items-center justify-center gap-6 pb-4">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-xl text-slate-400 shadow-md active:scale-90 disabled:opacity-30 dark:bg-slate-800"
            aria-label="Deshacer"
          >
            ↺
          </button>
          <button
            onClick={() => handleSwipe('left', visible[0])}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-3xl text-red-500 shadow-xl active:scale-90 dark:bg-slate-800"
            aria-label="Pasar"
          >
            ✕
          </button>
          <button
            onClick={() => handleSwipe('right', visible[0])}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-energy-green text-white shadow-xl active:scale-90"
            aria-label="Me interesa"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7" />
            </svg>
          </button>
        </div>
      )}

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  )
}
