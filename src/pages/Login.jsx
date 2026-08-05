import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { AppleIcon, GoogleIcon } from '../components/SocialIcons'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [socialNote, setSocialNote] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) {
      setError(error.message === 'Invalid login credentials' ? 'Email o contraseña incorrectos.' : error.message)
      return
    }
    navigate('/')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-between bg-bg px-6 py-10">
      <div />
      <div className="w-full max-w-sm">
        <div className="mb-10 flex flex-col items-center text-center">
          <Logo size={56} className="mb-5" />
          <h1 className="text-[26px] font-bold leading-tight text-text">Entra a jugar</h1>
          <p className="mt-2 text-sm text-text-secondary">Coordina partidos con gente de tu nivel</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSocialNote('Inicio con Apple disponible próximamente.')}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-3.5 font-semibold text-text"
          >
            <AppleIcon /> Continuar con Apple
          </button>
          <button
            type="button"
            onClick={() => setSocialNote('Inicio con Google disponible próximamente.')}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-3.5 font-semibold text-text"
          >
            <GoogleIcon /> Continuar con Google
          </button>
          {socialNote && <p className="text-center text-xs text-text-secondary">{socialNote}</p>}
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium text-text-secondary">o con tu correo</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {!showEmailForm ? (
          <button
            type="button"
            onClick={() => setShowEmailForm(true)}
            className="w-full rounded-full bg-lime py-3.5 text-center font-semibold text-bg"
          >
            Continuar con correo
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
            />

            {error && <p className="text-sm font-medium text-burnt">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 rounded-full bg-lime py-3.5 font-semibold text-bg disabled:opacity-60"
            >
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-lime">
            Regístrate
          </Link>
        </p>
      </div>

      <p className="pb-2 text-center text-xs text-text-secondary">
        🔥 Cientos de partidos se coordinan cada semana
      </p>
    </div>
  )
}
