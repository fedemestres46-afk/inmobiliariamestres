alter table public.properties
add column if not exists last_edited_by_user_id uuid,
add column if not exists last_edited_by_email text;

alter table public.leads
add column if not exists last_edited_by_user_id uuid,
add column if not exists last_edited_by_email text;
