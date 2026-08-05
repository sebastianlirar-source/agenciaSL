import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { supabase } from '../lib/supabaseClient'
import { SPORT_EMOJI } from '../lib/constants'
import { LevelBars } from '../components/LevelBars'
import ProfileForm from '../components/ProfileForm'

export default function Profile() {
  const { signOut, user } = useAuth()
  const { profile, mySports, refreshProfile } = useProfile()
  const [editing, setEditing] = useState(false)
  const [stats, setStats] = useState({ partidos: 0, partners: 0 })

  useEffect(() => {
    if (!user) return
    let active = true

    async function loadStats() {
      const [{ count: partidosCount }, { data: matchRows }] = await Promise.all([
        supabase
          .from('partido_participantes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id),
        supabase.from('matches').select('id').or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`),
      ])
      if (active) {
        setStats({ partidos: partidosCount ?? 0, partners: matchRows?.length ?? 0 })
      }
    }

    loadStats()
    return () => {
      active = false
    }
  }, [user])

  async function handleSaved() {
    await refreshProfile()
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-text">Editar perfil</h1>
          <button onClick={() => setEditing(false)} className="text-sm font-semibold text-text-secondary">
            Cancelar
          </button>
        </div>
        <ProfileForm initialProfile={profile} initialSports={mySports} onSaved={handleSaved} />
      </div>
    )
  }

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col items-center">
        <div className="h-28 w-28 overflow-hidden rounded-2xl border border-border bg-surface-elevated">
          {profile?.foto_url ? (
            <img src={profile.foto_url} alt={profile.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl">🙂</span>
          )}
        </div>
        <h1 className="mt-4 text-xl font-bold text-text">
          {profile?.nombre}, {profile?.edad}
        </h1>
        <p className="text-sm text-text-secondary">📍 {profile?.comuna}</p>
        <p className="text-xs text-text-secondary">{user?.email}</p>
      </div>

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

      {profile?.bio && (
        <p className="mt-6 rounded-2xl border border-border bg-surface p-4 text-center text-sm text-text-secondary">
          {profile.bio}
        </p>
      )}

      {profile?.disponibilidad?.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-text-secondary">Disponibilidad</h2>
          <div className="flex flex-wrap gap-2">
            {profile.disponibilidad.map((d) => (
              <span key={d} className="rounded-full bg-surface-elevated px-3 py-1 text-xs font-semibold text-text">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-text-secondary">Deportes</h2>
        <div className="flex flex-col gap-2">
          {mySports.map((s) => (
            <div
              key={s.sport_id}
              className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{SPORT_EMOJI[s.sports?.nombre] ?? '🏅'}</span>
                <span className="text-sm font-semibold text-text">{s.sports?.nombre}</span>
              </div>
              <LevelBars nivel={s.nivel} />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        <button
          onClick={() => setEditing(true)}
          className="rounded-full bg-lime py-3 font-semibold text-bg transition active:scale-[0.98]"
        >
          Editar perfil
        </button>
        <button
          onClick={() => signOut()}
          className="rounded-full border border-border py-3 font-semibold text-text transition active:scale-[0.98]"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
