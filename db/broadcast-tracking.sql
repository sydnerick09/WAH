-- Run once in Supabase SQL Editor to enable resumable, duplicate-safe broadcasts.
create table if not exists public.broadcast_recipients (
  campaign_key text not null,
  email text not null,
  user_id uuid null,
  full_name text not null default '',
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'failed')),
  last_error text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (campaign_key, email)
);

create index if not exists broadcast_recipients_campaign_status_idx
  on public.broadcast_recipients (campaign_key, status);

alter table public.broadcast_recipients enable row level security;
-- Access is performed server-side with the Supabase service-role key.
