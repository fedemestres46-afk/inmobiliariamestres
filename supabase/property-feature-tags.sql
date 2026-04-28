alter table public.properties
add column if not exists service_tags text[] not null default '{}',
add column if not exists amenity_tags text[] not null default '{}';
