import { useNavigate } from 'react-router-dom'

export default function MatchModal({ match, onClose }) {
  const navigate = useNavigate()
  if (!match) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-6">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-br from-energy-orange to-electric p-8 text-center text-white shadow-2xl">
        <p className="text-5xl">🎉</p>
        <h2 className="mt-3 text-3xl font-extrabold">¡Es un match!</h2>
        <p className="mt-2 text-white/90">Tú y {match.otherProfile?.nombre} quieren jugar juntos.</p>

        <div className="mt-6 flex justify-center -space-x-4">
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-200">
            {match.myProfile?.foto_url && (
              <img src={match.myProfile.foto_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
          <div className="h-20 w-20 overflow-hidden rounded-full border-4 border-white bg-slate-200">
            {match.otherProfile?.foto_url && (
              <img src={match.otherProfile.foto_url} alt="" className="h-full w-full object-cover" />
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <button
            onClick={() => navigate(`/matches/${match.id}`)}
            className="rounded-xl bg-white py-3 font-bold text-energy-orange-dark shadow-lg active:scale-[0.98]"
          >
            Enviar mensaje
          </button>
          <button onClick={onClose} className="rounded-xl border border-white/60 py-3 font-bold text-white active:scale-[0.98]">
            Seguir explorando
          </button>
        </div>
      </div>
    </div>
  )
}
