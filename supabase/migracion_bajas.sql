-- Añadir campos de fecha alta/baja a trabajadores
alter table public.perfiles 
  add column if not exists fecha_alta date default current_date,
  add column if not exists fecha_baja date;

-- Añadir campo activo a empresas
alter table public.empresas 
  add column if not exists activo boolean default true,
  add column if not exists fecha_baja date;
