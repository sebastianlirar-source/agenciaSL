export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="absolute -top-20 -left-16 h-72 w-72 rounded-full bg-electric/25 blur-3xl dark:bg-electric/15" />
      <div className="absolute top-1/4 -right-20 h-80 w-80 rounded-full bg-energy-orange/20 blur-3xl dark:bg-energy-orange/10" />
      <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-energy-green/20 blur-3xl dark:bg-energy-green/10" />
    </div>
  )
}
