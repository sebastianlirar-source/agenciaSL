import { useRef, useState } from 'react'
import { SPORT_EMOJI } from '../lib/constants'

const THRESHOLD = 100

export default function SwipeCard({ candidate, onSwipe, isTop }) {
  const cardRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [exitClass, setExitClass] = useState('')
  const startPos = useRef({ x: 0, y: 0 })

  function handlePointerDown(e) {
    if (!isTop) return
    setDragging(true)
    startPos.current = { x: e.clientX, y: e.clientY }
    cardRef.current?.setPointerCapture(e.pointerId)
  }

  function handlePointerMove(e) {
    if (!dragging) return
    setOffset({ x: e.clientX - startPos.current.x, y: e.clientY - startPos.current.y })
  }

  function finishSwipe(direction) {
    setExitClass(direction === 'right' ? 'animate-swipe-right' : 'animate-swipe-left')
    setTimeout(() => onSwipe(direction), 250)
  }

  function handlePointerUp() {
    if (!dragging) return
    setDragging(false)
    if (offset.x > THRESHOLD) {
      finishSwipe('right')
    } else if (offset.x < -THRESHOLD) {
      finishSwipe('left')
    } else {
      setOffset({ x: 0, y: 0 })
    }
  }

  const rotation = offset.x / 18
  const style =
    exitClass === ''
      ? {
          transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg)`,
          transition: dragging ? 'none' : 'transform 0.3s ease',
        }
      : undefined

  const sports = candidate.sports ?? []

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      style={style}
      className={`absolute inset-0 flex flex-col overflow-hidden rounded-3xl bg-white shadow-2xl select-none dark:bg-slate-900 ${exitClass} ${
        isTop ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none scale-[0.97]'
      }`}
    >
      <div className="relative h-2/3 w-full bg-gradient-to-br from-electric to-energy-green">
        {candidate.foto_url ? (
          <img src={candidate.foto_url} alt={candidate.nombre} className="h-full w-full object-cover" draggable={false} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-7xl">🙂</div>
        )}

        {offset.x > 30 && (
          <span className="absolute right-4 top-6 rotate-12 rounded-lg border-4 border-energy-green px-3 py-1 text-xl font-extrabold text-energy-green">
            ME INTERESA
          </span>
        )}
        {offset.x < -30 && (
          <span className="absolute left-4 top-6 -rotate-12 rounded-lg border-4 border-red-500 px-3 py-1 text-xl font-extrabold text-red-500">
            PASO
          </span>
        )}

        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
          <h2 className="text-2xl font-extrabold text-white">
            {candidate.nombre}, {candidate.edad}
          </h2>
          <p className="text-sm font-medium text-white/90">📍 {candidate.comuna}</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
        {candidate.bio && <p className="text-sm text-slate-600 dark:text-slate-300">{candidate.bio}</p>}

        <div className="flex flex-wrap gap-2">
          {sports.map((s) => (
            <span
              key={s.sport_id}
              className="flex items-center gap-1 rounded-full bg-energy-orange/10 px-3 py-1 text-xs font-semibold text-energy-orange-dark"
            >
              {SPORT_EMOJI[s.nombre] ?? '🏅'} {s.nombre} · {s.nivel}
            </span>
          ))}
        </div>

        {candidate.disponibilidad?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {candidate.disponibilidad.map((d) => (
              <span key={d} className="rounded-full bg-electric/10 px-3 py-1 text-xs font-semibold text-electric">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
