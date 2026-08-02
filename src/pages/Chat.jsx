import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { ChatSkeleton } from '../components/Skeleton'
import AmbientBackground from '../components/AmbientBackground'

const QUICK_REPLIES = ['¿Jugamos esta semana? 🏆', '¿Qué día te acomoda?', '¿Dónde jugamos? 📍']

export default function Chat() {
  const { matchId } = useParams()
  const location = useLocation()
  const { user } = useAuth()
  const [otherProfile, setOtherProfile] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (location.state?.prefill) setText(location.state.prefill)
  }, [location.state])

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)

      const { data: matchRow } = await supabase.from('matches').select('*').eq('id', matchId).single()
      if (matchRow) {
        const otherId = matchRow.user1_id === user.id ? matchRow.user2_id : matchRow.user1_id
        const { data: p } = await supabase.from('profiles').select('*').eq('user_id', otherId).maybeSingle()
        if (active) setOtherProfile(p)
      }

      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
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
  }, [matchId, user.id])

  useEffect(() => {
    const channel = supabase
      .channel(`messages:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${matchId}` },
        (payload) => {
          setMessages((prev) => (prev.some((m) => m.id === payload.new.id) ? prev : [...prev, payload.new]))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

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
      match_id: matchId,
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimistic])

    const { error } = await supabase.from('messages').insert({
      match_id: matchId,
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
        <Link to="/matches" className="text-2xl text-slate-500 dark:text-slate-400">
          ‹
        </Link>
        <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
          {otherProfile?.foto_url ? (
            <img src={otherProfile.foto_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center">🙂</span>
          )}
        </div>
        <p className="font-bold text-slate-900 dark:text-white">{otherProfile?.nombre ?? 'Chat'}</p>
      </header>

      <div className="no-scrollbar flex-1 overflow-y-auto px-4 py-4">
        {loading ? (
          <ChatSkeleton />
        ) : messages.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3">
            <p className="text-center text-sm font-semibold text-slate-400">
              ¡Hagan match para coordinar su próximo partido! 🏅
            </p>
            <div className="flex flex-wrap justify-center gap-2 px-4">
              {QUICK_REPLIES.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => setText(q)}
                  className="rounded-full border border-electric/30 bg-electric/5 px-3 py-1.5 text-xs font-semibold text-electric dark:bg-electric/10"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {messages.map((m) => {
              const mine = m.sender_id === user.id
              return (
                <div
                  key={m.id}
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? 'ml-auto rounded-br-sm bg-electric text-white'
                      : 'mr-auto rounded-bl-sm bg-white text-slate-800 shadow dark:bg-slate-800 dark:text-slate-100'
                  }`}
                >
                  {m.content}
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
