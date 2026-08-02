import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Logo from '../components/Logo'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
    <div className="flex min-h-dvh flex-col items-center justify-center bg-gradient-to-br from-electric via-electric-light to-energy-green px-6 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl dark:bg-slate-900">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} className="mb-3" />
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">SportMatch</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Encuentra tu compañero de juego</p>
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
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm font-medium text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-xl bg-energy-orange py-3 font-bold text-white shadow-lg shadow-energy-orange/30 transition active:scale-[0.98] disabled:opacity-60"
          >
            {loading ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-electric">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}
