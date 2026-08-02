-- SportMatch: esquema inicial + Row Level Security
-- Ejecuta este archivo completo en el SQL Editor de tu proyecto Supabase
-- (Dashboard > SQL Editor > New query), o con `supabase db push` si usas la CLI.

-- ============================================================
-- EXTENSIONES
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null,
  edad integer check (edad is null or (edad >= 13 and edad <= 100)),
  foto_url text,
  comuna text,
  bio text,
  disponibilidad text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sports (
  id serial primary key,
  nombre text not null unique
);

create table if not exists public.user_sports (
  user_id uuid not null references auth.users (id) on delete cascade,
  sport_id integer not null references public.sports (id) on delete cascade,
  nivel text not null check (nivel in ('Principiante', 'Intermedio', 'Avanzado')),
  primary key (user_id, sport_id)
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  from_user_id uuid not null references auth.users (id) on delete cascade,
  to_user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint likes_no_self check (from_user_id <> to_user_id),
  constraint likes_unique unique (from_user_id, to_user_id)
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  user1_id uuid not null references auth.users (id) on delete cascade,
  user2_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint matches_ordered check (user1_id < user2_id),
  constraint matches_unique unique (user1_id, user2_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_user_sports_sport on public.user_sports (sport_id);
create index if not exists idx_likes_to_user on public.likes (to_user_id);
create index if not exists idx_matches_user1 on public.matches (user1_id);
create index if not exists idx_matches_user2 on public.matches (user2_id);
create index if not exists idx_messages_match on public.messages (match_id, created_at);

-- Catálogo de deportes
insert into public.sports (nombre) values
  ('Tenis'), ('Básquetbol'), ('Trekking'), ('Fútbol'),
  ('Running'), ('Ciclismo'), ('Vóleibol')
on conflict (nombre) do nothing;

-- ============================================================
-- FUNCIÓN: crear match cuando hay like mutuo
-- ============================================================
create or replace function public.handle_new_like()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  u1 uuid;
  u2 uuid;
begin
  if exists (
    select 1 from public.likes
    where from_user_id = new.to_user_id
      and to_user_id = new.from_user_id
  ) then
    if new.from_user_id < new.to_user_id then
      u1 := new.from_user_id;
      u2 := new.to_user_id;
    else
      u1 := new.to_user_id;
      u2 := new.from_user_id;
    end if;

    insert into public.matches (user1_id, user2_id)
    values (u1, u2)
    on conflict (user1_id, user2_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_like_created on public.likes;
create trigger on_like_created
  after insert on public.likes
  for each row
  execute function public.handle_new_like();

-- Mantiene updated_at al día en profiles
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists on_profiles_update on public.profiles;
create trigger on_profiles_update
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles enable row level security;
alter table public.sports enable row level security;
alter table public.user_sports enable row level security;
alter table public.likes enable row level security;
alter table public.matches enable row level security;
alter table public.messages enable row level security;

-- ---- profiles ----
-- Todos los usuarios autenticados pueden ver perfiles (necesario para
-- "Descubrir"); solo el dueño puede crear/editar/borrar el suyo.
create policy "profiles_select_authenticated"
  on public.profiles for select
  to authenticated
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- sports (catálogo de solo lectura) ----
create policy "sports_select_authenticated"
  on public.sports for select
  to authenticated
  using (true);

-- ---- user_sports ----
-- Visibles para todos (se muestran en las tarjetas de Descubrir),
-- pero cada usuario solo administra los suyos.
create policy "user_sports_select_authenticated"
  on public.user_sports for select
  to authenticated
  using (true);

create policy "user_sports_insert_own"
  on public.user_sports for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "user_sports_update_own"
  on public.user_sports for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_sports_delete_own"
  on public.user_sports for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- likes ----
-- Un usuario solo ve los likes que él mismo dio (para no revelar quién
-- lo likeó antes de haber match) y solo puede insertar/borrar los suyos.
create policy "likes_select_own"
  on public.likes for select
  to authenticated
  using (auth.uid() = from_user_id);

create policy "likes_insert_own"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = from_user_id);

create policy "likes_delete_own"
  on public.likes for delete
  to authenticated
  using (auth.uid() = from_user_id);

-- ---- matches ----
-- Solo visibles para los dos usuarios involucrados. Se crean únicamente
-- vía el trigger (security definer); no se permite insert/update/delete
-- directo desde el cliente.
create policy "matches_select_participant"
  on public.matches for select
  to authenticated
  using (auth.uid() = user1_id or auth.uid() = user2_id);

-- ---- messages ----
-- Solo los participantes del match pueden leer/enviar mensajes de ese match.
create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.matches m
      where m.id = messages.match_id
        and (m.user1_id = auth.uid() or m.user2_id = auth.uid())
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.matches;

-- ============================================================
-- STORAGE: bucket público para fotos de perfil
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatar_public_read"
  on storage.objects for select
  to public
  using (bucket_id = 'avatars');

create policy "avatar_upload_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_update_own"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatar_delete_own"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
