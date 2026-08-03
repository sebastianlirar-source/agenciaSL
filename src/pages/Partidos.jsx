import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { SPORT_EMOJI } from '../lib/constants'
import Logo from '../components/Logo'
import { MatchListItemSkeleton } from '../components/Skeleton'

function formatFecha(iso) {
  return new Date(iso).toLocaleString('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Partidos() {
  const { user } = useAuth()
  const { mySports } = useProfile()

  const [sportsCatalog, setSportsCatalog] = useState([])
  const [filterSportId, setFilterSportId] = useState('')
  const [partidos, setPartidos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('sports')
      .select('*')
      .order('id')
      .then(({ data }) => setSportsCatalog(data ?? []))
  }, [])

  const loadPartidos = useCallback(async () => {
    setLoading(true)

    let query = supabase
      .from('partidos')
      .select('*, sports ( nombre )')
      .neq('estado', 'cancelado')
      .order('fecha_hora', { ascending: true })

    if (filterSportId) query = query.eq('sport_id', filterSportId)

    const { data: partidosData } = await query
    const rows = partidosData ?? []

    if (rows.length === 0) {
      setPartidos([])
      setLoading(false)
      return
    }

    const ids = rows.map((p) => p.id)
    const { data: participantesData } = await supabase
      .from('partido_participantes')
      .select('partido_id, user_id')
      .in('partido_id', ids)

    const countByPartido = {}
    const joinedSet = new Set()
    for (const row of participantesData ?? []) {
      countByPartido[row.partido_id] = (countByPartido[row.partido_id] ?? 0) + 1
      if (row.user_id === user.id) joinedSet.add(row.partido_id)
    }

    const mySportIds = new Set(mySports.map((s) => s.sport_id))

    const enriched = rows
      .map((p) => ({
        ...p,
        ocupados: countByPartido[p.id] ?? 0,
        yaMeUni: joinedSet.has(p.id),
        esMiDeporte: mySportIds.has(p.sport_id),
      }))
      .sort((a, b) => {
        if (a.esMiDeporte !== b.esMiDeporte) return a.esMiDeporte ? -1 : 1
        return new Date(a.fecha_hora) - new Date(b.fecha_hora)
      })

    setPartidos(enriched)
    setLoading(false)
  }, [filterSportId, user.id, mySports])

  useEffect(() => {
    loadPartidos()
  }, [loadPartidos])

  return (
    <div className="px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size={28} />
          <h1 className="text-lg font-extrabold text-slate-900 dark:text-white">Partidos</h1>
        </div>
        <Link
          to="/partidos/nuevo"
          className="rounded-full bg-energy-orange px-4 py-2 text-sm font-bold text-white shadow-md active:scale-95"
        >
          + Crear
        </Link>
      </div>

      <select
        value={filterSportId}
        onChange={(e) => setFilterSportId(e.target.value)}
        className="mb-4 w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
      >
        <option value="">Todos los deportes</option>
        {sportsCatalog.map((s) => (
          <option key={s.id} value={s.id}>
            {s.nombre}
          </option>
        ))}
      </select>

      {loading ? (
        <div className="flex flex-col gap-2">
          <MatchListItemSkeleton />
          <MatchListItemSkeleton />
          <MatchListItemSkeleton />
        </div>
      ) : partidos.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-5xl">🏟️</p>
          <p className="mt-3 font-semibold text-slate-500 dark:text-slate-400">
            No hay partidos abiertos por ahora
          </p>
          <Link
            to="/partidos/nuevo"
            className="mt-4 inline-block rounded-full bg-electric px-5 py-2 text-sm font-bold text-white"
          >
            Crear el primero
          </Link>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {partidos.map((p) => (
            <li key={p.id}>
              <Link
                to={`/partidos/${p.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition active:scale-[0.99] dark:bg-slate-900"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-electric/10 text-2xl">
                  {SPORT_EMOJI[p.sports?.nombre] ?? '🏅'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {p.titulo || p.sports?.nombre}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    {formatFecha(p.fecha_hora)} · 📍 {p.comuna}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      p.estado === 'completo'
                        ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                        : 'bg-energy-green/15 text-energy-green-dark'
                    }`}
                  >
                    {p.ocupados}/{p.cupos_totales}
                  </span>
                  {p.yaMeUni && <span className="text-[11px] font-semibold text-electric">Anotado ✓</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
