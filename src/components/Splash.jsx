import Logo from './Logo'

export default function Splash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-bg">
      <div className="flex flex-col items-center gap-3">
        <Logo size={56} className="animate-pulse" />
        <p className="text-sm font-medium text-text-secondary">Cargando SportMatch…</p>
      </div>
    </div>
  )
}
