alter table public.leads
add column if not exists scheduled_at timestamptz,
add column if not exists google_event_id text;
