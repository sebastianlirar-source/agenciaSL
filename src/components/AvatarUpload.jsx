import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function AvatarUpload({ url, onUploaded }) {
  const { user } = useAuth()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    setError('')
    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from('avatars').getPublicUrl(path)
      onUploaded(data.publicUrl)
    } catch (err) {
      setError('No se pudo subir la foto. Intenta nuevamente.')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative h-28 w-28 overflow-hidden rounded-2xl border border-border bg-surface"
      >
        {url ? (
          <img src={url} alt="Foto de perfil" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl">📷</span>
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-semibold text-text opacity-0 transition group-hover:opacity-100">
          {uploading ? '...' : 'Cambiar'}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {error && <p className="text-xs font-medium text-burnt">{error}</p>}
    </div>
  )
}
