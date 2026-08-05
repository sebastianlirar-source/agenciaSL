export default function Logo({ size = 40, withWordmark = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-[28%] bg-lime"
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 24 24" fill="none">
          <rect x="2" y="14" width="5" height="8" rx="1.5" fill="#0D0D0D" />
          <rect x="9.5" y="8" width="5" height="14" rx="1.5" fill="#0D0D0D" />
          <rect x="17" y="2" width="5" height="20" rx="1.5" fill="#0D0D0D" />
        </svg>
      </div>
      {withWordmark && (
        <span className="text-xl font-bold tracking-tight text-text">
          Sport<span className="text-lime">Match</span>
        </span>
      )}
    </div>
  )
}
