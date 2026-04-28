alter table public.properties
add column if not exists rooms integer not null default 0,
add column if not exists bathrooms integer not null default 0,
add column if not exists garage_spaces integer not null default 0;
