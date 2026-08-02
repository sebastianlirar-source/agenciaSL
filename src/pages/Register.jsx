import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-energy-green via-electric to-energy-orange px-6 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-8 text-center">
          <div className="mb-3 text-5xl">🤝</div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Únete y encuentra con quién jugar</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Confirmar contraseña</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}
          {info && <p className="text-sm font-medium text-energy-green-dark">{info}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-electric py-3 font-bold text-white shadow-lg shadow-electric/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Creando cuenta…' : 'Registrarme'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-electric">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
