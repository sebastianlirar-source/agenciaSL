import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { SPORT_EMOJI } from '../lib/constants'
import { ListItemSkeleton } from '../components/Skeleton'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
  const [proximoPartido, setProximoPartido] = useState(null)
  const [stats, setStats] = useState({ partidos: 0, partners: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      const { data: matchRows } = await supabase
        .from('matches')
        .select('*')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      const rows = matchRows ?? []

      if (rows.length > 0) {
        const otherIds = rows.map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id))
        const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', otherIds)
        const profileByUser = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

        const merged = rows.map((m) => {
          const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id
          return { ...m, otherProfile: profileByUser[otherId] }
        })

        if (active) setMatches(merged)
      } else if (active) {
        setMatches([])
      }

      const { data: participaciones } = await supabase
        .from('partido_participantes')
        .select('partido_id, partidos ( *, sports ( nombre ) )')
        .eq('user_id', user.id)

      const partidosParticipando = (participaciones ?? [])
        .map((p) => p.partidos)
        .filter((p) => p && p.estado !== 'cancelado')

      const proximo = partidosParticipando
        .filter((p) => new Date(p.fecha_hora) >= new Date())
        .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora))[0]

      if (active) {
        setProximoPartido(proximo ?? null)
        setStats({ partidos: partidosParticipando.length, partners: rows.length })
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [user.id])

  return (
    <div className="px-4 py-6">
      <h1 className="mb-4 text-lg font-bold text-text">Partners</h1>

      {proximoPartido && (
        <Link
          to={`/partidos/${proximoPartido.id}`}
          className="mb-4 flex items-center gap-3 rounded-2xl border border-lime bg-surface p-4"
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-lime text-xl">
            {SPORT_EMOJI[proximoPartido.sports?.nombre] ?? '🏅'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold text-lime">Próximo partido</p>
            <p className="truncate font-semibold text-text">{proximoPartido.titulo || proximoPartido.sports?.nombre}</p>
            <p className="truncate text-xs text-text-secondary">
              {new Date(proximoPartido.fecha_hora).toLocaleString('es-CL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}{' '}
              · {proximoPartido.comuna}
            </p>
          </div>
        </Link>
      )}

      {loading ? (
        <div className="flex flex-col gap-2">
          <ListItemSkeleton />
          <ListItemSkeleton />
          <ListItemSkeleton />
        </div>
      ) : matches.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-5xl">💬</p>
          <p className="mt-3 font-semibold text-text-secondary">Todavía no tienes partners. ¡Sigue buscando!</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                to={`/matches/${m.id}`}
                className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3 transition active:scale-[0.99]"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-surface-elevated">
                  {m.otherProfile?.foto_url ? (
                    <img src={m.otherProfile.foto_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl">🙂</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-text">{m.otherProfile?.nombre ?? 'Deportista'}</p>
                  <p className="truncate text-xs text-text-secondary">📍 {m.otherProfile?.comuna}</p>
                </div>
                <span className="text-text-secondary">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!loading && (stats.partidos > 0 || stats.partners > 0) && (
        <div className="mt-6 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-xl font-bold text-lime">{stats.partidos}</p>
            <p className="text-xs text-text-secondary">Partidos coordinados</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-xl font-bold text-lime">{stats.partners}</p>
            <p className="text-xs text-text-secondary">Partners</p>
          </div>
        </div>
      )}
    </div>
  )
}
