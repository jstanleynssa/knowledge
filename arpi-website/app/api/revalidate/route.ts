/**
 * POST /api/revalidate
 *
 * On-demand ISR revalidation for the home page blog roll.
 * Called by the blog admin whenever a post is published.
 *
 * Body: { token: string, paths?: string[] }
 * Defaults to revalidating "/" and "/blog" when paths is omitted.
 */

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const ALLOWED_PATHS = ['/', '/blog']

export async function POST(req: NextRequest) {
  try {
    const { token, paths } = await req.json() as { token?: string; paths?: string[] }

    if (!token || token !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const targets: string[] = Array.isArray(paths)
      ? paths.filter(p => ALLOWED_PATHS.includes(p))
      : ALLOWED_PATHS

    for (const path of targets) {
      revalidatePath(path)
    }

    return NextResponse.json({ ok: true, revalidated: targets })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
