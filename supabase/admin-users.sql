create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique,
  email text not null unique,
  full_name text,
  role text not null default 'editor' check (role in ('owner', 'admin', 'editor', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists admin_users_set_updated_at on public.admin_users;

create trigger admin_users_set_updated_at
before update on public.admin_users
for each row
execute function public.set_updated_at();
