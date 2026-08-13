/**
 * POST /api/axiom-reviewer
 * Sets the axiom_reviewer cookie after the user selects their name.
 * Requires axiom_access cookie to already be valid.
 */
import { NextRequest, NextResponse } from 'next/server';

const VALID_REVIEWERS = [
  'Jason Stanley',
  'Cindi Hill',
  'Todd Valles',
  'Jim Blair',
  'Travis Stanley',
];

export async function POST(req: NextRequest) {
  const correct = process.env.AXIOM_PASSWORD;

  // Must already have password access
  const access = req.cookies.get('axiom_access');
  if (!correct || access?.value !== correct) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { reviewer_name } = await req.json();
  if (!reviewer_name || !VALID_REVIEWERS.includes(reviewer_name)) {
    return NextResponse.json({ error: 'Invalid reviewer' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set('axiom_reviewer', reviewer_name, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: '/',
  });
  return res;
}
