-- Gweno Hub: admin-entered manual withdrawal records
-- Run this once in Supabase SQL Editor before deploying the updated files.

create extension if not exists pgcrypto;

create table if not exists public.manual_withdrawals (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone_masked text not null,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'successful', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists manual_withdrawals_phone_created_idx
  on public.manual_withdrawals(phone_masked, created_at desc);

create index if not exists manual_withdrawals_created_idx
  on public.manual_withdrawals(created_at desc);
