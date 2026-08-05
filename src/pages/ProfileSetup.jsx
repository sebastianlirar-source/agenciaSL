import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import ProfileForm from '../components/ProfileForm'
import Logo from '../components/Logo'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { refreshProfile } = useProfile()

  async function handleSaved() {
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-bg px-6 py-10">
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <Logo size={48} className="mb-2" />
          <h1 className="text-2xl font-bold text-text">Completa tu perfil</h1>
          <p className="mt-1 text-sm text-text-secondary">Así otros deportistas podrán encontrarte</p>
        </div>
        <ProfileForm onSaved={handleSaved} submitLabel="Empezar a jugar 🏆" />
      </div>
    </div>
  )
}
