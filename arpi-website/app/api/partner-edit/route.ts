import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getZipCoords } from '@/lib/zipcodes'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// GET /api/partner-edit?token=<uuid>
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  if (!token) {
    return NextResponse.json({ error: 'Token is required.' }, { status: 400 })
  }

  const supabase = adminClient()
  const { data: partner, error } = await supabase
    .from('celp_partners')
    .select('id, role_id, role_label, first_name, last_name, email, phone, organization, street_address, website, city, state, zip, clients_per_year, referral_direction, about, linkedin, status')
    .eq('edit_token', token)
    .in('status', ['approved', 'pending'])
    .maybeSingle()

  if (error) {
    console.error('partner-edit GET error:', error)
    return NextResponse.json({ error: 'Could not load listing.' }, { status: 500 })
  }

  if (!partner) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  return NextResponse.json({ ok: true, partner })
}

// POST /api/partner-edit — update editable fields
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token, ...fields } = body

    if (!token) {
      return NextResponse.json({ error: 'Token is required.' }, { status: 400 })
    }

    const supabase = adminClient()

    // Verify token exists and is for an active listing
    const { data: existing, error: lookupErr } = await supabase
      .from('celp_partners')
      .select('id, status')
      .eq('edit_token', token)
      .in('status', ['approved', 'pending'])
      .maybeSingle()

    if (lookupErr || !existing) {
      return NextResponse.json({ error: 'Listing not found or no longer active.' }, { status: 404 })
    }

    // Geocode updated zip if provided
    let coords: { lat: number; lng: number } | null = null
    if (fields.zip) {
      coords = getZipCoords(fields.zip)
    }

    // Build update payload — only editable fields (role is locked)
    const update: Record<string, unknown> = {}
    const editable = ['first_name', 'last_name', 'phone', 'organization', 'street_address', 'website', 'city', 'state', 'zip', 'clients_per_year', 'referral_direction', 'about', 'linkedin']
    for (const key of editable) {
      if (fields[key] !== undefined) {
        update[key] = typeof fields[key] === 'string' ? fields[key].trim() : fields[key]
      }
    }
    if (coords) {
      update.lat = coords.lat
      update.lng = coords.lng
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: 'No fields to update.' }, { status: 400 })
    }

    const { error: updateErr } = await supabase
      .from('celp_partners')
      .update(update)
      .eq('id', existing.id)

    if (updateErr) {
      console.error('partner-edit POST error:', updateErr)
      return NextResponse.json({ error: 'Could not save changes.' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    console.error('partner-edit POST exception:', err)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
