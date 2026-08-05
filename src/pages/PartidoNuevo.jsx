import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { useProfile } from '../context/ProfileContext'
import { PARTIDO_NIVELES, SPORT_EMOJI } from '../lib/constants'
import Logo from '../components/Logo'

export default function PartidoNuevo() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfile()

  const [sportsCatalog, setSportsCatalog] = useState([])
  const [sportId, setSportId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [fechaHora, setFechaHora] = useState('')
  const [comuna, setComuna] = useState(profile?.comuna ?? '')
  const [lugar, setLugar] = useState('')
  const [cupos, setCupos] = useState(6)
  const [nivel, setNivel] = useState('Cualquiera')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('sports')
      .select('*')
      .order('id')
      .then(({ data }) => {
        setSportsCatalog(data ?? [])
        if (data?.length) setSportId(String(data[0].id))
      })
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!fechaHora) {
      setError('Elige fecha y hora.')
      return
    }
    if (new Date(fechaHora) <= new Date()) {
      setError('La fecha debe ser en el futuro.')
      return
    }

    setSaving(true)
    const { data, error: insertError } = await supabase
      .from('partidos')
      .insert({
        creador_id: user.id,
        sport_id: Number(sportId),
        titulo: titulo.trim() || null,
        comuna,
        lugar,
        fecha_hora: new Date(fechaHora).toISOString(),
        cupos_totales: cupos,
        nivel,
      })
      .select()
      .single()

    setSaving(false)
    if (insertError) {
      setError(insertError.message)
      return
    }
    navigate(`/partidos/${data.id}`)
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Logo size={48} className="mb-2" />
        <h1 className="text-2xl font-bold text-text">Crear partido</h1>
        <p className="mt-1 text-sm text-text-secondary">Organiza un partido y suma jugadores</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Deporte</label>
          <select
            value={sportId}
            onChange={(e) => setSportId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-lime"
          >
            {sportsCatalog.map((s) => (
              <option key={s.id} value={s.id}>
                {SPORT_EMOJI[s.nombre] ?? '🏅'} {s.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Título (opcional)</label>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={60}
            placeholder="Ej: Picadito de los sábados"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Fecha y hora</label>
          <input
            type="datetime-local"
            required
            value={fechaHora}
            onChange={(e) => setFechaHora(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-lime"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-secondary">Comuna</label>
            <input
              required
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              placeholder="Ej: Providencia"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-text-secondary">Cupos totales</label>
            <input
              type="number"
              min={2}
              max={50}
              required
              value={cupos}
              onChange={(e) => setCupos(Number(e.target.value))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-lime"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Lugar</label>
          <input
            required
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            placeholder="Ej: Cancha Parque Bustamante"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-text-secondary">Nivel</label>
          <div className="flex flex-wrap gap-2">
            {PARTIDO_NIVELES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setNivel(n)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  nivel === n ? 'bg-lime text-bg' : 'border border-border bg-surface text-text-secondary'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-burnt">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-full bg-lime py-3.5 font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? 'Creando…' : 'Crear partido'}
        </button>
      </form>
    </div>
  )
}
