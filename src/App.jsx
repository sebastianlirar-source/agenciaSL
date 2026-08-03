import { Navigate, Route, Routes } from 'react-router-dom'
import { ProfileProvider } from './context/ProfileContext'
import { useAuth } from './context/AuthContext'
import RequireAuth from './components/RequireAuth'
import RequireProfile from './components/RequireProfile'
import Layout from './components/Layout'
import Splash from './components/Splash'
import ConfigWarning from './components/ConfigWarning'
import Login from './pages/Login'
import Register from './pages/Register'
import ProfileSetup from './pages/ProfileSetup'
import Discover from './pages/Discover'
import Matches from './pages/Matches'
import Chat from './pages/Chat'
import Profile from './pages/Profile'
import Partidos from './pages/Partidos'
import PartidoNuevo from './pages/PartidoNuevo'
import PartidoDetalle from './pages/PartidoDetalle'
import PartidoChat from './pages/PartidoChat'

function PublicOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Splash />
  if (user) return <Navigate to="/" replace />
  return children
}

function App() {
  return (
    <ProfileProvider>
      <ConfigWarning />
      <Routes>
        <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
        <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />

        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<ProfileSetup />} />

          <Route element={<RequireProfile />}>
            <Route path="/matches/:matchId" element={<Chat />} />
            <Route path="/partidos/nuevo" element={<PartidoNuevo />} />
            <Route path="/partidos/:partidoId" element={<PartidoDetalle />} />
            <Route path="/partidos/:partidoId/chat" element={<PartidoChat />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Discover />} />
              <Route path="/matches" element={<Matches />} />
              <Route path="/partidos" element={<Partidos />} />
              <Route path="/profile" element={<Profile />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ProfileProvider>
  )
}

export default App
