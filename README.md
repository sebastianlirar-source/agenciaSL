# SportMatch 🏆

"Tinder para deportistas": encuentra compañeros para jugar tenis, básquetbol, fútbol, running, ciclismo, vóleibol o salir de trekking.

**Stack:** React + Vite + Tailwind CSS (frontend) · Supabase (Auth + Postgres + Realtime + Storage).

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (o usa uno existente).
2. Abre **SQL Editor → New query**, pega el contenido completo de
   [`supabase/migrations/0001_init.sql`](./supabase/migrations/0001_init.sql) y ejecútalo.
   Esto crea:
   - Tablas `profiles`, `sports`, `user_sports`, `likes`, `matches`, `messages`.
   - El catálogo de deportes (tenis, básquetbol, trekking, fútbol, running, ciclismo, vóleibol).
   - Un trigger que genera un `match` automáticamente cuando dos usuarios se dan "me interesa" mutuamente.
   - Políticas de **Row Level Security** en todas las tablas.
   - Un bucket público de Storage llamado `avatars` para las fotos de perfil.
   - Habilita Realtime sobre `messages` y `matches`.
3. En **Project Settings → Data API**, confirma que el schema `public` esté expuesto (viene por defecto).
4. En **Authentication → Providers**, deja habilitado Email/Password. Si quieres pruebas rápidas sin
   verificar correo, puedes desactivar "Confirm email" en **Authentication → Sign In / Providers**.
5. Copia la **Project URL** y la **anon public key** desde **Project Settings → API**.

## 2. Configurar el frontend

```bash
cp .env.example .env
```

Completa `.env` con tus credenciales:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Instala dependencias y corre el proyecto:

```bash
npm install
npm run dev
```

## 3. Flujo de la app

1. **Registro / Login** (`/register`, `/login`): email + contraseña vía Supabase Auth.
2. **Onboarding** (`/onboarding`): primer login pide nombre, foto, edad, comuna, bio, deportes con nivel
   (Principiante/Intermedio/Avanzado) y disponibilidad. Se guarda en `profiles` + `user_sports`.
3. **Descubrir** (`/`): tarjetas de otros usuarios con swipe (arrastrar) o botones ✕ / ♥. Filtro por deporte
   arriba. Un "me interesa" mutuo crea un `match` (vía trigger de Postgres) y muestra el modal de match.
4. **Matches** (`/matches`): lista de matches con foto y nombre.
5. **Chat** (`/matches/:id`): mensajería en tiempo real con Supabase Realtime (`postgres_changes` sobre
   `messages`).
6. **Perfil** (`/profile`): ver/editar tus datos y cerrar sesión.

## Modelo de datos

| Tabla         | Descripción                                                             |
| ------------- | ------------------------------------------------------------------------ |
| `profiles`    | Datos del perfil (1 fila por usuario, `user_id` referencia `auth.users`) |
| `sports`      | Catálogo de deportes                                                      |
| `user_sports` | Relación usuario ↔ deporte con su nivel                                  |
| `likes`       | "Me interesa" enviados                                                    |
| `matches`     | Se crea automáticamente cuando hay like mutuo                             |
| `messages`    | Mensajes de chat, ligados a un `match`                                    |

### Seguridad (RLS)

- Cada usuario solo puede **insertar/editar/borrar su propio** perfil, deportes y likes.
- Los perfiles y deportes son **visibles para todos los usuarios autenticados** (necesario para la pantalla
  Descubrir).
- Los `likes` que envías solo los ves tú (nadie ve quién lo likeó hasta que hay match).
- Los `matches` solo son visibles para los dos usuarios involucrados; se crean únicamente vía trigger
  (`security definer`), no desde el cliente.
- Los `messages` solo pueden leerse/enviarse si el usuario es parte del `match` correspondiente.

## Scripts

- `npm run dev` — entorno de desarrollo
- `npm run build` — build de producción
- `npm run preview` — sirve el build de producción localmente
- `npm run lint` — oxlint
