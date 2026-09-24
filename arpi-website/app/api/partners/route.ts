// app/api/partners/route.ts
// Public GET endpoint: returns all approved CELP® partners from celp_partners.
// Returns only public-safe fields (no email, phone, website, linkedin, edit_token).
// Service role key used server-side for a direct read; the response is public.

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  try {
    const supabase = admin()

    const { data, error } = await supabase
      .from('celp_partners')
      .select(
        'id, role_id, role_label, first_name, last_name, organization, street_address, city, state, zip, lat, lng, clients_per_year, referral_direction, about'
      )
      .eq('status', 'approved')
      .not('approved_at', 'is', null)  // exclude seed/sample records
      .order('organization', { ascending: true })

    if (error) {
      console.error('[api/partners] fetch error:', error.message)
      return NextResponse.json({ error: 'Could not load partners.' }, { status: 500 })
    }

    return NextResponse.json({ partners: data ?? [] })
  } catch (err) {
    console.error('[api/partners] unexpected error:', err)
    return NextResponse.json({ error: 'Server error.' }, { status: 500 })
  }
}
