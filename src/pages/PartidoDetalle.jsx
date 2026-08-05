import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { SPORT_EMOJI } from '../lib/constants'

export default function PartidoDetalle() {
  const { partidoId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [partido, setPartido] = useState(null)
  const [participantes, setParticipantes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)

    const { data: partidoData } = await supabase
      .from('partidos')
      .select('*, sports ( nombre )')
      .eq('id', partidoId)
      .maybeSingle()
    setPartido(partidoData ?? null)

    const { data: participantesData } = await supabase
      .from('partido_participantes')
      .select('user_id, joined_at')
      .eq('partido_id', partidoId)
      .order('joined_at', { ascending: true })

    const rows = participantesData ?? []
    if (rows.length > 0) {
      const ids = rows.map((r) => r.user_id)
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, nombre, foto_url')
        .in('user_id', ids)
      const profileByUser = Object.fromEntries((profilesData ?? []).map((p) => [p.user_id, p]))
      setParticipantes(rows.map((r) => ({ ...r, profile: profileByUser[r.user_id] })))
    } else {
      setParticipantes([])
    }

    setLoading(false)
  }, [partidoId])

  useEffect(() => {
    load()
  }, [load])

  const yaMeUni = participantes.some((p) => p.user_id === user.id)
  const esCreador = partido?.creador_id === user.id
  const lleno = participantes.length >= (partido?.cupos_totales ?? 0)

  async function handleJoin() {
    setError('')
    setWorking(true)
    const { error: rpcError } = await supabase.rpc('join_partido', { p_partido_id: partidoId })
    setWorking(false)
    if (rpcError) {
      setError(rpcError.message)
      return
    }
    await load()
  }

  async function handleLeave() {
    setWorking(true)
    await supabase.from('partido_participantes').delete().eq('partido_id', partidoId).eq('user_id', user.id)
    setWorking(false)
    await load()
  }

  async function handleCancel() {
    setWorking(true)
    await supabase.from('partidos').update({ estado: 'cancelado' }).eq('id', partidoId)
    setWorking(false)
    await load()
  }

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-bg">
        <p className="font-semibold text-text-secondary">Cargando…</p>
      </div>
    )
  }

  if (!partido) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
        <p className="text-5xl">🔍</p>
        <p className="font-semibold text-text-secondary">Este partido ya no existe.</p>
        <Link to="/partidos" className="font-semibold text-lime">
          Volver a partidos
        </Link>
      </div>
    )
  }

  const fecha = new Date(partido.fecha_hora).toLocaleString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="min-h-dvh bg-bg">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-bg px-4 py-3">
        <button onClick={() => navigate(-1)} className="text-2xl text-text-secondary">
          ‹
        </button>
        <p className="font-semibold text-text">Detalle del partido</p>
      </header>

      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-surface-elevated text-3xl">
            {SPORT_EMOJI[partido.sports?.nombre] ?? '🏅'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-text">{partido.titulo || partido.sports?.nombre}</h1>
            {partido.estado === 'cancelado' && (
              <span className="text-sm font-semibold text-burnt">Cancelado</span>
            )}
            {partido.estado === 'completo' && (
              <span className="text-sm font-semibold text-burnt">Completo</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 rounded-2xl border border-border bg-surface p-4 text-sm">
          <p className="text-text">📅 {fecha}</p>
          <p className="text-text">
            📍 {partido.lugar}, {partido.comuna}
          </p>
          <p className="text-text">🎯 Nivel: {partido.nivel}</p>
          <p className="text-text">
            🧍 {participantes.length}/{partido.cupos_totales} cupos
          </p>
        </div>

        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">Jugadores anotados</h2>
          <div className="flex flex-col gap-2">
            {participantes.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2"
              >
                <div className="h-9 w-9 overflow-hidden rounded-lg bg-surface-elevated">
                  {p.profile?.foto_url ? (
                    <img src={p.profile.foto_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-sm">🙂</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-text">{p.profile?.nombre ?? 'Jugador'}</p>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="mt-4 text-sm font-medium text-burnt">{error}</p>}

        <div className="mt-6 flex flex-col gap-3">
          {yaMeUni ? (
            <>
              <Link
                to={`/partidos/${partidoId}/chat`}
                className="rounded-full bg-lime py-3 text-center font-semibold text-bg active:scale-[0.98]"
              >
                💬 Chat del partido
              </Link>
              {!esCreador && (
                <button
                  onClick={handleLeave}
                  disabled={working}
                  className="rounded-full border border-border py-3 font-semibold text-text active:scale-[0.98]"
                >
                  Salir del partido
                </button>
              )}
              {esCreador && partido.estado !== 'cancelado' && (
                <button
                  onClick={handleCancel}
                  disabled={working}
                  className="rounded-full border border-burnt py-3 font-semibold text-burnt active:scale-[0.98]"
                >
                  Cancelar partido
                </button>
              )}
            </>
          ) : (
            partido.estado === 'abierto' &&
            !lleno && (
              <button
                onClick={handleJoin}
                disabled={working}
                className="rounded-full bg-lime py-3 font-semibold text-bg active:scale-[0.98] disabled:opacity-60"
              >
                {working ? 'Uniendo…' : 'Unirme al partido'}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
}
