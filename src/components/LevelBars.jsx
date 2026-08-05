import { NIVELES } from '../lib/constants'

export function LevelBars({ nivel }) {
  const activeCount = NIVELES.indexOf(nivel) + 1
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-[5px] w-4 rounded-[2px] ${i < activeCount ? 'bg-lime' : 'bg-surface-elevated'}`}
        />
      ))}
    </div>
  )
}

export function LevelPicker({ value, onChange }) {
  const activeCount = NIVELES.indexOf(value) + 1
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => onChange(NIVELES[i])}
            aria-label={NIVELES[i]}
            className={`h-[5px] w-4 rounded-[2px] transition ${i < activeCount ? 'bg-lime' : 'bg-surface-elevated'}`}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-text-secondary">{value}</span>
    </div>
  )
}
