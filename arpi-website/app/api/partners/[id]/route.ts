// app/api/partners/[id]/route.ts
// Public GET endpoint: returns a single approved CELP® partner by numeric id.
// Includes website + linkedin (voluntarily public-facing) but not email/phone.
// Returns 404 if not found or not approved.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const numericId = Number(id)
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  try {
    const supabase = admin()

    const { data, error } = await supabase
      .from('celp_partners')
      .select(
        'id, role_id, role_label, first_name, last_name, organization, city, state, zip, lat, lng, clients_per_year, referral_direction, about, website, linkedin'
      )
      .eq('id', numericId)
      .eq('status', 'approved')
      .maybeSingle()

    if (error) {
      console.error('[api/partners/[id]] fetch error:', error.message)
      return NextResponse.json({ error: 'Could not load partner.' }, { status: 500 })
    }

    if (!data) {
      return NextResponse.json({ error: 'Not found.' }, { status: 404 })
    }

    return NextResponse.json({ partner: data })
  } catch (err) {
    console.error('[api/partners/[id]] unexpected error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
