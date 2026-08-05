import { useNavigate } from 'react-router-dom'

function buildIcebreaker(match) {
  const name = match.otherProfile?.nombre ?? ''
  const shared = match.sharedSports ?? []

  if (shared.length === 1) {
    return `¡Hola ${name}! Vi que también juegas ${shared[0].nombre} 🏆 ¿Jugamos esta semana?`
  }
  if (shared.length > 1) {
    return `¡Hola ${name}! Vi que compartimos varios deportes 🏆 ¿Cuál te gustaría jugar primero?`
  }
  return `¡Hola ${name}! ¿Cuándo te acomoda para jugar? 🏆`
}

export default function MatchModal({ match, onClose }) {
  const navigate = useNavigate()
  if (!match) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
      <div className="w-full max-w-sm rounded-2xl border border-lime bg-surface p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-lime text-2xl">🤝</div>
        <h2 className="mt-4 text-2xl font-bold text-text">Nuevo partner</h2>
        <p className="mt-2 text-sm text-text-secondary">Tú y {match.otherProfile?.nombre} quieren jugar juntos.</p>

        <div className="mt-6 flex justify-center gap-3">
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {match.myProfile?.foto_url && (
              <img src={match.myProfile.foto_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="h-16 w-16 overflow-hidden rounded-xl border border-border bg-surface-elevated">
            {match.otherProfile?.foto_url && (
              <img src={match.otherProfile.foto_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate(`/matches/${match.id}`, { state: { prefill: buildIcebreaker(match) } })}
            className="rounded-full bg-lime py-3 font-semibold text-bg active:scale-[0.98]"
          >
            Enviar mensaje
          </button>
          <button
            onClick={onClose}
            className="rounded-full border border-border bg-surface py-3 font-semibold text-text active:scale-[0.98]"
          >
            Seguir buscando
          </button>
        </div>
      </div>
    </div>
  )
}
