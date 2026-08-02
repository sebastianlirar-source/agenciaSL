import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { SPORT_EMOJI } from '../lib/constants'
import ProfileForm from '../components/ProfileForm'

export default function Profile() {
  const { signOut, user } = useAuth()
  const { profile, mySports, refreshProfile } = useProfile()
  const [editing, setEditing] = useState(false)

  async function handleSaved() {
    await refreshProfile()
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="px-6 py-8">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">Editar perfil</h1>
          <button
            onClick={() => setEditing(false)}
            className="text-sm font-semibold text-slate-400"
          >
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
        <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-lg dark:border-slate-800 dark:bg-slate-700">
          {profile?.foto_url ? (
            <img src={profile.foto_url} alt={profile.nombre} className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl">🙂</span>
          )}
        </div>
        <h1 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">
          {profile?.nombre}, {profile?.edad}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">📍 {profile?.comuna}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{user?.email}</p>
      </div>

      {profile?.bio && (
        <p className="mt-6 rounded-2xl bg-slate-100 p-4 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {profile.bio}
        </p>
      )}

      {profile?.disponibilidad?.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Disponibilidad</h2>
          <div className="flex flex-wrap gap-2">
            {profile.disponibilidad.map((d) => (
              <span key={d} className="rounded-full bg-electric/10 px-3 py-1 text-xs font-semibold text-electric">
                {d}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">Deportes</h2>
        <div className="flex flex-wrap gap-2">
          {mySports.map((s) => (
            <span
              key={s.sport_id}
              className="flex items-center gap-1 rounded-full bg-energy-orange/10 px-3 py-1.5 text-xs font-semibold text-energy-orange-dark"
            >
              {SPORT_EMOJI[s.sports?.nombre] ?? '🏅'} {s.sports?.nombre} · {s.nivel}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          onClick={() => setEditing(true)}
          className="rounded-xl bg-electric py-3 font-bold text-white shadow-lg shadow-electric/30 transition active:scale-[0.98]"
        >
          Editar perfil
        </button>
        <button
          onClick={() => signOut()}
          className="rounded-xl border border-slate-200 py-3 font-bold text-slate-600 transition active:scale-[0.98] dark:border-slate-700 dark:text-slate-300"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
