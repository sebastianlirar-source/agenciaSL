import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'
import AmbientBackground from './AmbientBackground'

export default function Layout() {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-md flex-col">
      <AmbientBackground />
      <main className="flex-1 pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
