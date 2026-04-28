create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid references public.properties(id) on delete set null,
  property_title_snapshot text not null,
  property_location_snapshot text,
  full_name text not null,
  phone text not null,
  email text,
  message text,
  notes text,
  scheduled_at timestamptz,
  google_event_id text,
  origin text not null default 'web' check (
    origin in ('web', 'whatsapp', 'zonaprop', 'manual')
  ),
  status text not null default 'new' check (
    status in ('new', 'contacted', 'visit', 'negotiation', 'closed', 'discarded')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists leads_set_updated_at on public.leads;

create trigger leads_set_updated_at
before update on public.leads
for each row
execute function public.set_updated_at();
