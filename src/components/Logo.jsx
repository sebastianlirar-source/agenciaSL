const ARC = 'M22.29,34 A32,32 0 0,1 77.71,34'

export default function Logo({ size = 56, withWordmark = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d={ARC} stroke="#2563eb" strokeWidth="14" strokeLinecap="round" />
        <path d={ARC} stroke="#ff6b35" strokeWidth="14" strokeLinecap="round" transform="rotate(120 50 50)" />
        <path d={ARC} stroke="#22c55e" strokeWidth="14" strokeLinecap="round" transform="rotate(240 50 50)" />
      </svg>
      {withWordmark && (
        <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Sport<span className="text-energy-orange">Match</span>
        </span>
      )}
    </div>
  )
}
