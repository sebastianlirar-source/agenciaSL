import { useNavigate } from 'react-router-dom'
import { useProfile } from '../context/ProfileContext'
import ProfileForm from '../components/ProfileForm'

export default function ProfileSetup() {
  const navigate = useNavigate()
  const { refreshProfile } = useProfile()

  async function handleSaved() {
    await refreshProfile()
    navigate('/')
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-electric/10 to-transparent px-6 py-10 dark:from-electric/20">
      <div className="mx-auto max-w-md">
        <div className="mb-6 text-center">
          <div className="mb-2 text-4xl">⚡</div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Completa tu perfil</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Así otros deportistas podrán encontrarte
          </p>
        </div>
        <ProfileForm onSaved={handleSaved} submitLabel="Empezar a jugar 🏆" />
      </div>
    </div>
  )
}
