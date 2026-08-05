import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { NIVELES, SPORT_EMOJI } from '../lib/constants'
import { LevelBars } from '../components/LevelBars'
import MatchModal from '../components/MatchModal'
import Logo from '../components/Logo'
import { ListItemSkeleton } from '../components/Skeleton'

function computeMatch(candidate, mySportIds, myLevelBySport, myComuna) {
  const shared = candidate.sports.filter((s) => mySportIds.has(s.sport_id))
  if (shared.length === 0) return { percent: 0, shared: [] }

  const sportScore = Math.min(shared.length / Math.max(mySportIds.size, 1), 1) * 50
  const levelMatches = shared.filter((s) => myLevelBySport[s.sport_id] === s.nivel).length
  const levelScore = (levelMatches / shared.length) * 30
  const comunaScore = myComuna && candidate.comuna === myComuna ? 20 : 0

  return { percent: Math.round(sportScore + levelScore + comunaScore), shared }
}

export default function Discover() {
  const { user } = useAuth()
  const { profile, mySports } = useProfile()

  const [sportsCatalog, setSportsCatalog] = useState([])
  const [filterSportId, setFilterSportId] = useState('')
  const [filterNivel, setFilterNivel] = useState('')
  const [candidates, setCandidates] = useState([])
  const [sentIds, setSentIds] = useState(new Set())
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)
  const [match, setMatch] = useState(null)

  useEffect(() => {
    supabase
      .from('sports')
      .select('*')
      .order('id')
      .then(({ data }) => setSportsCatalog(data ?? []))
  }, [])

  const loadCandidates = useCallback(async () => {
    setLoading(true)

    const { data: myLikes } = await supabase
      .from('likes')
      .select('to_user_id')
      .eq('from_user_id', user.id)
    const sent = new Set((myLikes ?? []).map((l) => l.to_user_id))
    setSentIds(sent)

    const { data: myMatches } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    const matchedIds = new Set(
      (myMatches ?? []).map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id))
    )

    const excluded = new Set([user.id, ...matchedIds])

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
    const myLevelBySport = Object.fromEntries(mySports.map((s) => [s.sport_id, s.nivel]))

    let enriched = base
      .map((p) => ({ ...p, sports: sportsByUser[p.user_id] ?? [] }))
      .filter((p) => p.sports.length > 0)
      .map((p) => {
        const { percent, shared } = computeMatch(p, myIds, myLevelBySport, profile?.comuna)
        return { ...p, matchPercent: percent, sharedSports: shared }
      })
      .filter((p) => p.matchPercent > 0)

    if (filterNivel) {
      enriched = enriched.filter((p) => p.sharedSports.some((s) => s.nivel === filterNivel))
    }

    enriched.sort((a, b) => b.matchPercent - a.matchPercent)

    setCandidates(enriched)
    setLoading(false)
  }, [user.id, filterSportId, filterNivel, mySports, profile?.comuna])

  useEffect(() => {
    loadCandidates()
  }, [loadCandidates])

  useEffect(() => {
    supabase
      .from('partidos')
      .select('*, sports ( nombre )')
      .eq('estado', 'abierto')
      .order('fecha_hora', { ascending: true })
      .limit(10)
      .then(({ data }) => setPartidos(data ?? []))
  }, [])

  async function handleSendMessage(candidate) {
    if (sentIds.has(candidate.user_id)) return

    setSentIds((prev) => new Set(prev).add(candidate.user_id))

    const { error } = await supabase
      .from('likes')
      .insert({ from_user_id: user.id, to_user_id: candidate.user_id })

    if (error) {
      setSentIds((prev) => {
        const next = new Set(prev)
        next.delete(candidate.user_id)
        return next
      })
      return
    }

    const [a, b] = [user.id, candidate.user_id].sort()
    const { data: matchRow } = await supabase
      .from('matches')
      .select('*')
      .eq('user1_id', a)
      .eq('user2_id', b)
      .maybeSingle()

    if (matchRow) {
      setMatch({ ...matchRow, myProfile: profile, otherProfile: candidate, sharedSports: candidate.sharedSports })
    }
  }

  return (
    <div className="flex min-h-dvh flex-col pb-4">
      <header className="sticky top-0 z-10 border-b border-border bg-bg px-4 py-3">
        <div className="mb-3 flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-lg font-bold text-text">Buscar</h1>
        </div>

        <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterSportId('')}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
              filterSportId === '' ? 'bg-lime text-bg' : 'border border-border bg-surface text-text-secondary'
            }`}
          >
            Todos los deportes
          </button>
          {sportsCatalog.map((s) => (
            <button
              key={s.id}
              onClick={() => setFilterSportId(String(s.id))}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                filterSportId === String(s.id)
                  ? 'bg-lime text-bg'
                  : 'border border-border bg-surface text-text-secondary'
              }`}
            >
              {SPORT_EMOJI[s.nombre] ?? '🏅'} {s.nombre}
            </button>
          ))}
        </div>

        <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterNivel('')}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
              filterNivel === '' ? 'bg-surface-elevated text-text' : 'text-text-secondary'
            }`}
          >
            Todos los niveles
          </button>
          {NIVELES.map((n) => (
            <button
              key={n}
              onClick={() => setFilterNivel(n)}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold ${
                filterNivel === n ? 'bg-surface-elevated text-text' : 'text-text-secondary'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 px-4 py-4">
        {loading ? (
          <div className="flex flex-col gap-2">
            <ListItemSkeleton />
            <ListItemSkeleton />
            <ListItemSkeleton />
          </div>
        ) : candidates.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-5xl">🔍</p>
            <p className="mt-3 font-semibold text-text-secondary">No hay jugadores compatibles por ahora</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {candidates.map((c) => {
              const sent = sentIds.has(c.user_id)
              return (
                <div
                  key={c.user_id}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
                    {c.foto_url ? (
                      <img src={c.foto_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-xl">🙂</span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-text">
                        {c.nombre}, {c.edad}
                      </p>
                      <span className="shrink-0 text-xs font-bold text-lime">{c.matchPercent}%</span>
                    </div>
                    <p className="truncate text-xs text-text-secondary">📍 {c.comuna}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {c.sharedSports.slice(0, 2).map((s) => (
                        <span key={s.sport_id} className="flex items-center gap-1.5 text-xs text-text-secondary">
                          {SPORT_EMOJI[s.nombre] ?? '🏅'} {s.nombre}
                          <LevelBars nivel={s.nivel} />
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleSendMessage(c)}
                    disabled={sent}
                    aria-label="Enviar mensaje"
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      sent ? 'bg-surface-elevated text-text-secondary' : 'bg-lime text-bg'
                    }`}
                  >
                    {sent ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m5 12.5 4.5 4.5L19 7" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H8l-4 4V5Z" />
                      </svg>
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        )}

        {partidos.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-text-secondary">Partidos abiertos</h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
              {partidos.map((p) => (
                <Link
                  key={p.id}
                  to={`/partidos/${p.id}`}
                  className="w-40 shrink-0 rounded-2xl border border-border bg-surface p-3"
                >
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-surface-elevated text-lg">
                    {SPORT_EMOJI[p.sports?.nombre] ?? '🏅'}
                  </div>
                  <p className="truncate text-sm font-semibold text-text">{p.titulo || p.sports?.nombre}</p>
                  <p className="mt-0.5 truncate text-xs text-text-secondary">
                    {new Date(p.fecha_hora).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })} ·{' '}
                    {p.comuna}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <MatchModal match={match} onClose={() => setMatch(null)} />
    </div>
  )
}
