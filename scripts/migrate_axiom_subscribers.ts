/**
 * migrate_axiom_subscribers.ts
 * Creates the axiom_subscribers table and seeds staff accounts.
 * Run: tsx --env-file=.env.local scripts/migrate_axiom_subscribers.ts
 */

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

async function run() {
  console.log('Creating axiom_subscribers table...');

  // Use rpc to execute raw SQL via a pg function workaround — or use the REST DDL path
  // Supabase JS client doesn't support DDL directly; we'll use fetch against the SQL endpoint
  const ddl = `
    -- Create table
    CREATE TABLE IF NOT EXISTS axiom_subscribers (
      id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      email                TEXT        NOT NULL,
      tier                 TEXT        NOT NULL DEFAULT 'standard',
      role                 TEXT        NOT NULL DEFAULT 'subscriber',
      status               TEXT        NOT NULL DEFAULT 'active',
      kajabi_purchase_id   TEXT,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
    );

    -- Unique constraint on email
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'axiom_subscribers_email_key'
      ) THEN
        ALTER TABLE axiom_subscribers ADD CONSTRAINT axiom_subscribers_email_key UNIQUE (email);
      END IF;
    END
    $$;

    -- Enable RLS
    ALTER TABLE axiom_subscribers ENABLE ROW LEVEL SECURITY;

    -- Auto-update updated_at
    CREATE OR REPLACE FUNCTION update_axiom_subscribers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    DROP TRIGGER IF EXISTS set_axiom_subscribers_updated_at ON axiom_subscribers;
    CREATE TRIGGER set_axiom_subscribers_updated_at
      BEFORE UPDATE ON axiom_subscribers
      FOR EACH ROW EXECUTE FUNCTION update_axiom_subscribers_updated_at();

    -- Seed staff accounts
    INSERT INTO axiom_subscribers (email, tier, role, status) VALUES
      ('jstanley@nssapros.com',          'staff', 'staff', 'active'),
      ('chill@nssapros.com',             'staff', 'staff', 'active'),
      ('tvalles@nssapros.com',           'staff', 'staff', 'active'),
      ('jblair@mypremierplan.com',       'staff', 'staff', 'active'),
      ('travispaulstanley@gmail.com',    'staff', 'staff', 'active')
    ON CONFLICT (email) DO UPDATE SET
      role   = EXCLUDED.role,
      status = EXCLUDED.status,
      tier   = EXCLUDED.tier,
      updated_at = now();
  `;

  // Execute via Supabase SQL API
  const res = await fetch(`${url}/rest/v1/sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'apikey': key,
    },
    body: JSON.stringify({ query: ddl }),
  });

  if (!res.ok) {
    // Try the management API path instead
    const text = await res.text();
    console.error('SQL API failed:', res.status, text);
    console.log('\nFalling back to individual inserts for the seed data...');
    await seedViaClient();
    return;
  }

  const result = await res.json();
  console.log('✅ Table created and staff seeded.');
  console.log(result);
}

async function seedViaClient() {
  // Only the seed — table must already exist from manual DDL
  const staff = [
    { email: 'jstanley@nssapros.com',       tier: 'staff', role: 'staff', status: 'active' },
    { email: 'chill@nssapros.com',           tier: 'staff', role: 'staff', status: 'active' },
    { email: 'tvalles@nssapros.com',         tier: 'staff', role: 'staff', status: 'active' },
    { email: 'jblair@mypremierplan.com',     tier: 'staff', role: 'staff', status: 'active' },
    { email: 'travispaulstanley@gmail.com',  tier: 'staff', role: 'staff', status: 'active' },
  ];

  const { error } = await sb
    .from('axiom_subscribers')
    .upsert(staff, { onConflict: 'email' });

  if (error) {
    console.error('Seed error:', error.message);
    console.log('\n📋 Run this SQL manually in the Supabase Dashboard SQL editor:');
    console.log(MANUAL_DDL);
  } else {
    console.log('✅ Staff seeded via client.');
  }
}

const MANUAL_DDL = `
CREATE TABLE IF NOT EXISTS axiom_subscribers (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email                TEXT        NOT NULL UNIQUE,
  tier                 TEXT        NOT NULL DEFAULT 'standard',
  role                 TEXT        NOT NULL DEFAULT 'subscriber',
  status               TEXT        NOT NULL DEFAULT 'active',
  kajabi_purchase_id   TEXT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE axiom_subscribers ENABLE ROW LEVEL SECURITY;

INSERT INTO axiom_subscribers (email, tier, role, status) VALUES
  ('jstanley@nssapros.com',          'staff', 'staff', 'active'),
  ('chill@nssapros.com',             'staff', 'staff', 'active'),
  ('tvalles@nssapros.com',           'staff', 'staff', 'active'),
  ('jblair@mypremierplan.com',       'staff', 'staff', 'active'),
  ('travispaulstanley@gmail.com',    'staff', 'staff', 'active')
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role, status = EXCLUDED.status, tier = EXCLUDED.tier;
`;

run().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
