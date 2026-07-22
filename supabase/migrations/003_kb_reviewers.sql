-- ============================================================
-- Migration 003 — KB reviewers table + approval attribution
-- Applied 2026-07-14 via Tank/supabase-sql.sh
-- ============================================================

-- Reviewers who can access and approve KB pages.
-- categories: text[] of Category values ('social-security' | 'irmaa')
create table if not exists public.kb_reviewers (
  id           uuid        primary key default gen_random_uuid(),
  email        text        not null unique,
  display_name text        not null,
  categories   text[]      not null default '{}',
  created_at   timestamptz default now()
);

-- Seed the initial three reviewers
insert into public.kb_reviewers (email, display_name, categories) values
  ('chill@nssapros.com',       'Cindi Hill',  array['social-security']),
  ('tvalles@nssapros.com',     'Todd Valles', array['irmaa']),
  ('jblair@mypremierplan.com', 'Jim Blair',   array['social-security', 'irmaa'])
on conflict (email) do nothing;

-- Track who approved each page and when
alter table public.reference_pages
  add column if not exists approved_by  text,
  add column if not exists approved_at  timestamptz;

-- RLS: kb_reviewers is readable by service role only (used server-side)
alter table public.kb_reviewers enable row level security;
