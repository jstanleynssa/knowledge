/**
 * POST /api/axiom/enroll
 * Public beta enrollment endpoint — no auth required.
 *
 * Accepts: name, email, credential
 * - New email    → provisions as active subscriber
 * - Existing + active    → returns already_enrolled
 * - Existing + inactive  → reactivates
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';

type Credential = 'nssa' | 'irmaacp' | 'both';

function credentialToTier(credential: Credential): string {
  // All beta enrollees get standard tier for now
  // Upgrade to arpi_grad manually if/when needed
  return 'standard';
}

export async function POST(req: NextRequest) {
  let body: { name: string; email: string; credential: Credential };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const { name, email, credential } = body;

  if (!name?.trim() || !email?.trim() || !credential) {
    return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
  }

  if (!['nssa', 'irmaacp', 'both'].includes(credential)) {
    return NextResponse.json({ error: 'Invalid credential.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const sb = createServiceClient();

  // Check if already exists
  const { data: existing } = await sb
    .from('axiom_subscribers')
    .select('status, role')
    .eq('email', normalizedEmail)
    .single();

  if (existing) {
    if (existing.status === 'active') {
      return NextResponse.json({ result: 'already_enrolled' });
    }
    // Reactivate cancelled/past_due
    const { error } = await sb
      .from('axiom_subscribers')
      .update({
        status:     'active',
        name:       name.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('email', normalizedEmail);

    if (error) {
      console.error('[axiom/enroll] reactivate error:', error.message);
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    return NextResponse.json({ result: 'reactivated' });
  }

  // New enrollment
  const { error } = await sb.from('axiom_subscribers').insert({
    email:      normalizedEmail,
    name:       name.trim(),
    tier:       credentialToTier(credential),
    role:       'subscriber',
    status:     'active',
  });

  if (error) {
    console.error('[axiom/enroll] insert error:', error.message);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ result: 'enrolled' });
}
