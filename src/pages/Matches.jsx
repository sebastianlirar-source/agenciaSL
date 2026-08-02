import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Matches() {
  const { user } = useAuth()
  const [matches, setMatches] = useState([])
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

      if (!matchRows || matchRows.length === 0) {
        if (active) {
          setMatches([])
          setLoading(false)
        }
        return
      }

      const otherIds = matchRows.map((m) => (m.user1_id === user.id ? m.user2_id : m.user1_id))
      const { data: profiles } = await supabase.from('profiles').select('*').in('user_id', otherIds)
      const profileByUser = Object.fromEntries((profiles ?? []).map((p) => [p.user_id, p]))

      const merged = matchRows.map((m) => {
        const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id
        return { ...m, otherProfile: profileByUser[otherId] }
      })

      if (active) {
        setMatches(merged)
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
      <h1 className="mb-4 text-xl font-extrabold text-slate-900 dark:text-white">
        Mis matches <span className="text-energy-orange">🤝</span>
      </h1>

      {loading ? (
        <p className="text-sm font-semibold text-slate-400">Cargando…</p>
      ) : matches.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-5xl">💬</p>
          <p className="mt-3 font-semibold text-slate-500 dark:text-slate-400">
            Todavía no tienes matches. ¡Sigue explorando!
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {matches.map((m) => (
            <li key={m.id}>
              <Link
                to={`/matches/${m.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm transition active:scale-[0.99] dark:bg-slate-900"
              >
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  {m.otherProfile?.foto_url ? (
                    <img src={m.otherProfile.foto_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl">🙂</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-bold text-slate-900 dark:text-white">
                    {m.otherProfile?.nombre ?? 'Deportista'}
                  </p>
                  <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                    📍 {m.otherProfile?.comuna}
                  </p>
                </div>
                <span className="text-slate-300 dark:text-slate-600">›</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
