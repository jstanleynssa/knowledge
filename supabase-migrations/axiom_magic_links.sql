-- Standalone AXIOM magic link tokens (replaces Supabase OTP)
-- Run in Supabase SQL editor (project eqipvrcmugnvkextqmym)

create table if not exists axiom_magic_links (
  id         uuid primary key default gen_random_uuid(),
  email      text not null,
  token      text not null unique,
  expires_at timestamptz not null,
  used_at    timestamptz,
  created_at timestamptz default now()
);

create index if not exists axiom_magic_links_token_idx on axiom_magic_links (token);
create index if not exists axiom_magic_links_email_idx on axiom_magic_links (email);

-- Auto-delete used/expired tokens after 24h (cleanup)
-- Requires pg_cron extension (already enabled on this project)
select cron.schedule(
  'axiom-magic-links-cleanup',
  '0 * * * *',  -- every hour
  $$
    delete from axiom_magic_links
    where (used_at is not null or expires_at < now())
      and created_at < now() - interval '24 hours';
  $$
);
