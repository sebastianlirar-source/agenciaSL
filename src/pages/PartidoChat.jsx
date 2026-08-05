import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ChatSkeleton } from '../components/Skeleton'
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
    <div className="mx-auto flex h-dvh max-w-md flex-col bg-bg">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <Link to={`/partidos/${partidoId}`} className="text-2xl text-text-secondary">
          ‹
        </Link>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-elevated text-xl">
          {SPORT_EMOJI[partido?.sports?.nombre] ?? '🏅'}
        </div>
        <p className="font-semibold text-text">
          {partido?.titulo || partido?.sports?.nombre || 'Chat del partido'}
        </p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <p className="mt-10 text-center text-sm font-semibold text-text-secondary">
            ¡Coordinen los detalles del partido acá! 🏆
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === user.id
              return (
                <div key={m.id} className={`max-w-[75%] ${mine ? 'ml-auto' : 'mr-auto'}`}>
                  {!mine && (
                    <p className="mb-0.5 px-1 text-[11px] font-semibold text-text-secondary">
                      {profilesById[m.sender_id]?.nombre ?? 'Jugador'}
                    </p>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 text-sm ${
                      mine
                        ? 'rounded-br-sm bg-lime text-bg'
                        : 'rounded-bl-sm border border-border bg-surface text-text'
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
        className="flex items-center gap-2 border-t border-border p-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Escribe un mensaje…"
          className="flex-1 rounded-full border border-border bg-surface px-4 py-2.5 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
        />
        <button
          type="submit"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-lime text-bg active:scale-90"
          aria-label="Enviar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V4l17 8-17 8Zm0-8h8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
