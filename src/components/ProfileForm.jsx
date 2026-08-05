import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { DISPONIBILIDAD_OPTIONS, SPORT_EMOJI } from '../lib/constants'
import { LevelPicker } from './LevelBars'
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
  const [showAddSport, setShowAddSport] = useState(false)
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

  function addSport(sportId) {
    setSelectedSports((prev) => ({ ...prev, [sportId]: 'Principiante' }))
    setShowAddSport(false)
  }

  function removeSport(sportId) {
    setSelectedSports((prev) => {
      const next = { ...prev }
      delete next[sportId]
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

  const selectedIds = Object.keys(selectedSports).map(Number)
  const availableToAdd = sportsCatalog.filter((s) => !selectedIds.includes(s.id))

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <AvatarUpload url={fotoUrl} onUploaded={setFotoUrl} />

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Nombre</label>
          <input
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Edad</label>
          <input
            type="number"
            min={13}
            max={100}
            required
            value={edad}
            onChange={(e) => setEdad(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none focus:border-lime"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-text-secondary">Comuna / Ciudad</label>
          <input
            required
            value={comuna}
            onChange={(e) => setComuna(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
            placeholder="Ej: Providencia"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-semibold text-text-secondary">Biografía corta</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={200}
          rows={3}
          className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text outline-none placeholder:text-text-secondary focus:border-lime"
          placeholder="Cuéntale a otros deportistas sobre ti…"
        />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">Disponibilidad</label>
        <div className="grid grid-cols-2 gap-2">
          {DISPONIBILIDAD_OPTIONS.map((option) => {
            const active = disponibilidad.includes(option)
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleDisponibilidad(option)}
                className={`rounded-xl py-3 text-sm font-semibold transition ${
                  active ? 'bg-lime text-bg' : 'border border-border bg-surface text-text'
                }`}
              >
                {option}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-text-secondary">Tus deportes</label>
        <div className="flex flex-col gap-2">
          {Object.entries(selectedSports).map(([sportId, nivel]) => {
            const sport = sportsCatalog.find((s) => s.id === Number(sportId))
            if (!sport) return null
            return (
              <div
                key={sportId}
                className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{SPORT_EMOJI[sport.nombre] ?? '🏅'}</span>
                  <span className="text-sm font-semibold text-text">{sport.nombre}</span>
                </div>
                <div className="flex items-center gap-3">
                  <LevelPicker value={nivel} onChange={(n) => setSportLevel(sportId, n)} />
                  <button
                    type="button"
                    onClick={() => removeSport(sportId)}
                    aria-label={`Quitar ${sport.nombre}`}
                    className="text-text-secondary"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {showAddSport ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {availableToAdd.map((sport) => (
              <button
                key={sport.id}
                type="button"
                onClick={() => addSport(sport.id)}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-text"
              >
                {SPORT_EMOJI[sport.nombre] ?? '🏅'} {sport.nombre}
              </button>
            ))}
            {availableToAdd.length === 0 && (
              <p className="text-xs text-text-secondary">Ya agregaste todos los deportes disponibles.</p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddSport(true)}
            className="mt-3 w-full rounded-xl border border-dashed border-border py-3 text-sm font-semibold text-text-secondary"
          >
            + Agregar deporte
          </button>
        )}
      </div>

      {error && <p className="text-sm font-medium text-burnt">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-full bg-lime py-3.5 font-semibold text-bg transition active:scale-[0.98] disabled:opacity-60"
      >
        {saving ? 'Guardando…' : submitLabel}
      </button>
    </form>
  )
}
