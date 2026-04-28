alter table public.properties
add column if not exists covered_surface_m2 integer not null default 0;
