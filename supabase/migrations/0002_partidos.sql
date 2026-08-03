-- SportMatch: partidos abiertos (matchmaking grupal para deportes de equipo)
-- Ejecuta este archivo completo en el SQL Editor de tu proyecto Supabase
-- DESPUÉS de haber corrido 0001_init.sql.

-- ============================================================
-- TABLAS
-- ============================================================

create table if not exists public.partidos (
  id uuid primary key default gen_random_uuid(),
  creador_id uuid not null references auth.users (id) on delete cascade,
  sport_id integer not null references public.sports (id) on delete cascade,
  titulo text,
  comuna text not null,
  lugar text not null,
  fecha_hora timestamptz not null,
  cupos_totales integer not null check (cupos_totales >= 2 and cupos_totales <= 50),
  nivel text not null default 'Cualquiera' check (nivel in ('Cualquiera', 'Principiante', 'Intermedio', 'Avanzado')),
  estado text not null default 'abierto' check (estado in ('abierto', 'completo', 'cancelado')),
  created_at timestamptz not null default now()
);

create table if not exists public.partido_participantes (
  partido_id uuid not null references public.partidos (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (partido_id, user_id)
);

create table if not exists public.partido_mensajes (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references public.partidos (id) on delete cascade,
  sender_id uuid not null references auth.users (id) on delete cascade,
  content text not null check (char_length(trim(content)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists idx_partidos_sport on public.partidos (sport_id);
create index if not exists idx_partidos_fecha on public.partidos (fecha_hora);
create index if not exists idx_partido_participantes_user on public.partido_participantes (user_id);
create index if not exists idx_partido_mensajes_partido on public.partido_mensajes (partido_id, created_at);

-- ============================================================
-- FUNCIÓN: unirse a un partido de forma atómica (respeta cupos)
-- ============================================================
create or replace function public.join_partido(p_partido_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cupos integer;
  v_estado text;
  v_ocupados integer;
begin
  select cupos_totales, estado into v_cupos, v_estado
  from public.partidos
  where id = p_partido_id
  for update;

  if not found then
    raise exception 'Partido no encontrado';
  end if;

  if v_estado <> 'abierto' then
    raise exception 'Este partido ya no admite jugadores';
  end if;

  select count(*) into v_ocupados
  from public.partido_participantes
  where partido_id = p_partido_id;

  if v_ocupados >= v_cupos then
    raise exception 'Este partido ya está completo';
  end if;

  insert into public.partido_participantes (partido_id, user_id)
  values (p_partido_id, auth.uid())
  on conflict (partido_id, user_id) do nothing;

  if v_ocupados + 1 >= v_cupos then
    update public.partidos set estado = 'completo' where id = p_partido_id;
  end if;
end;
$$;

-- Agrega automáticamente al creador como participante (ocupa un cupo)
create or replace function public.handle_partido_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.partido_participantes (partido_id, user_id)
  values (new.id, new.creador_id)
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists on_partido_created on public.partidos;
create trigger on_partido_created
  after insert on public.partidos
  for each row
  execute function public.handle_partido_created();

-- Si alguien se va y el partido estaba completo, vuelve a abrirse
create or replace function public.handle_participante_removed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.partidos
  set estado = 'abierto'
  where id = old.partido_id and estado = 'completo';
  return old;
end;
$$;

drop trigger if exists on_participante_removed on public.partido_participantes;
create trigger on_participante_removed
  after delete on public.partido_participantes
  for each row
  execute function public.handle_participante_removed();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.partidos enable row level security;
alter table public.partido_participantes enable row level security;
alter table public.partido_mensajes enable row level security;

-- ---- partidos ----
-- Visibles para todos los autenticados (listado público); solo el
-- creador puede editar/cancelar el suyo. No hay insert policy porque
-- el insert se hace vía la app con creador_id = auth.uid() explícito.
drop policy if exists "partidos_select_authenticated" on public.partidos;
create policy "partidos_select_authenticated"
  on public.partidos for select
  to authenticated
  using (true);

drop policy if exists "partidos_insert_own" on public.partidos;
create policy "partidos_insert_own"
  on public.partidos for insert
  to authenticated
  with check (auth.uid() = creador_id);

drop policy if exists "partidos_update_own" on public.partidos;
create policy "partidos_update_own"
  on public.partidos for update
  to authenticated
  using (auth.uid() = creador_id)
  with check (auth.uid() = creador_id);

drop policy if exists "partidos_delete_own" on public.partidos;
create policy "partidos_delete_own"
  on public.partidos for delete
  to authenticated
  using (auth.uid() = creador_id);

-- ---- partido_participantes ----
-- Lectura pública (para mostrar cupos/roster antes de unirse). No hay
-- policy de insert: unirse pasa siempre por join_partido() (security
-- definer), que valida cupos de forma atómica antes de insertar.
drop policy if exists "partido_participantes_select_authenticated" on public.partido_participantes;
create policy "partido_participantes_select_authenticated"
  on public.partido_participantes for select
  to authenticated
  using (true);

drop policy if exists "partido_participantes_delete_own" on public.partido_participantes;
create policy "partido_participantes_delete_own"
  on public.partido_participantes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ---- partido_mensajes ----
-- Solo los participantes confirmados del partido pueden leer/escribir.
drop policy if exists "partido_mensajes_select_participant" on public.partido_mensajes;
create policy "partido_mensajes_select_participant"
  on public.partido_mensajes for select
  to authenticated
  using (
    exists (
      select 1 from public.partido_participantes pp
      where pp.partido_id = partido_mensajes.partido_id
        and pp.user_id = auth.uid()
    )
  );

drop policy if exists "partido_mensajes_insert_participant" on public.partido_mensajes;
create policy "partido_mensajes_insert_participant"
  on public.partido_mensajes for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.partido_participantes pp
      where pp.partido_id = partido_mensajes.partido_id
        and pp.user_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partido_mensajes'
  ) then
    alter publication supabase_realtime add table public.partido_mensajes;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partidos'
  ) then
    alter publication supabase_realtime add table public.partidos;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'partido_participantes'
  ) then
    alter publication supabase_realtime add table public.partido_participantes;
  end if;
end $$;
