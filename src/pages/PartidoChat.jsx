import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ChatSkeleton } from '../components/Skeleton'
import AmbientBackground from '../components/AmbientBackground'
import { SPORT_EMOJI } from '../lib/constants'

export default function PartidoChat() {
  const { partidoId } = useParams()
  const { user } = useAuth()
  const [partido, setPartido] = useState(null)
  const [messages, setMessages] = useState([])
  const [profilesById, setProfilesById] = useState({})
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)

      const { data: partidoData } = await supabase
        .from('partidos')
        .select('*, sports ( nombre )')
        .eq('id', partidoId)
        .maybeSingle()
      if (active) setPartido(partidoData ?? null)

      const { data: participantesData } = await supabase
        .from('partido_participantes')
        .select('user_id')
        .eq('partido_id', partidoId)
      const ids = (participantesData ?? []).map((r) => r.user_id)
      if (ids.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('user_id, nombre')
          .in('user_id', ids)
        if (active) {
          setProfilesById(Object.fromEntries((profilesData ?? []).map((p) => [p.user_id, p])))
        }
      }

      const { data: msgs } = await supabase
        .from('partido_mensajes')
        .select('*')
        .eq('partido_id', partidoId)
        .order('created_at', { ascending: true })

      if (active) {
        setMessages(msgs ?? [])
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [partidoId])

  useEffect(() => {
    const channel = supabase
      .channel(`partido_messages:${partidoId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'partido_mensajes', filter: `partido_id=eq.${partidoId}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partidoId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    const content = text.trim()
    if (!content) return
    setText('')

    const optimistic = {
      id: `local-${Date.now()}`,
      partido_id: partidoId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase.from('partido_mensajes').insert({
      partido_id: partidoId,
      sender_id: user.id,
      content,
    })

    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      setText(content)
    }
  }

  return (
    <div className="relative mx-auto flex h-dvh max-w-md flex-col">
      <AmbientBackground />
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
        <Link to={`/partidos/${partidoId}`} className="text-2xl text-slate-500 dark:text-slate-400">
          ‹
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-electric/10 text-xl">
          {SPORT_EMOJI[partido?.sports?.nombre] ?? '🏅'}
        </div>
        <p className="font-bold text-slate-900 dark:text-white">
          {partido?.titulo || partido?.sports?.nombre || 'Chat del partido'}
        </p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-sm font-semibold text-slate-400">
            ¡Coordinen los detalles del partido acá! 🏆
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === user.id
              return (
                <div key={m.id} className={`max-w-[75%] ${mine ? 'ml-auto' : 'mr-auto'}`}>
                  {!mine && (
                    <p className="mb-0.5 px-1 text-[11px] font-semibold text-slate-400">
                      {profilesById[m.sender_id]?.nombre ?? 'Jugador'}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? 'rounded-br-sm bg-electric text-white'
                        : 'rounded-bl-sm bg-white text-slate-800 shadow dark:bg-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 border-t border-slate-200 bg-white/90 p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-electric dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-energy-orange text-white shadow-md active:scale-90"
          aria-label="Enviar"
        >
          ➤
        </button>
      </form>
    </div>
  )
}
