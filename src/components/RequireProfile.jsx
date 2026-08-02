import { Navigate, Outlet } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import Splash from './Splash'

export default function RequireProfile() {
  const { loadingProfile, profileComplete } = useProfile()

  if (loadingProfile) return <Splash />
  if (!profileComplete) return <Navigate to="/onboarding" replace />

  return <Outlet />
}
