create extension if not exists "pgcrypto";

create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  location text not null,
  property_type text not null check (
    property_type in ('Casa', 'Departamento', 'Lote', 'Oficina')
  ),
  operation_type text not null check (
    operation_type in ('Venta', 'Alquiler')
  ),
  price numeric(12, 2) not null,
  currency text not null default 'USD' check (currency in ('USD', 'ARS')),
  surface_m2 integer not null,
  bedrooms integer not null default 0,
  status text not null default 'draft' check (
    status in ('published', 'draft', 'paused')
  ),
  featured boolean not null default false,
  cover_url text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists properties_set_updated_at on public.properties;

create trigger properties_set_updated_at
before update on public.properties
for each row
execute function public.set_updated_at();

insert into public.properties (
  slug,
  title,
  location,
  property_type,
  operation_type,
  price,
  currency,
  surface_m2,
  bedrooms,
  status,
  featured,
  cover_url,
  description
)
values
  (
    'casa-rioja-pellegrini',
    'Casa reciclada con patio y pileta',
    'Pichincha, Rosario',
    'Casa',
    'Venta',
    248000,
    'USD',
    214,
    3,
    'published',
    true,
    'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80',
    'Casa reciclada con tres dormitorios, patio verde y pileta. Ideal para familia.'
  ),
  (
    'departamento-premium-parque-espana',
    'Semipiso premium frente al rio',
    'Parque Espana, Rosario',
    'Departamento',
    'Venta',
    189000,
    'USD',
    128,
    2,
    'published',
    true,
    'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    'Semipiso luminoso con visuales abiertas, balcon corrido y terminaciones premium.'
  ),
  (
    'oficina-corporativa-centro',
    'Oficina corporativa con sala de reuniones',
    'Centro, Rosario',
    'Oficina',
    'Alquiler',
    1150000,
    'ARS',
    96,
    0,
    'draft',
    false,
    'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
    'Planta flexible para equipos comerciales o estudios profesionales.'
  ),
  (
    'lote-barrio-abierto-funes',
    'Lote en barrio abierto listo para construir',
    'Funes, Santa Fe',
    'Lote',
    'Venta',
    64000,
    'USD',
    540,
    0,
    'paused',
    false,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    'Lote regular con servicios y excelente acceso desde autopista.'
  )
on conflict (slug) do nothing;
