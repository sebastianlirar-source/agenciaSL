import { NavLink } from 'react-router-dom'

const ITEMS = [
  {
    to: '/',
    label: 'Buscar',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <circle cx="11" cy="11" r="7" />
        <path strokeLinecap="round" d="m21 21-4.3-4.3" />
      </svg>
    ),
  },
  {
    to: '/partidos',
    label: 'Partidos',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path strokeLinecap="round" d="M3 10h18M8 3v4M16 3v4" />
        <circle cx="15.5" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    to: '/matches',
    label: 'Partners',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h16v11H8l-4 4V5Z" />
      </svg>
    ),
  },
  {
    to: '/profile',
    label: 'Perfil',
    icon: () => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
        <circle cx="12" cy="8" r="4" />
        <path strokeLinecap="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {ITEMS.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                isActive ? 'text-lime' : 'text-text-secondary'
              }`
            }
          >
            {icon()}
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
