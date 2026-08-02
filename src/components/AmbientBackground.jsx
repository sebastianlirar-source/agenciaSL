export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#f5f6fa] dark:bg-[#090c14]">
      {/* directional light wash — one composed source, not scattered blobs */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(140% 70% at 10% -15%, rgba(37,99,235,0.20), transparent 55%),' +
            'radial-gradient(100% 60% at 105% 0%, rgba(255,107,53,0.16), transparent 60%),' +
            'radial-gradient(90% 50% at 50% 120%, rgba(34,197,94,0.12), transparent 60%)',
        }}
      />

      {/* kinetic track lanes, anchored bottom-left like a curved running track */}
      <svg
        className="absolute -bottom-28 -left-28 h-[440px] w-[440px] opacity-40 dark:opacity-25"
        viewBox="0 0 400 400"
        fill="none"
      >
        <circle cx="0" cy="400" r="110" stroke="#2563eb" strokeWidth="2" />
        <circle cx="0" cy="400" r="165" stroke="#ff6b35" strokeWidth="2" strokeDasharray="1 13" />
        <circle cx="0" cy="400" r="220" stroke="#22c55e" strokeWidth="1.5" />
        <circle cx="0" cy="400" r="275" stroke="#2563eb" strokeWidth="1.5" strokeDasharray="1 11" />
        <circle cx="0" cy="400" r="330" stroke="#ff6b35" strokeWidth="1" opacity="0.6" />
      </svg>

      {/* speed lines, top-right — abstract motion cue, not a logo */}
      <svg
        className="absolute -top-6 -right-6 h-56 w-56 opacity-50 dark:opacity-30"
        viewBox="0 0 200 200"
        fill="none"
      >
        <g stroke="#ff6b35" strokeLinecap="round">
          <line x1="205" y1="4" x2="88" y2="128" strokeWidth="3.5" />
          <line x1="205" y1="26" x2="118" y2="122" strokeWidth="3.5" opacity="0.72" />
          <line x1="205" y1="48" x2="148" y2="116" strokeWidth="3.5" opacity="0.48" />
          <line x1="205" y1="70" x2="176" y2="112" strokeWidth="3.5" opacity="0.28" />
        </g>
      </svg>

      {/* scoreboard dot-grid, faint structural texture across the middle field */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.35] dark:opacity-[0.18]" preserveAspectRatio="none">
        <pattern id="sm-dots" width="26" height="26" patternUnits="userSpaceOnUse">
          <circle cx="1.2" cy="1.2" r="1.2" fill="currentColor" className="text-slate-400 dark:text-slate-600" />
        </pattern>
        <rect
          width="100%"
          height="100%"
          fill="url(#sm-dots)"
          style={{ maskImage: 'radial-gradient(75% 60% at 50% 35%, black, transparent)' }}
        />
      </svg>

      {/* film grain, keeps the wash tactile instead of flat */}
      <svg className="absolute inset-0 h-full w-full mix-blend-overlay opacity-[0.05] dark:opacity-[0.09]">
        <filter id="sm-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
        </filter>
        <rect width="100%" height="100%" filter="url(#sm-grain)" />
      </svg>
    </div>
  )
}
