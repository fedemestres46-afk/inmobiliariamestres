alter table public.leads
add column if not exists exported_at timestamptz,
add column if not exists export_batch_id text;
