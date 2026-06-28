-- ============================================================
-- PORTAL DEL EMPLEADO — Esquema Supabase
-- Ejecuta este SQL en: Supabase > SQL Editor > New query
-- ============================================================

-- 1. Perfiles de usuario (extiende auth.users de Supabase)
create table public.perfiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  apellidos text not null,
  empresa_id uuid,
  rol text not null check (rol in ('trabajador', 'empresa', 'asesoria')),
  departamento text,
  tipo_jornada text default 'completa',
  horas_semanales int default 40,
  centro_trabajo text,
  activo boolean default true,
  created_at timestamptz default now()
);

-- 2. Empresas
create table public.empresas (
  id uuid default gen_random_uuid() primary key,
  nombre text not null,
  cif text,
  asesoria_id uuid,
  created_at timestamptz default now()
);

-- 3. Fichajes — tabla principal (INMUTABLE: nunca se borra, solo se corrige con motivo)
create table public.fichajes (
  id uuid default gen_random_uuid() primary key,
  trabajador_id uuid references public.perfiles(id) not null,
  empresa_id uuid references public.empresas(id) not null,
  tipo text not null check (tipo in ('entrada','pausa','fin_pausa','salida')),
  timestamp_utc timestamptz not null default now(),
  latitud numeric(10,7),
  longitud numeric(10,7),
  precision_gps int,
  modalidad text default 'presencial' check (modalidad in ('presencial','teletrabajo')),
  -- Hash SHA-256 del registro para garantizar inmutabilidad
  hash text,
  -- Si es una corrección, referencia al fichaje original
  correccion_de uuid references public.fichajes(id),
  motivo_correccion text,
  created_at timestamptz default now()
);

-- 4. Resumen diario (calculado automáticamente)
create table public.jornadas_diarias (
  id uuid default gen_random_uuid() primary key,
  trabajador_id uuid references public.perfiles(id) not null,
  empresa_id uuid references public.empresas(id) not null,
  fecha date not null,
  entrada timestamptz,
  salida timestamptz,
  minutos_trabajados int default 0,
  minutos_pausa int default 0,
  horas_extra numeric(4,2) default 0,
  modalidad text default 'presencial',
  completa boolean default false,
  unique(trabajador_id, fecha)
);

-- ============================================================
-- SEGURIDAD — Row Level Security (RLS)
-- Cada usuario solo ve sus propios datos
-- ============================================================
alter table public.perfiles enable row level security;
alter table public.fichajes enable row level security;
alter table public.jornadas_diarias enable row level security;
alter table public.empresas enable row level security;

-- Trabajador: solo ve sus propios fichajes
create policy "trabajador_sus_fichajes" on public.fichajes
  for select using (trabajador_id = auth.uid());

create policy "trabajador_insertar_fichaje" on public.fichajes
  for insert with check (trabajador_id = auth.uid());

-- Empresa: ve todos los fichajes de su empresa
create policy "empresa_ve_su_empresa" on public.fichajes
  for select using (
    empresa_id in (
      select empresa_id from public.perfiles where id = auth.uid()
    )
  );

-- Perfil propio
create policy "ver_perfil_propio" on public.perfiles
  for select using (id = auth.uid());

create policy "actualizar_perfil_propio" on public.perfiles
  for update using (id = auth.uid());

-- ============================================================
-- FUNCIÓN: calcular jornada diaria automáticamente
-- Se ejecuta cada vez que se inserta un fichaje
-- ============================================================
create or replace function public.recalcular_jornada()
returns trigger language plpgsql as $$
declare
  v_fecha date;
  v_entrada timestamptz;
  v_salida timestamptz;
  v_minutos int;
  v_pausas int;
begin
  v_fecha := new.timestamp_utc::date;

  select timestamp_utc into v_entrada
    from public.fichajes
    where trabajador_id = new.trabajador_id
      and tipo = 'entrada'
      and timestamp_utc::date = v_fecha
    order by timestamp_utc asc limit 1;

  select timestamp_utc into v_salida
    from public.fichajes
    where trabajador_id = new.trabajador_id
      and tipo = 'salida'
      and timestamp_utc::date = v_fecha
    order by timestamp_utc desc limit 1;

  if v_entrada is not null and v_salida is not null then
    v_minutos := extract(epoch from (v_salida - v_entrada))::int / 60;
  else
    v_minutos := 0;
  end if;

  insert into public.jornadas_diarias
    (trabajador_id, empresa_id, fecha, entrada, salida, minutos_trabajados, completa)
  values
    (new.trabajador_id, new.empresa_id, v_fecha, v_entrada, v_salida, v_minutos, v_salida is not null)
  on conflict (trabajador_id, fecha) do update
    set entrada = excluded.entrada,
        salida = excluded.salida,
        minutos_trabajados = excluded.minutos_trabajados,
        completa = excluded.completa;

  return new;
end;
$$;

create trigger after_fichaje_insert
  after insert on public.fichajes
  for each row execute function public.recalcular_jornada();

-- ============================================================
-- DATOS DE EJEMPLO (opcional, para probar)
-- ============================================================
-- Los usuarios reales se crean desde la app con Supabase Auth
