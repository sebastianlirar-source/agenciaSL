import { isSupabaseConfigured } from '../lib/supabaseClient'

export default function ConfigWarning() {
  if (isSupabaseConfigured) return null

  return (
    <div className="fixed inset-x-0 top-0 z-50 bg-red-600 px-4 py-2 text-center text-xs font-semibold text-white">
      Falta configurar Supabase: copia <code className="mx-1 rounded bg-black/20 px-1">.env.example</code> a{' '}
      <code className="mx-1 rounded bg-black/20 px-1">.env</code> con tus credenciales.
    </div>
  )
}
