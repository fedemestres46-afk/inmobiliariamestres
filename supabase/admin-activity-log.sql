create table if not exists public.admin_activity_log (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('property', 'lead')),
  entity_id uuid,
  entity_label text not null,
  action text not null,
  summary text not null,
  actor_user_id uuid,
  actor_email text not null,
  actor_role text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_activity_log_created_at_idx
on public.admin_activity_log (created_at desc);

create index if not exists admin_activity_log_entity_idx
on public.admin_activity_log (entity_type, entity_id);
