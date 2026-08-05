import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'
import { AppleIcon, GoogleIcon } from '../components/SocialIcons'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [socialNote, setSocialNote] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    const { data, error } = await signUp(email, password)
    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    if (!data.session) {
      setInfo('Cuenta creada. Revisa tu email para confirmar tu cuenta y luego inicia sesión.')
      return
    }

    navigate('/onboarding')
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={56} className="mb-5" />
          <h1 className="text-[26px] font-bold leading-tight text-text">Crea tu cuenta</h1>
          <p className="mt-2 text-sm text-text-secondary">Únete y encuentra con quién jugar</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setSocialNote('Registro con Apple disponible próximamente.')}
            className="flex items-center justify-center gap-2 rounded-full border border-border bg-surface py-3.5 font-semibold text-text"
          >
            <AppleIcon /> Continuar con Apple
          </button>
          <button
            type="button"
            onClick={() => setSocialNote('Registro con Google disponible próximamente.')}
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
            placeholder="Mínimo 6 caracteres"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
          />
          <input
            type="password"
            required
            minLength={6}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirmar contraseña"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
          />

          {error && <p className="text-sm font-medium text-burnt">{error}</p>}
          {info && <p className="text-sm font-medium text-lime">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full bg-lime py-3.5 font-semibold text-bg disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-text-secondary">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-lime">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
