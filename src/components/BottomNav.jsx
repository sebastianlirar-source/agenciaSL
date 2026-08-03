import { NavLink } from 'react-router-dom'

const ITEMS = [
  {
    to: '/',
    label: 'Descubrir',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2 15 9l7 1-5 5 1.5 7L12 18l-6.5 4L7 15l-5-5 7-1z" />
      </svg>
    ),
  },
  {
    to: '/partidos',
    label: 'Partidos',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <circle cx="8" cy="8" r="3" />
        <circle cx="17" cy="9" r="2.5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 20c0-3.5 2.7-6 5.5-6s5.5 2.5 5.5 6M14.5 20c0-2.6 1.8-5 4-5.4" />
      </svg>
    ),
  },
  {
    to: '/matches',
    label: 'Matches',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: (active) => (
      <svg viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-energy-orange'
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {icon(isActive)}
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
