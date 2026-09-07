'use client';

import { useState, useTransition, useCallback, useEffect, useRef, CSSProperties } from 'react';
import type { ReferencePage, BodySection, FaqItem, WorkedExample, ReferenceComponent } from '@/lib/types';
import { ReferencePageComponent } from '@/components/ReferencePage';
import { saveDraft, saveAndApprove, supersedePageAction, deletePage, sendBackToReview, type EditableFields } from '../actions';
import { RichTextEditor } from '@/components/RichTextEditor';

// ─── Design tokens (match members app) ───────────────────────────────────────
const NSSA = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' };
const IRMAA = { dark: '#AF2A35' };
const G = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };

// ─── Types ────────────────────────────────────────────────────────────────────

function toEditState(page: ReferencePage): EditableFields {
  return {
    title:            page.title ?? '',
    h1:               page.h1 ?? '',
    seo_title:        page.seo_title ?? '',
    meta_description: page.meta_description ?? '',
    eyebrow:          page.eyebrow ?? '',
    quick_answer:     page.quick_answer ?? '',
    body_sections:    page.body_sections ?? [],
    worked_example:   page.worked_example ?? null,
    faq:              page.faq ?? [],
    primary_sources:  page.primary_sources ?? [],
    reviewer:         page.reviewer ?? '',
    deprecation_note: page.deprecation_note ?? '',
  };
}

// ─── Main component ───────────────────────────────────────────────────────────

// ─── FaqCrossRef ────────────────────────────────────────────────────────────

