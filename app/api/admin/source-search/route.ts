/**
 * GET /api/admin/source-search?q=...&limit=8
 *
 * Dual-mode source lookup for KB reviewers:
 *  - If q looks like a section number (e.g. "RS 00615.201", "HI 01194.110"),
 *    do an exact/prefix match on section_number.
 *  - Otherwise run a full-text keyword search on full_text.
 *
 * Returns section_number, title, source_type, source_url, and a short snippet.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createSessionClient, createServiceClient } from '@/lib/supabase';

const SECTION_RE = /^[A-Z]{2,4}\s*\d{5}[\d.]*/i;

function cleanTitle(raw: string): string {
  // Strip the boilerplate "SSA - POMS: XX XXXXX.XXX - " prefix and date suffix
  return raw
    .replace(/^SSA\s*-\s*POMS:\s*/i, '')
    .replace(/\s*-\s*\d{2}\/\d{2}\/\d{4}\s*$/, '')
    .replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .trim();
}

function snippet(text: string, maxLen = 220): string {
  if (!text) return '';
  // Skip past the boilerplate header (first ~300 chars of POMS pages)
  const start = text.indexOf('Skip to content');
  const body = start > -1 ? text.slice(start + 300) : text;
  return body.replace(/\s+/g, ' ').trim().slice(0, maxLen) + '…';
}

export async function GET(req: NextRequest) {
  const supabase = await createSessionClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get('q')?.trim() ?? '';
  const limit = Math.min(Number(req.nextUrl.searchParams.get('limit') ?? '8'), 20);

  if (!q || q.length < 2) return NextResponse.json({ results: [] });

  const svc = createServiceClient();

  let results: any[] = [];

  if (SECTION_RE.test(q)) {
    // ── Exact / prefix section number match ───────────────────────────────
    const normalized = q.replace(/\s+/g, ' ').toUpperCase();
    const { data } = await svc
      .from('source_documents')
      .select('section_number, title, source_type, source_url, full_text')
      .ilike('section_number', `${normalized}%`)
      .is('superseded_at', null)
      .eq('doc_kind', 'rule')
      .order('section_number')
      .limit(limit);
    results = data ?? [];
  } else {
    // ── Full-text keyword search ───────────────────────────────────────────
    const { data } = await svc
      .from('source_documents')
      .select('section_number, title, source_type, source_url, full_text')
      .is('superseded_at', null)
      .eq('doc_kind', 'rule')
      .textSearch('full_text', q, { type: 'plain', config: 'english' })
      .limit(limit);
    results = data ?? [];
  }

  const formatted = results.map(r => ({
    section_number: r.section_number,
    title:         cleanTitle(r.title ?? ''),
    source_type:   r.source_type,
    source_url:    r.source_url,
    snippet:       snippet(r.full_text ?? ''),
    // First ~4000 chars of full text for use in re-draft context
    full_text_excerpt: (r.full_text ?? '').slice(0, 4000),
  }));

  return NextResponse.json({ results: formatted });
}
