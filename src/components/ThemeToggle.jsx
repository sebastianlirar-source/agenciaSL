import { useTheme } from '../context/ThemeContext'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      className={`relative flex h-9 w-16 shrink-0 items-center rounded-full transition-colors ${
        isDark ? 'bg-electric' : 'bg-slate-300'
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-full bg-white shadow-md transition-transform ${
          isDark ? 'translate-x-8' : 'translate-x-1'
        }`}
      >
        {isDark ? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-electric">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-energy-orange">
            <circle cx="12" cy="12" r="5" />
            <path
              strokeLinecap="round"
              stroke="currentColor"
              strokeWidth="2"
              d="M12 1.5v2M12 20.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1.5 12h2M20.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"
            />
          </svg>
        )}
      </span>
    </button>
  )
}