function FaqCrossRef({ item, onChange }: {
  item: FaqItem;
  onChange: (updates: Partial<FaqItem>) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; slug: string; category: string; eyebrow: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const G2 = { border: '#e5e7eb', text: '#6b7280' };

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/codex/api/admin/page-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.pages ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, [query]);

  if (item.ref_page_id) {
    return (
      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1E40AF' }}>🔗 {item.ref_page_title}</div>
        <button
          onClick={() => onChange({ ref_page_id: undefined, ref_page_slug: undefined, ref_page_title: undefined, ref_page_category: undefined })}
          style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
        >✕ Remove</button>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search for a related page…"
        style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${G2.border}`, fontSize: 13, color: '#111', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
      />
      {searching && <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 11, color: G2.text }}>Searching…</span>}
      {results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${G2.border}`, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 200, overflowY: 'auto', marginTop: 2 }}>
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onChange({ ref_page_id: p.id, ref_page_slug: p.slug, ref_page_title: p.title, ref_page_category: p.category }); setQuery(''); setResults([]); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${G2.border}`, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.title}</div>
              <div style={{ fontSize: 11, color: G2.text, marginTop: 1 }}>{p.eyebrow ?? p.category}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── ComponentEditor ────────────────────────────────────────────────────────

function ComponentEditor({ section, onChange }: {
  section: BodySection;
  onChange: (updates: Partial<BodySection>) => void;
}) {
  const [components, setComponents] = useState<ReferenceComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const G2 = { border: '#e5e7eb', bg: '#f9fafb', text: '#6b7280' };

  useEffect(() => {
    fetch('/codex/api/admin/components')
      .then(r => r.json())
      .then(d => setComponents(d.components ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selected = components.find(c => c.key === section.component_key);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G2.text, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Reusable Component</label>
        {loading ? (
          <div style={{ fontSize: 13, color: G2.text }}>Loading components…</div>
        ) : (
          <select
            value={section.component_key ?? ''}
            onChange={e => onChange({ component_key: e.target.value || undefined })}
            style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: `1px solid ${G2.border}`, fontSize: 14, color: '#111', background: '#fff', fontFamily: 'inherit', cursor: 'pointer' }}
          >
            <option value=''>— Select a component —</option>
            {components.map(c => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        )}
      </div>

      {selected && (() => {
        const content = selected.content as unknown as Record<string, unknown>;
        const isTable = content.type === 'table';
        return (
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '12px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#166534' }}>📦 Preview</span>
              <code style={{ fontSize: 11, background: '#DCFCE7', padding: '1px 6px', borderRadius: 3, color: '#166534' }}>{selected.key}</code>
            </div>
            {selected.description && (
              <div style={{ fontSize: 12, color: '#166534', marginBottom: 8 }}>{selected.description}</div>
            )}
            {isTable && Array.isArray(content.headers) && Array.isArray(content.rows) && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: '#DCFCE7' }}>
                      {(content.headers as string[]).map((h, i) => (
                        <th key={i} style={{ padding: '5px 10px', textAlign: 'left', borderBottom: '2px solid #BBF7D0', fontWeight: 700, color: '#166534', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(content.rows as string[][]).map((row, ri) => (
                      <tr key={ri} style={{ borderBottom: '1px solid #DCFCE7' }}>
                        {row.map((cell, ci) => (
                          <td key={ci} style={{ padding: '4px 10px', color: '#1F2937' }}>{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })()}

      {!selected && section.component_key && (
        <div style={{ fontSize: 13, color: '#DC2626' }}>⚠️ Component &ldquo;{section.component_key}&rdquo; not found.</div>
      )}
    </div>
  );
}

// ─── CrossRefEditor ─────────────────────────────────────────────────────────

function CrossRefEditor({ section, onChange }: {
  section: BodySection;
  onChange: (updates: Partial<BodySection>) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; title: string; slug: string; category: string; eyebrow: string | null }>>([]);
  const [searching, setSearching] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/codex/api/admin/page-search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.pages ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 300);
  }, [query]);

  const G2 = { border: '#e5e7eb', bg: '#f9fafb', text: '#6b7280' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <FormRow label="Section heading">
        <FInput value={section.heading} onChange={v => onChange({ heading: v })} placeholder="e.g. Related: IRMAA Income Thresholds" />
      </FormRow>
      <FormRow label="Context note (shown to reader)">
        <FInput
          value={section.ref_context ?? ''}
          onChange={v => onChange({ ref_context: v })}
          placeholder="e.g. For the full threshold tables, see our dedicated reference page."
        />
      </FormRow>

      {section.ref_page_id ? (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#1E40AF' }}>{section.ref_page_title}</div>
            <div style={{ fontSize: 11, color: G2.text, marginTop: 2 }}>{section.ref_page_category}/{section.ref_page_slug}</div>
          </div>
          <button
            onClick={() => onChange({ ref_page_id: undefined, ref_page_slug: undefined, ref_page_title: undefined, ref_page_category: undefined })}
            style={{ fontSize: 12, color: '#DC2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >✕ Remove</button>
        </div>
      ) : (
        <FormRow label="Search for a page to reference">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Type a page title or topic…"
              style={{ width: '100%', padding: '7px 10px', borderRadius: 6, border: `1px solid ${G2.border}`, fontSize: 13, color: '#111', background: '#fff', boxSizing: 'border-box', fontFamily: 'inherit' }}
            />
            {searching && <span style={{ position: 'absolute', right: 10, top: 8, fontSize: 11, color: G2.text }}>Searching…</span>}
            {results.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: `1px solid ${G2.border}`, borderRadius: 6, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, maxHeight: 220, overflowY: 'auto', marginTop: 2 }}>
                {results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onChange({ ref_page_id: p.id, ref_page_slug: p.slug, ref_page_title: p.title, ref_page_category: p.category });
                      setQuery('');
                      setResults([]);
                    }}
                    style={{ display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', borderBottom: `1px solid ${G2.border}`, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111' }}>{p.title}</div>
                    <div style={{ fontSize: 11, color: G2.text, marginTop: 1 }}>{p.eyebrow ?? p.category} · /{p.slug}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FormRow>
      )}
    </div>
  );
}

export function ReviewEditor({
  page,
  reviewerName,
  initialComponents = {},
}: {
  page: ReferencePage;
  reviewerName: string;
  initialComponents?: Record<string, ReferenceComponent>;
}) {
  const [fields, setFields] = useState<EditableFields>(() => ({
    ...toEditState(page),
    // Always credit the logged-in reviewer - not a manual entry
    reviewer: reviewerName,
  }));
  // Components map passed from server — no client fetch needed
  const resolvedComponents = initialComponents;
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const isSaving = useRef(false);
  const isDirty = useRef(false);
  const [showSuperseded, setShowSuperseded] = useState(false);
  const [sectionFeedback, setSectionFeedback] = useState<Record<number, { type: 'verified' | 'flag'; note?: string }>>({});
  const [faqFeedback, setFaqFeedback] = useState<Record<number, { type: 'verified' | 'flag'; note?: string }>>({}); 
  const [rewritingSection, setRewritingSection] = useState<Record<number, boolean>>({});
  const [sectionLearned, setSectionLearned] = useState<Record<number, string>>({});
  const [sectionExistingFeedback, setSectionExistingFeedback] = useState<Record<number, { type: 'verified' | 'flag'; reviewer_name: string; created_at: string; note?: string | null }>>({}); 
  const [rewritingFaq, setRewritingFaq]       = useState<Record<number, boolean>>({});
  const [faqLearned, setFaqLearned]           = useState<Record<number, string>>({});
  const [faqExistingFeedback, setFaqExistingFeedback] = useState<Record<number, { type: 'verified' | 'flag'; reviewer_name: string; created_at: string; note?: string | null }>>({}); 
  // Related-FAQ suggestion state
  const [relatedFaqs, setRelatedFaqs] = useState<Array<{ index: number; q: string; a: string; reason: string }>>([]);
  const [relatedFaqNote, setRelatedFaqNote] = useState<string>('');
  const [applyingRelated, setApplyingRelated] = useState<Record<number, boolean>>({});

  // ── Load existing section feedback on mount ────────────────────
  useEffect(() => {
    fetch(`/api/admin/section-feedback?page_id=${page.id}`)
      .then(r => r.json())
      .then(data => {
        if (!data.ok) return;
        const bodyMap: Record<number, { type: 'verified' | 'flag'; reviewer_name: string; created_at: string; note?: string | null }> = {};
        const faqMap:  Record<number, { type: 'verified' | 'flag'; reviewer_name: string; created_at: string; note?: string | null }> = {};
        for (const row of data.feedback ?? []) {
          const entry = { type: row.feedback_type, reviewer_name: row.reviewer_name, created_at: row.created_at, note: row.note ?? null };
          if (row.section_type === 'body') bodyMap[row.section_index] = entry;
          if (row.section_type === 'faq')  faqMap[row.section_index]  = entry;
        }
        setSectionExistingFeedback(bodyMap);
        setFaqExistingFeedback(faqMap);
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page.id]);

  // ── Warn before unload if there are unsaved changes ──────────────────
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // ── Autosave: debounce 3s after any field change ─────────────────────
  useEffect(() => {
    // Skip the initial mount — don't save when the page first loads
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    // Mark dirty whenever fields change
    isDirty.current = true;
    // Don’t queue an autosave while a manual save or approve is in progress
    if (isSaving.current || isPending) return;

    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('idle');

    autoSaveTimer.current = setTimeout(async () => {
      if (isSaving.current || isPending) return;
      isSaving.current = true;
      setAutoSaveStatus('saving');
      try {
        await saveDraft(page.id, fields);
        isDirty.current = false;
        setAutoSaveStatus('saved');
        // Fade back to idle after 2s
        setTimeout(() => setAutoSaveStatus('idle'), 2000);
      } catch {
        setAutoSaveStatus('idle');
      } finally {
        isSaving.current = false;
      }
    }, 3000);

    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields]);

  function persistFeedback(sectionType: 'body' | 'faq', index: number, type: 'verified' | 'flag', note?: string) {
    const section = sectionType === 'body' ? fields.body_sections[index] : null;
    fetch('/codex/api/admin/section-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        page_id:         page.id,
        page_slug:       page.slug,
        page_title:      page.title,
        section_type:    sectionType,
        section_index:   index,
        section_heading: section?.heading ?? (sectionType === 'faq' ? `FAQ ${index + 1}` : null),
        feedback_type:   type,
        note:            note ?? null,
      }),
    }).catch(() => {});
  }

  async function handleSectionFeedback(index: number, type: 'verified' | 'flag', note?: string) {
    setSectionFeedback(prev => ({ ...prev, [index]: { type, note } }));
    // Update existing feedback display immediately so the "verified by" line shows without reload
    setSectionExistingFeedback(prev => ({
      ...prev,
      [index]: { type, reviewer_name: reviewerName, created_at: new Date().toISOString(), note: note ?? null },
    }));
    persistFeedback('body', index, type, note);

    // For suggestions: call the rewrite API and update the section on the left
    if (type === 'flag' && note?.trim()) {
      const section = fields.body_sections[index];
      if (!section || section.type === 'table') return; // tables not auto-rewritten yet

      setRewritingSection(prev => ({ ...prev, [index]: true }));
      try {
        const res = await fetch('/codex/api/admin/rewrite-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            heading:     section.heading,
            prose:       section.prose,
            note,
            page_title:  page.title,
            category:    page.category,
            citation_ref: section.citation_ref,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          set('body_sections', fields.body_sections.map((s, i) =>
            i === index ? { ...s, heading: data.heading, prose: data.prose } : s
          ));
          if (data.learned) {
            setSectionLearned(prev => ({ ...prev, [index]: data.learned }));
          }
        }
      } catch (e) {
        console.error('rewrite-section failed:', e);
      } finally {
        setRewritingSection(prev => ({ ...prev, [index]: false }));
      }
    }
  }

  async function handleFaqFeedback(index: number, type: 'verified' | 'flag', note?: string) {
    setFaqFeedback(prev => ({ ...prev, [index]: { type, note } }));
    setFaqExistingFeedback(prev => ({
      ...prev,
      [index]: { type, reviewer_name: reviewerName, created_at: new Date().toISOString() },
    }));
    persistFeedback('faq', index, type, note);

    // Auto-rewrite the FAQ answer on suggestion
    if (type === 'flag' && note?.trim()) {
      const faqItem = fields.faq[index];
      if (!faqItem) return;
      setRewritingFaq(prev => ({ ...prev, [index]: true }));
      // Clear any previous related-FAQ suggestion
      setRelatedFaqs([]);
      setRelatedFaqNote(note);
      try {
        const [rewriteRes, relatedRes] = await Promise.all([
          fetch('/codex/api/admin/rewrite-section', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              heading:    faqItem.q,
              prose:      faqItem.a,
              note,
              page_title: page.title,
              category:   page.category,
            }),
          }),
          fetch('/codex/api/admin/find-related-faqs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              flagged_index:    index,
              flagged_question: faqItem.q,
              flagged_answer:   faqItem.a,
              note,
              page_title:       page.title,
              all_faqs:         fields.faq.map((f, i) => ({ index: i, q: f.q, a: f.a })),
            }),
          }),
        ]);

        const rewriteData = await rewriteRes.json();
        if (rewriteData.ok) {
          set('faq', fields.faq.map((f, i) =>
            i === index ? { ...f, a: rewriteData.prose } : f
          ));
          if (rewriteData.learned) setFaqLearned(prev => ({ ...prev, [index]: rewriteData.learned }));
        }

        const relatedData = await relatedRes.json();
        if (Array.isArray(relatedData.related) && relatedData.related.length > 0) {
          setRelatedFaqs(relatedData.related);
        }
      } catch (e) {
        console.error('faq rewrite failed:', e);
      } finally {
        setRewritingFaq(prev => ({ ...prev, [index]: false }));
      }
    }
  }

  // Apply the same feedback note + rewrite to a related FAQ
  async function applyFeedbackToRelated(related: { index: number; q: string; a: string; reason: string }) {
    setApplyingRelated(prev => ({ ...prev, [related.index]: true }));
    try {
      persistFeedback('faq', related.index, 'flag', relatedFaqNote);
      setFaqFeedback(prev => ({ ...prev, [related.index]: { type: 'flag', note: relatedFaqNote } }));
      setFaqExistingFeedback(prev => ({
        ...prev,
        [related.index]: { type: 'flag', reviewer_name: reviewerName, created_at: new Date().toISOString() },
      }));

      const res = await fetch('/codex/api/admin/rewrite-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          heading:    related.q,
          prose:      related.a,
          note:       relatedFaqNote,
          page_title: page.title,
          category:   page.category,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        set('faq', fields.faq.map((f, i) =>
          i === related.index ? { ...f, a: data.prose } : f
        ));
        if (data.learned) setFaqLearned(prev => ({ ...prev, [related.index]: data.learned }));
      }
      // Remove from the suggestion list once applied
      setRelatedFaqs(prev => prev.filter(r => r.index !== related.index));
    } catch (e) {
      console.error('apply-related failed:', e);
    } finally {
      setApplyingRelated(prev => ({ ...prev, [related.index]: false }));
    }
  }
  const [supersededNote, setSupersededNote] = useState(page.deprecation_note ?? '');

  const set = useCallback(<K extends keyof EditableFields>(key: K, val: EditableFields[K]) => {
    setFields(f => ({ ...f, [key]: val }));
  }, []);

  // Inject SOURCE GAP markers into body sections for any values flagged by the verification gate.
  // This surfaces them inline (red block at the source citation) rather than only in a top banner.
  const verificationFlags: Array<{ value: string; context: string; found_in_uncited?: string }> =
    (page as any).draft_metadata?.verification?.unverified ?? [];

  // Track which flagged values were actually matched in current text so the banner
  // can fall back to listing them directly when they've been edited out of the prose.
  const matchedFlagValues = new Set<string>();

  const bodySectionsWithFlags = fields.body_sections.map(section => {
    if (verificationFlags.length === 0) return section;
    const hits = verificationFlags.filter(u =>
      section.prose.toLowerCase().includes(u.value.toLowerCase().replace(/,\s*$/, ''))
    );
    if (hits.length === 0) return section;
    hits.forEach(u => matchedFlagValues.add(u.value));
    const gapNote = hits.map(u => `\u201c${u.value}\u201d not verified against cited source`).join('; ');
    return { ...section, prose: section.prose + ` [SOURCE GAP: ${gapNote}]` };
  });

  // Build the live-preview page object from current form state
  // Also inject gaps into quick_answer if flagged values appear there
  const quickAnswerWithFlags = (() => {
    const hits = verificationFlags.filter(u =>
      fields.quick_answer.toLowerCase().includes(u.value.toLowerCase().replace(/,\s*$/, ''))
    );
    if (hits.length === 0) return fields.quick_answer;
    hits.forEach(u => matchedFlagValues.add(u.value));
    const gapNote = hits.map(u => `\u201c${u.value}\u201d not verified against cited source`).join('; ');
    return fields.quick_answer + ` [SOURCE GAP: ${gapNote}]`;
  })();

  // Flags that didn't match anywhere in the current text (e.g. edited out after verification ran)
  const unmatchedFlags = verificationFlags.filter(u => !matchedFlagValues.has(u.value));

  const previewPage: ReferencePage = {
    ...page,
    ...fields,
    quick_answer:     quickAnswerWithFlags,
    body_sections:    bodySectionsWithFlags,
    eyebrow:          fields.eyebrow || null,
    worked_example:   fields.worked_example || null,
    reviewer:         fields.reviewer || null,
    deprecation_note: fields.deprecation_note || null,
  };

  const catColor = page.category === 'irmaa' ? IRMAA.dark : NSSA.dark;
  const HEADER_H = 56;

  // ─── Actions ───────────────────────────────────────────────────────────────

  function handleSave() {
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    isSaving.current = true;
    setSaveStatus('saving');
    startTransition(async () => {
      try {
        await saveDraft(page.id, fields);
        isDirty.current = false;
        setSaveStatus('saved');
        setAutoSaveStatus('idle');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (e) {
        setSaveStatus('error');
        alert('Save failed: ' + (e as Error).message);
      } finally {
        isSaving.current = false;
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await saveAndApprove(page.id, fields);
        isDirty.current = false;
        if (page.status === 'published') {
          // Already published — re-publishing an update. Stay on the page so the
          // editor can keep working. Full reload to get fresh server data.
          window.location.reload();
        } else {
          // First-time approval: go to queue so the next page can be reviewed.
          window.location.href = '/codex/admin/kb-review';
        }
      } catch (e) {
        alert('Approve failed: ' + (e as Error).message);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`Permanently delete "${page.title}"? This cannot be undone.`)) return;
    startTransition(async () => {
      try {
        await deletePage(page.id);
        isDirty.current = false;
        window.location.href = '/codex/admin/kb-review';
      } catch (e) {
        alert('Delete failed: ' + (e as Error).message);
      }
    });
  }

  function handleSendBackToReview() {
    if (!confirm('Send this page back to review? It will be unpublished and appear in the Needs Review queue.')) return;
    startTransition(async () => {
      try {
        await sendBackToReview(page.id);
        isDirty.current = false;
        window.location.href = '/codex/admin/kb-review';
      } catch (e) {
        alert('Failed: ' + (e as Error).message);
      }
    });
  }

  function handleSupersede() {
    startTransition(async () => {
      try {
        await supersedePageAction(page.id, supersededNote);
        isDirty.current = false;
        window.location.href = '/codex/admin/kb-review';
      } catch (e) {
        alert('Failed: ' + (e as Error).message);
      }
    });
  }

  // ─── Body section helpers ──────────────────────────────────────────────────
  const updateSection = (i: number, keyOrUpdates: keyof BodySection | Partial<BodySection>, val?: string) =>
    set('body_sections', fields.body_sections.map((s, idx) =>
      idx === i
        ? (typeof keyOrUpdates === 'object' ? { ...s, ...keyOrUpdates } : { ...s, [keyOrUpdates]: val })
        : s
    ));
  const insertSection = (afterIndex: number) => {
    const next = [...fields.body_sections];
    next.splice(afterIndex + 1, 0, { type: 'prose' as const, heading: '', prose: '', citation_ref: '' });
    set('body_sections', next);
  };
  const insertTable = (afterIndex: number) => {
    const next = [...fields.body_sections];
    next.splice(afterIndex + 1, 0, {
      type: 'table' as const,
      heading: '',
      prose: '',
      citation_ref: '',
      headers: ['Column 1', 'Column 2', 'Column 3'],
      rows: [['', '', ''], ['', '', '']],
    });
    set('body_sections', next);
  };
  // Keep addSection/addTable for the bottom "first add" buttons
  const addSection   = () => insertSection(fields.body_sections.length - 1);
  const addTable     = () => insertTable(fields.body_sections.length - 1);
  function insertCrossRef(afterIndex: number) {
    const next = [...fields.body_sections];
    next.splice(afterIndex + 1, 0, { type: 'crossref' as const, heading: 'Related Page', prose: '' });
    set('body_sections', next);
  }
  const addCrossRef  = () => insertCrossRef(fields.body_sections.length - 1);
  function insertComponent(afterIndex: number) {
    const next = [...fields.body_sections];
    next.splice(afterIndex + 1, 0, { type: 'component' as const, heading: '', prose: '', component_key: '' });
    set('body_sections', next);
  }
  const addComponent = () => insertComponent(fields.body_sections.length - 1);
  const removeSection = (i: number) =>
    set('body_sections', fields.body_sections.filter((_, idx) => idx !== i));

  const moveSection = (i: number, dir: -1 | 1) => {
    const next = [...fields.body_sections];
    const target = i + dir;
    if (target < 0 || target >= next.length) return;
    [next[i], next[target]] = [next[target], next[i]];
    set('body_sections', next);
  };

  const updateTableHeader = (si: number, ci: number, val: string) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      const headers = [...(s.headers ?? [])];
      headers[ci] = val;
      return { ...s, headers };
    });
    set('body_sections', sections);
  };

  const updateTableCell = (si: number, ri: number, ci: number, val: string) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      const rows = (s.rows ?? []).map((row, ridx) =>
        ridx === ri ? row.map((cell, cidx) => cidx === ci ? val : cell) : row
      );
      return { ...s, rows };
    });
    set('body_sections', sections);
  };

  const addTableRow = (si: number) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      const cols = (s.headers ?? []).length || 3;
      return { ...s, rows: [...(s.rows ?? []), Array(cols).fill('')] };
    });
    set('body_sections', sections);
  };

  const removeTableRow = (si: number, ri: number) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      return { ...s, rows: (s.rows ?? []).filter((_, ridx) => ridx !== ri) };
    });
    set('body_sections', sections);
  };

  const addTableCol = (si: number) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      const headers = [...(s.headers ?? []), `Column ${(s.headers ?? []).length + 1}`];
      const rows = (s.rows ?? []).map(row => [...row, '']);
      return { ...s, headers, rows };
    });
    set('body_sections', sections);
  };

  const removeTableCol = (si: number, ci: number) => {
    const sections = fields.body_sections.map((s, idx) => {
      if (idx !== si) return s;
      const headers = (s.headers ?? []).filter((_, hidx) => hidx !== ci);
      const rows = (s.rows ?? []).map(row => row.filter((_, cidx) => cidx !== ci));
      return { ...s, headers, rows };
    });
    set('body_sections', sections);
  };

  const updateFaq = (i: number, key: 'q' | 'a', val: string) =>
    set('faq', fields.faq.map((f, idx) => idx === i ? { ...f, [key]: val } : f));
  const addFaq = () => set('faq', [...fields.faq, { q: '', a: '' }]);
  const removeFaq = (i: number) => set('faq', fields.faq.filter((_, idx) => idx !== i));

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif', minHeight: '100vh', background: G.bg }}>

      {/* ── Superseded modal ─────────────────────────────────────────────── */}
      {showSuperseded && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 520, margin: '0 16px', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontWeight: 700, fontSize: 17, color: '#7F1D1D', marginBottom: 8 }}>⚠️ Mark as Superseded</div>
            <p style={{ fontSize: 14, color: G.text, marginBottom: 16, lineHeight: 1.5 }}>
              This adds a prominent banner to the public page stating this rule is no longer in effect.
              The page remains published for reference. Describe why below - this note is shown publicly.
            </p>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: G.text, marginBottom: 6 }}>
              Deprecation note (shown on the public page)
            </label>
            <textarea
              value={supersededNote}
              onChange={e => setSupersededNote(e.target.value)}
              rows={3}
              placeholder="e.g. This rule was repealed by the Social Security Fairness Act of 2023, effective January 2024, and is listed here for posterity."
              style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: `1px solid ${G.border}`, fontFamily: 'inherit', fontSize: 14, resize: 'vertical', boxSizing: 'border-box', marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSuperseded(false)} style={secondaryBtn}>Cancel</button>
              <button onClick={handleSupersede} disabled={isPending} style={{ ...primaryBtn, background: '#7F1D1D' }}>
                {isPending ? 'Saving...' : 'Mark Superseded'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: NSSA.dark, color: '#fff',
        height: HEADER_H,
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
      }}>
        {/* Left: breadcrumb + title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <a href="/admin/kb-review" style={{ color: NSSA.light, textDecoration: 'none', fontSize: 14, flexShrink: 0 }}>← Queue</a>
          <a href="/admin/my-feedback" style={{ color: NSSA.light, textDecoration: 'none', fontSize: 13, flexShrink: 0, opacity: 0.8 }}>My Feedback</a>
          <span style={{ color: '#4a7fa0' }}>·</span>
          <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 15 }}>
            {fields.title || page.title}
          </span>
          <span style={{
            background: catColor, color: '#fff',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '2px 8px', borderRadius: 4, flexShrink: 0,
          }}>
            {page.category === 'irmaa' ? 'IRMAA' : 'Soc. Sec.'}
          </span>
        </div>

        {/* Right: actions */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0 }}>
          {saveStatus === 'saved' && <span style={{ fontSize: 13, color: '#86efac' }}>✓ Saved</span>}
          {saveStatus === 'error' && <span style={{ fontSize: 13, color: '#f87171' }}>Save failed</span>}
          {autoSaveStatus === 'saving' && <span style={{ fontSize: 12, color: '#93C5FD', opacity: 0.8 }}>Autosaving…</span>}
          {autoSaveStatus === 'saved'  && <span style={{ fontSize: 12, color: '#86efac', opacity: 0.8 }}>✓ Autosaved</span>}

          <a
            href={`/preview/${page.id}`}
            target="_blank"
            rel="noopener"
            style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}
          >
            Full preview ↗
          </a>

          {page.status === 'published' && (
            <a
              href={`https://www.nssapros.com/codex/${page.category}/${page.slug}`}
              target="_blank"
              rel="noopener"
              style={{ color: '#86efac', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
            >
              View live ↗
            </a>
          )}

          {/* Delete button removed — use Supabase dashboard if a page must be deleted */}

          {page.status === 'published' && (
            <button
              onClick={handleSendBackToReview}
              disabled={isPending}
              style={{ background: 'transparent', border: '1px solid #D97706', color: '#D97706', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
              title="Unpublish and return to review queue"
            >
              ↩ Needs Review
            </button>
          )}

          <button
            onClick={() => setShowSuperseded(true)}
            disabled={isPending}
            style={{ background: 'transparent', border: '1px solid #F87171', color: '#F87171', borderRadius: 6, padding: '7px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}
          >
            Superseded
          </button>

          <button
            onClick={handleSave}
            disabled={isPending || saveStatus === 'saving'}
            style={{ background: 'transparent', border: `1px solid ${NSSA.light}`, color: NSSA.light, borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
          >
            {saveStatus === 'saving' ? 'Saving...' : 'Save for Later'}
          </button>

          <button
            onClick={handleApprove}
            disabled={isPending}
            style={{ background: '#16a34a', border: 'none', color: '#fff', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            {isPending ? 'Saving...' : '✓ Approve'}
          </button>
        </div>
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: `calc(100vh - ${HEADER_H}px)` }}>

        {/* LEFT - Editable form */}
        <div style={{ overflowY: 'auto', borderRight: `1px solid ${G.border}`, background: '#fff' }}>
          <div style={{ padding: '24px 28px', maxWidth: 640, margin: '0 auto' }}>

            <FieldGroup label="Page Identity">
              <FormRow label="Title (nav / breadcrumb)">
                <FInput value={fields.title} onChange={v => set('title', v)} />
              </FormRow>
              <FormRow label={`H1 heading (live page)${fields.h1 ? '' : ' — falls back to Title'}`}>
                <FInput value={fields.h1} onChange={v => set('h1', v)} placeholder={fields.title || 'Same as Title if blank'} />
              </FormRow>
              <FormRow label={`SEO Title - ${fields.seo_title.length}/60 chars`} warn={fields.seo_title.length > 60}>
                <FInput value={fields.seo_title} onChange={v => set('seo_title', v)} />
              </FormRow>
              <FormRow label={`Meta Description - ${fields.meta_description.length}/160 chars`} warn={fields.meta_description.length > 160}>
                <FTextarea value={fields.meta_description} onChange={v => set('meta_description', v)} rows={2} />
              </FormRow>
              <FormRow label="Eyebrow label (e.g. 'Claiming Rules')">
                <FInput value={fields.eyebrow} onChange={v => set('eyebrow', v)} placeholder="Optional" />
              </FormRow>
            </FieldGroup>

            <FieldGroup label="Quick Answer">
              <RichTextEditor
                value={fields.quick_answer}
                onChange={v => set('quick_answer', v)}
                placeholder="The short answer shown at the top of the page..."
                minHeight={120}
              />
            </FieldGroup>

            <FieldGroup label={`Body Sections (${fields.body_sections.filter(s => !(s as any)._review_note).length})`}>
              {fields.body_sections
                .filter(s => !(s as any)._review_note)
                .map((section, i) => (
                  <div key={i} style={{ background: G.bg, borderRadius: 8, padding: '14px 16px', marginBottom: 10, position: 'relative', opacity: rewritingSection[i] ? 0.6 : 1, transition: 'opacity .2s' }}>
                    {rewritingSection[i] && (
                      <div style={{ position: 'absolute', inset: 0, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, background: 'rgba(243,244,246,0.7)' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: G.text }}>⟳ Applying suggestion…</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={chipLabel}>
                        {section.type === 'table' ? '📊 Table' : section.type === 'crossref' ? '🔗 Cross-Reference' : section.type === 'component' ? '📦 Component' : `Section ${i + 1}`}
                      </span>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button onClick={() => moveSection(i, -1)} disabled={i === 0} style={{ ...removeBtnStyle, color: '#6b7280', fontSize: 15, opacity: i === 0 ? 0.3 : 1 }} title="Move up">↑</button>
                        <button onClick={() => moveSection(i, 1)} disabled={i === fields.body_sections.filter(s => !(s as any)._review_note).length - 1} style={{ ...removeBtnStyle, color: '#6b7280', fontSize: 15, opacity: i === fields.body_sections.filter(s => !(s as any)._review_note).length - 1 ? 0.3 : 1 }} title="Move down">↓</button>
                        <button onClick={() => removeSection(i)} style={removeBtnStyle}>Remove</button>
                      </div>
                    </div>

                    {/* Per-section insert-below strip */}
                    <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                      <button
                        onClick={() => insertSection(i)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: '#fff', border: `1px dashed ${G.border}`, color: G.text, cursor: 'pointer', fontFamily: 'inherit' }}
                      >+ prose below</button>
                      <button
                        onClick={() => insertTable(i)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: '#fff', border: `1px dashed ${G.border}`, color: G.text, cursor: 'pointer', fontFamily: 'inherit' }}>📊 table below</button>
                      <button
                        onClick={() => insertCrossRef(i)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: '#fff', border: `1px dashed ${G.border}`, color: G.text, cursor: 'pointer', fontFamily: 'inherit' }}>🔗 ref below</button>
                      <button
                        onClick={() => insertComponent(i)}
                        style={{ fontSize: 11, padding: '3px 10px', borderRadius: 4, background: '#fff', border: `1px dashed ${G.border}`, color: G.text, cursor: 'pointer', fontFamily: 'inherit' }}>📦 component below</button>
                    </div>

                    {section.type === 'table' ? (
                      /* ── Table editor ── */
                      <>
                        <FormRow label="Table title (shown in header bar)">
                          <FInput value={section.heading} onChange={v => updateSection(i, 'heading', v)} placeholder="e.g. Full Part B Coverage" />
                        </FormRow>

                        {/* Column headers */}
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 4 }}>Column headers</label>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                            {(section.headers ?? []).map((h, ci) => (
                              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: '1 1 120px', minWidth: 100 }}>
                                <input
                                  value={h}
                                  onChange={e => updateTableHeader(i, ci, e.target.value)}
                                  style={{ padding: '6px 8px', borderRadius: 4, border: `1px solid ${G.border}`, fontSize: 12, fontFamily: 'inherit', background: '#fff' }}
                                />
                                {(section.headers ?? []).length > 1 && (
                                  <button onClick={() => removeTableCol(i, ci)} style={{ ...removeBtnStyle, fontSize: 11 }}>✕ col</button>
                                )}
                              </div>
                            ))}
                            <button onClick={() => addTableCol(i)} style={{ ...addBtnStyle, width: 'auto', padding: '6px 12px', fontSize: 12, marginTop: 0 }}>+ Col</button>
                          </div>
                        </div>

                        {/* Rows */}
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: G.text, marginBottom: 4 }}>Rows</label>
                          <div style={{ overflowX: 'auto' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                              <tbody>
                                {(section.rows ?? []).map((row, ri) => (
                                  <tr key={ri}>
                                    {row.map((cell, ci) => (
                                      <td key={ci} style={{ padding: '3px 4px', verticalAlign: 'top' }}>
                                        <input
                                          value={cell}
                                          onChange={e => updateTableCell(i, ri, ci, e.target.value)}
                                          style={{ width: '100%', padding: '5px 7px', borderRadius: 4, border: `1px solid ${G.border}`, fontSize: 12, fontFamily: 'inherit', minWidth: 80, boxSizing: 'border-box' as const }}
                                        />
                                      </td>
                                    ))}
                                    <td style={{ padding: '3px 4px', verticalAlign: 'middle' }}>
                                      <button onClick={() => removeTableRow(i, ri)} style={{ ...removeBtnStyle, fontSize: 11 }}>✕</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          <button onClick={() => addTableRow(i)} style={{ ...addBtnStyle, marginTop: 6, fontSize: 12 }}>+ Add Row</button>
                        </div>

                        <CitationRefsEditor section={section} sectionIndex={i} onUpdate={(idx, updates) => updateSection(idx, updates)} />
                      </>
                    ) : section.type === 'crossref' ? (
                      /* ── Cross-reference section ── */
                      <CrossRefEditor
                        section={section}
                        onChange={(updates) => updateSection(i, updates)}
                      />
                    ) : section.type === 'component' ? (
                      /* ── Component picker ── */
                      <ComponentEditor
                        section={section}
                        onChange={(updates) => updateSection(i, updates)}
                      />
                    ) : (
                      /* ── Prose section ── */
                      <>
                        <FormRow label="Heading">
                          <FInput value={section.heading} onChange={v => updateSection(i, 'heading', v)} />
                        </FormRow>
                        <FormRow label="Prose">
                          <RichTextEditor
                            value={section.prose}
                            onChange={v => updateSection(i, 'prose', v)}
                            placeholder="Write or paste prose here…"
                            minHeight={120}
                          />
                        </FormRow>
                        <CitationRefsEditor section={section} sectionIndex={i} onUpdate={(idx, updates) => updateSection(idx, updates)} />
                      </>
                    )}
                  </div>
                ))}
              {/* Bottom insert buttons - always visible even with 0 sections */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={addSection}   style={{ ...addBtnStyle, flex: 1 }}>+ Add Prose Section</button>
                <button onClick={addTable}     style={{ ...addBtnStyle, flex: 1 }}>📊 Add Table</button>
                <button onClick={addCrossRef}  style={{ ...addBtnStyle, flex: 1 }}>🔗 Add Cross-Reference</button>
                <button onClick={addComponent} style={{ ...addBtnStyle, flex: 1 }}>📦 Add Component</button>
              </div>
            </FieldGroup>

            <FieldGroup label={`FAQ (${fields.faq.length} items)`}>
              {fields.faq.map((item, i) => (
                <div key={i} style={{ background: G.bg, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={chipLabel}>FAQ {i + 1}</span>
                    <button onClick={() => removeFaq(i)} style={removeBtnStyle}>Remove</button>
                  </div>
                  <FormRow label="Question">
                    <FInput value={item.q} onChange={v => updateFaq(i, 'q', v)} />
                  </FormRow>
                  <FormRow label="Answer">
                    <FTextarea value={item.a} onChange={v => updateFaq(i, 'a', v)} rows={3} />
                  </FormRow>
                  <FormRow label="Cross-reference (optional)">
                    <FaqCrossRef
                      item={item}
                      onChange={updates => set('faq', fields.faq.map((f, idx) => idx === i ? { ...f, ...updates } : f))}
                    />
                  </FormRow>
                </div>
              ))}
              <button onClick={addFaq} style={addBtnStyle}>+ Add FAQ item</button>
            </FieldGroup>

            <FieldGroup label="Sources">
              <SourceSearch
                pageSources={fields.primary_sources}
                bodySections={fields.body_sections}
                pageTitle={page.title}
                category={page.category}
                onAddSource={src => {
                  // Append to primary_sources if not already present
                  if (!fields.primary_sources.find((s: any) => s.section_number === src.section_number)) {
                    set('primary_sources', [...fields.primary_sources, { section_number: src.section_number, url: src.source_url, tag: 'Source' }]);
                  }
                }}
                onRedraft={(sectionIndex, src) => {
                  // Add source then re-draft the chosen body section
                  if (!fields.primary_sources.find((s: any) => s.section_number === src.section_number)) {
                    set('primary_sources', [...fields.primary_sources, { section_number: src.section_number, url: src.source_url, tag: 'Source' }]);
                  }
                  const section = fields.body_sections[sectionIndex];
                  if (!section) return;
                  setRewritingSection(prev => ({ ...prev, [sectionIndex]: true }));
                  fetch('/codex/api/admin/rewrite-section', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      heading:      (section as any).heading,
                      prose:        (section as any).prose,
                      note:         null,
                      page_title:   page.title,
                      category:     page.category,
                      citation_ref: src.section_number,
                      extra_source: { section_number: src.section_number, text: src.full_text_excerpt },
                    }),
                  })
                    .then(r => r.json())
                    .then(data => {
                      if (data.ok) {
                        set('body_sections', fields.body_sections.map((s, i) =>
                          i === sectionIndex ? { ...s, prose: data.prose, citation_ref: src.section_number } : s
                        ));
                        if (data.learned) setSectionLearned(prev => ({ ...prev, [sectionIndex]: data.learned }));
                      }
                    })
                    .catch(e => console.error('redraft failed:', e))
                    .finally(() => setRewritingSection(prev => ({ ...prev, [sectionIndex]: false })));
                }}
              />
            </FieldGroup>

            <FieldGroup label="Attribution">
              <FormRow label="Reviewing as">
                <div style={{
                  padding: '8px 10px', borderRadius: 6,
                  border: `1px solid ${G.border}`, fontSize: 14,
                  background: G.bg, color: '#374151', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                  <span style={{ color: '#16a34a', fontSize: 16 }}>&#x2713;</span>
                  <span style={{ fontWeight: 600 }}>{reviewerName}</span>
                  <span style={{ color: G.text, fontSize: 12 }}>(from your login)</span>
                </div>
              </FormRow>
            </FieldGroup>

            <FieldGroup label="Superseded / Retired">
              <FormRow label="Deprecation note - only fill if marking this rule superseded. Shown publicly on the page.">
                <FTextarea
                  value={fields.deprecation_note}
                  onChange={v => set('deprecation_note', v)}
                  rows={2}
                  placeholder="e.g. This rule was repealed by the Social Security Fairness Act of 2023, effective January 2024, and is listed here for posterity."
                />
              </FormRow>
              <p style={{ fontSize: 12, color: G.text, margin: '4px 0 0' }}>
                After saving the note above, use the <strong>Superseded</strong> button in the header to set the page status.
              </p>
            </FieldGroup>

          </div>
        </div>

        {/* RIGHT - Live preview */}
        <div style={{ overflowY: 'auto', background: '#FFFDF5' }}>
          {/* Preview label bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: `1px solid ${G.border}`,
            padding: '9px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G.text }}>Live Preview</span>
            <span style={{ fontSize: 12, color: G.text }}>- updates as you edit</span>
          </div>

          {/* Compact verification flag count - details shown inline in page below */}
          {verificationFlags.length > 0 && (
            <div style={{
              margin: '12px 20px 0',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 6, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, color: '#991B1B',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>⚠</span>
                {unmatchedFlags.length === verificationFlags.length ? (
                  // None matched current text — list them directly rather than pointing to nonexistent blocks
                  <span>{verificationFlags.length} value{verificationFlags.length !== 1 ? 's' : ''} flagged at draft time but not found in current text (may have been edited out):</span>
                ) : (
                  <span>{verificationFlags.length - unmatchedFlags.length} value{verificationFlags.length - unmatchedFlags.length !== 1 ? 's' : ''} flagged for review — see red blocks inline below{unmatchedFlags.length > 0 ? `; ${unmatchedFlags.length} additional not found in current text` : ''}</span>
                )}
              </div>
              {unmatchedFlags.length > 0 && (
                <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontWeight: 400, fontSize: 11 }}>
                  {unmatchedFlags.map((f, i) => (
                    <li key={i} style={{ marginBottom: 2 }}>
                      <code style={{ background: '#FEE2E2', padding: '1px 4px', borderRadius: 3 }}>{f.value}</code>
                      {' '}<span style={{ color: '#7F1D1D' }}>{f.context.slice(0, 100)}{f.context.length > 100 ? '…' : ''}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Related FAQ suggestion banner */}
          {relatedFaqs.length > 0 && (
            <div style={{
              margin: '12px 0',
              padding: '12px 16px',
              background: '#FFF7ED',
              border: '1px solid #FED7AA',
              borderRadius: 8,
              fontSize: 13,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, color: '#92400E' }}>
                  📎 Same feedback may apply to {relatedFaqs.length} other question{relatedFaqs.length > 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => setRelatedFaqs([])}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, lineHeight: 1 }}
                >✕</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {relatedFaqs.map(r => (
                  <div key={r.index} style={{
                    background: '#fff',
                    border: '1px solid #FED7AA',
                    borderRadius: 6,
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontWeight: 500, color: '#111827', fontSize: 13 }}>{r.q}</p>
                      <p style={{ margin: '2px 0 0', color: '#6B7280', fontSize: 12 }}>{r.reason}</p>
                    </div>
                    <button
                      onClick={() => applyFeedbackToRelated(r)}
                      disabled={applyingRelated[r.index]}
                      style={{
                        flexShrink: 0,
                        padding: '5px 12px',
                        background: applyingRelated[r.index] ? '#E5E7EB' : '#EA580C',
                        color: applyingRelated[r.index] ? '#9CA3AF' : '#fff',
                        border: 'none',
                        borderRadius: 5,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: applyingRelated[r.index] ? 'not-allowed' : 'pointer',
                        fontFamily: 'inherit',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {applyingRelated[r.index] ? 'Applying…' : 'Apply feedback'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rendered page */}
          <ReferencePageComponent page={previewPage} components={resolvedComponents} previewMode embedded onSectionFeedback={handleSectionFeedback} onFaqFeedback={handleFaqFeedback} sectionLearned={sectionLearned} rewritingSection={rewritingSection} sectionExistingFeedback={sectionExistingFeedback} faqLearned={faqLearned} rewritingFaq={rewritingFaq} faqExistingFeedback={faqExistingFeedback} />
        </div>

      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1, height: 1, background: G.border }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G.text, whiteSpace: 'nowrap' }}>{label}</span>
        <div style={{ flex: 1, height: 1, background: G.border }} />
      </div>
      {children}
    </div>
  );
}

function FormRow({ label, children, warn }: { label: string; children: React.ReactNode; warn?: boolean }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: warn ? '#dc2626' : G.text, marginBottom: 4 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder ?? ''}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 6,
        border: `1px solid ${G.border}`, fontSize: 14, boxSizing: 'border-box',
        fontFamily: mono ? 'ui-monospace, "SF Mono", Menlo, monospace' : 'inherit',
      } as CSSProperties}
    />
  );
}

function FTextarea({ value, onChange, rows, placeholder }: { value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      rows={rows ?? 3}
      placeholder={placeholder ?? ''}
      style={{
        width: '100%', padding: '8px 10px', borderRadius: 6,
        border: `1px solid ${G.border}`, fontSize: 14,
        fontFamily: 'inherit', resize: 'vertical', boxSizing: 'border-box',
      } as CSSProperties}
    />
  );
}

// ─── Multi-citation editor ────────────────────────────────────────────────────
function CitationRefsEditor({ section, sectionIndex, onUpdate }: {
  section: BodySection;
  sectionIndex: number;
  onUpdate: (i: number, updates: Partial<BodySection>) => void;
}) {
  const monoStyle: CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 6,
    border: `1px solid ${G.border}`, fontSize: 13, boxSizing: 'border-box',
    fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
  };
  const allRefs: string[] = [
    ...(section.citation_ref ? [section.citation_ref] : []),
    ...(section.citation_refs ?? []),
  ];

  const handleChange = (idx: number, val: string) => {
    if (idx === 0) {
      // Primary ref
      onUpdate(sectionIndex, { citation_ref: val });
    } else {
      const extras = [...(section.citation_refs ?? [])];
      extras[idx - 1] = val;
      onUpdate(sectionIndex, { citation_refs: extras });
    }
  };

  const handleRemove = (idx: number) => {
    if (idx === 0) {
      // Promote first extra to primary, or clear
      const extras = [...(section.citation_refs ?? [])];
      const newPrimary = extras.shift() ?? '';
      onUpdate(sectionIndex, { citation_ref: newPrimary, citation_refs: extras.length ? extras : undefined });
    } else {
      const extras = [...(section.citation_refs ?? [])];
      extras.splice(idx - 1, 1);
      onUpdate(sectionIndex, { citation_refs: extras.length ? extras : undefined });
    }
  };

  const handleAdd = () => {
    if (!section.citation_ref) {
      onUpdate(sectionIndex, { citation_ref: '' });
    } else {
      const extras = [...(section.citation_refs ?? []), ''];
      onUpdate(sectionIndex, { citation_refs: extras });
    }
  };

  return (
    <div>
      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: G.text }}>
        Citation refs (POMS/CFR section numbers)
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {allRefs.length === 0 && (
          <input
            value=""
            onChange={e => onUpdate(sectionIndex, { citation_ref: e.target.value })}
            placeholder="e.g. GN 00204.020"
            style={monoStyle}
          />
        )}
        {allRefs.map((ref, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              value={ref}
              onChange={e => handleChange(idx, e.target.value)}
              placeholder="e.g. RS 00605.021"
              style={{ ...monoStyle, flex: 1 }}
            />
            {allRefs.length > 1 && (
              <button
                onClick={() => handleRemove(idx)}
                title="Remove this citation"
                style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '0 4px', lineHeight: 1 }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
        <button
          onClick={handleAdd}
          style={{ background: '#fff', border: `1px dashed ${G.border}`, color: NSSA.dark, borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', textAlign: 'left' as const, marginTop: 2 }}
        >
          + Add another citation ref
        </button>
      </div>
    </div>
  );
}

// ─── Style constants ──────────────────────────────────────────────────────────
const chipLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: G.text };
const removeBtnStyle: CSSProperties = { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 };
const addBtnStyle: CSSProperties = { background: '#fff', border: `1px dashed ${G.border}`, color: G.text, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%', marginTop: 4, fontFamily: 'inherit' };
const secondaryBtn: CSSProperties = { background: '#fff', border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' };
const primaryBtn: CSSProperties = { border: 'none', color: '#fff', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: NSSA.dark };

// ─── SourceSearch component ───────────────────────────────────────────────────
function SourceSearch({ pageSources, bodySections, pageTitle, category, onAddSource, onRedraft }: {
  pageSources: any[];
  bodySections: any[];
  pageTitle: string;
  category: string;
  onAddSource: (src: any) => void;
  onRedraft: (sectionIndex: number, src: any) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSrc, setSelectedSrc] = useState<any | null>(null);
  const [redraftTarget, setRedraftTarget] = useState<number | ''>('');
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!query.trim() || query.length < 3) { setResults([]); return; }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/codex/api/admin/source-search?q=${encodeURIComponent(query)}&limit=6`);
        const data = await res.json();
        setResults(data.results ?? []);
      } catch { setResults([]); }
      finally { setSearching(false); }
    }, 400);
  }, [query]);

  const alreadyAdded = (sectionNumber: string) =>
    pageSources.some((s: any) => s.section_number === sectionNumber);

  const sourceTypeLabel: Record<string, string> = {
    poms: 'POMS', cfr: 'CFR', handbook: 'Handbook', medicare: 'Medicare', cms: 'CMS',
  };

  const prose = bodySections.filter((s: any) => s.heading && s.prose);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setSelectedSrc(null); }}
          placeholder="Section number (e.g. RS 00615.201) or keywords…"
          style={{
            width: '100%', padding: '8px 10px', borderRadius: 6,
            border: `1px solid ${G.border}`, fontSize: 14,
            fontFamily: 'inherit', boxSizing: 'border-box' as const,
            background: searching ? '#F9FAFB' : '#fff',
          }}
        />
        {searching && (
          <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: G.text }}>
            Searching…
          </span>
        )}
      </div>

      {/* Results list */}
      {results.length > 0 && !selectedSrc && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 300, overflowY: 'auto' }}>
          {results.map(r => (
            <div
              key={r.section_number}
              onClick={() => setSelectedSrc(r)}
              style={{
                padding: '9px 12px',
                border: `1px solid ${G.border}`,
                borderRadius: 6,
                cursor: 'pointer',
                background: '#fff',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = NSSA.medium)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = G.border)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: NSSA.dark, background: '#EBF5FB', padding: '1px 6px', borderRadius: 4 }}>
                  {r.section_number}
                </span>
                <span style={{ fontSize: 11, color: G.text }}>{sourceTypeLabel[r.source_type] ?? r.source_type}</span>
                {alreadyAdded(r.section_number) && (
                  <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>✓ Already cited</span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#111827' }}>{r.title}</p>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: G.text, lineHeight: 1.4 }}>{r.snippet}</p>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && query.length >= 3 && !searching && (
        <p style={{ fontSize: 13, color: G.text, margin: 0 }}>No matching sources found.</p>
      )}

      {/* Selected source — action panel */}
      {selectedSrc && (
        <div style={{ border: `1px solid ${NSSA.light}`, borderRadius: 8, padding: 12, background: '#EBF5FB' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 700, color: NSSA.dark, background: '#D6EAF8', padding: '2px 8px', borderRadius: 4 }}>
                {selectedSrc.section_number}
              </span>
              <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedSrc.title}</p>
              {selectedSrc.source_url && (
                <a href={selectedSrc.source_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: NSSA.medium }}>
                  View source ↗
                </a>
              )}
            </div>
            <button onClick={() => setSelectedSrc(null)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: G.text, fontSize: 18, lineHeight: 1, padding: 0 }}>
              ✕
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* Action 1: Citation only */}
            <button
              onClick={() => { onAddSource(selectedSrc); setSelectedSrc(null); setQuery(''); setResults([]); }}
              disabled={alreadyAdded(selectedSrc.section_number)}
              style={{
                padding: '8px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                border: 'none', cursor: alreadyAdded(selectedSrc.section_number) ? 'not-allowed' : 'pointer',
                background: alreadyAdded(selectedSrc.section_number) ? '#E5E7EB' : NSSA.dark,
                color: alreadyAdded(selectedSrc.section_number) ? G.text : '#fff',
                fontFamily: 'inherit', textAlign: 'left' as const,
              }}
            >
              {alreadyAdded(selectedSrc.section_number) ? '✓ Already in citations' : '+ Add as citation'}
            </button>

            {/* Action 2: Citation + Re-draft a section */}
            {prose.length > 0 && (
              <div style={{ borderTop: `1px solid ${NSSA.light}`, paddingTop: 8 }}>
                <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: NSSA.dark }}>
                  Add citation + re-draft a section using this source:
                </p>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    value={redraftTarget}
                    onChange={e => setRedraftTarget(e.target.value === '' ? '' : Number(e.target.value))}
                    style={{
                      flex: 1, padding: '7px 10px', borderRadius: 6, fontSize: 13,
                      border: `1px solid ${G.border}`, fontFamily: 'inherit', background: '#fff',
                    }}
                  >
                    <option value="">Choose a section to re-draft…</option>
                    {bodySections.map((s: any, i: number) =>
                      s.heading && s.prose ? (
                        <option key={i} value={i}>{s.heading}</option>
                      ) : null
                    )}
                  </select>
                  <button
                    disabled={redraftTarget === ''}
                    onClick={() => {
                      if (redraftTarget === '') return;
                      onRedraft(redraftTarget as number, selectedSrc);
                      setSelectedSrc(null);
                      setQuery('');
                      setResults([]);
                      setRedraftTarget('');
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      border: 'none', cursor: redraftTarget === '' ? 'not-allowed' : 'pointer',
                      background: redraftTarget === '' ? '#E5E7EB' : '#EA580C',
                      color: redraftTarget === '' ? G.text : '#fff',
                      fontFamily: 'inherit', whiteSpace: 'nowrap' as const,
                    }}
                  >
                    Re-draft ↻
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Current citations */}
      {pageSources.length > 0 && (
        <div>
          <p style={{ fontSize: 12, fontWeight: 600, color: G.text, margin: '4px 0 4px', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
            Current citations ({pageSources.length})
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6 }}>
            {pageSources.map((s: any, i: number) => (
              <span key={i} style={{ fontSize: 12, background: '#F3F4F6', border: `1px solid ${G.border}`, borderRadius: 4, padding: '2px 8px', color: '#374151', fontWeight: 500 }}>
                {s.section_number}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
