-- Gweno Hub: reviews table required by pages/api/db.js
-- Run this once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users(id) on delete cascade,
  full_name text not null,
  phone text,
  country text,
  review_text text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by text
);

create index if not exists reviews_status_created_idx
  on public.reviews(status, created_at desc);

create index if not exists reviews_user_created_idx
  on public.reviews(user_id, created_at desc);
