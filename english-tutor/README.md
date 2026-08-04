# Habla — Tutor de inglés

App Next.js (App Router) para practicar inglés: conversación con corrección en
tiempo real, reading y listening generados por Claude, autenticación con
Supabase y seguimiento de progreso (racha de días + errores más comunes).

## Stack

- **Next.js 15** (App Router) + TypeScript
- **Claude API** (`claude-opus-5` vía `@anthropic-ai/sdk`) — solo en servidor,
  bajo `src/app/api/**/route.ts`
- **Supabase** — auth (email/password + Google) y base de datos (`profiles`,
  `activity_log`, `corrections_log`, todas con RLS)

## Desarrollo local

```bash
npm install
cp .env.local.example .env.local   # completa ANTHROPIC_API_KEY
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login` si no hay sesión.

## Variables de entorno

| Variable | Dónde se usa | Público/privado |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | cliente y servidor | Público (va al navegador) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | cliente y servidor | Público (va al navegador) |
| `ANTHROPIC_API_KEY` | solo `src/app/api/**/route.ts` | **Privado** — nunca debe llevar el prefijo `NEXT_PUBLIC_` |

## Desplegar en Vercel

Este proyecto vive en una **subcarpeta** del repo `agenciaSL` (que también
tiene el sitio estático de la agencia en la raíz), así que al importar el
repo en Vercel:

1. **New Project → Import** el repo `sebastianlira-source/agenciaSL`.
2. En **Root Directory**, selecciona `english-tutor` (no la raíz del repo).
   Vercel detecta Next.js automáticamente una vez apuntas ahí.
3. En **Environment Variables**, agrega las tres de la tabla de arriba
   (con tus valores reales — no copies el `.env.local.example`).
4. Deploy.

### Después del primer deploy: configura Supabase con tu dominio real

Supabase necesita saber a qué URLs puede redirigir tras login/confirmación de
email. En el dashboard de tu proyecto → **Authentication → URL Configuration**:

- **Site URL**: `https://tu-dominio.vercel.app`
- **Redirect URLs**: agrega `https://tu-dominio.vercel.app/auth/callback`
  (y si usas preview deployments de Vercel, también
  `https://*.vercel.app/auth/callback`)

Si vas a habilitar login con Google, en **Authentication → Providers → Google**
necesitas el Client ID/Secret de un proyecto en Google Cloud Console, con
`https://<tu-proyecto>.supabase.co/auth/v1/callback` como Authorized redirect
URI ahí.

## Estructura

```
src/
  app/            rutas (App Router) + endpoints /api/chat, /api/reading, /api/listening
  components/      UI (tabs de conversación/reading/listening, progreso, etc.)
  hooks/           useProfile (nivel + racha)
  lib/             clientes Supabase/Anthropic, constantes, tipos
  styles/          habla.css (paleta ink navy + amber + notas estilo lápiz rojo)
```
