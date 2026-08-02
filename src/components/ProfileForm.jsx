import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { DISPONIBILIDAD_OPTIONS, NIVELES, SPORT_EMOJI } from '../lib/constants'
import AvatarUpload from './AvatarUpload'

function toSportsMap(mySports) {
  const map = {}
  for (const row of mySports) {
    map[row.sport_id] = row.nivel
  }
  return map
}

export default function ProfileForm({ initialProfile, initialSports = [], onSaved, submitLabel = 'Guardar' }) {
  const { user } = useAuth()
  const [sportsCatalog, setSportsCatalog] = useState([])
  const [nombre, setNombre] = useState(initialProfile?.nombre ?? '')
  const [edad, setEdad] = useState(initialProfile?.edad ?? '')
  const [comuna, setComuna] = useState(initialProfile?.comuna ?? '')
  const [bio, setBio] = useState(initialProfile?.bio ?? '')
  const [fotoUrl, setFotoUrl] = useState(initialProfile?.foto_url ?? '')
  const [disponibilidad, setDisponibilidad] = useState(initialProfile?.disponibilidad ?? [])
  const [selectedSports, setSelectedSports] = useState(toSportsMap(initialSports))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase
      .from('sports')
      .select('*')
      .order('id')
      .then(({ data }) => setSportsCatalog(data ?? []))
  }, [])

  function toggleDisponibilidad(option) {
    setDisponibilidad((prev) =>
      prev.includes(option) ? prev.filter((d) => d !== option) : [...prev, option]
    )
  }

  function toggleSport(sportId) {
    setSelectedSports((prev) => {
      const next = { ...prev }
      if (next[sportId]) {
        delete next[sportId]
      } else {
        next[sportId] = 'Principiante'
      }
      return next
    })
  }

  function setSportLevel(sportId, nivel) {
    setSelectedSports((prev) => ({ ...prev, [sportId]: nivel }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (Object.keys(selectedSports).length === 0) {
      setError('Selecciona al menos un deporte.')
      return
    }

    setSaving(true)
    try {
      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            user_id: user.id,
            nombre,
            edad: edad === '' ? null : Number(edad),
            comuna,
            bio,
            foto_url: fotoUrl,
            disponibilidad,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()

      if (profileError) throw profileError

      const { error: deleteError } = await supabase
        .from('user_sports')
        .delete()
        .eq('user_id', user.id)
      if (deleteError) throw deleteError

      const rows = Object.entries(selectedSports).map(([sport_id, nivel]) => ({
        user_id: user.id,
        sport_id: Number(sport_id),
        nivel,
      }))

      const { error: insertError } = await supabase.from('user_sports').insert(rows)
      if (insertError) throw insertError

      onSaved?.(profileRow)
    } catch (err) {
      setError(err.message ?? 'No se pudo guardar el perfil.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <AvatarUpload url={fotoUrl} onUploaded={setFotoUrl} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Nombre</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Edad</label>
          <input
            type="number"
            min={13}
            max={100}
            required
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Comuna / Ciudad</label>
          <input
            required
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            placeholder="Ej: Providencia"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700 dark:text-slate-300">Biografía corta</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-electric focus:ring-2 focus:ring-electric/30 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          placeholder="Cuéntale a otros deportistas sobre ti…"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Disponibilidad</label>
        <div className="flex flex-wrap gap-2">
          {DISPONIBILIDAD_OPTIONS.map((option) => {
            const active = disponibilidad.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDisponibilidad(option)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  active
                    ? 'bg-electric text-white shadow-md shadow-electric/30'
                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
          Deportes que practicas
        </label>
        <div className="flex flex-col gap-2">
          {sportsCatalog.map((sport) => {
            const active = Boolean(selectedSports[sport.id])
            return (
              <div
                key={sport.id}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 transition ${
                  active
                    ? 'border-energy-orange bg-energy-orange/10'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleSport(sport.id)}
                  className="flex items-center gap-2 text-left text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  <span className="text-lg">{SPORT_EMOJI[sport.nombre] ?? '🏅'}</span>
                  {sport.nombre}
                </button>
                {active && (
                  <select
                    value={selectedSports[sport.id]}
                    onChange={(e) => setSportLevel(sport.id, e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs font-semibold dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  >
                    {NIVELES.map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {error && <p className="text-sm font-medium text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-energy-green py-3 font-bold text-white shadow-lg shadow-energy-green/30 transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
