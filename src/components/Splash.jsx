import Logo from './Logo'

export default function Splash() {
  return (
    <div className="flex h-dvh w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-3">
        <Logo size={56} className="animate-spin [animation-duration:1.4s]" />
        <p className="font-semibold text-slate-500 dark:text-slate-400">Cargando SportMatch…</p>
      </div>
    </div>
  )
}
