'use client';

import { useState, useTransition, useCallback, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import type { ReferencePage, BodySection, FaqItem, WorkedExample } from '@/lib/types';
import { ReferencePageComponent } from '@/components/ReferencePage';
import { saveDraft, saveAndApprove, supersedePageAction, type EditableFields } from '../actions';
import { RichTextEditor } from '@/components/RichTextEditor';

// ─── Design tokens (match members app) ───────────────────────────────────────
const NSSA = { light: '#8ECAEE', medium: '#1C80BC', dark: '#13405E' };
const IRMAA = { dark: '#AF2A35' };
const G = { text: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb' };

// ─── Types ────────────────────────────────────────────────────────────────────

function toEditState(page: ReferencePage): EditableFields {
  return {
    title:            page.title ?? '',
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

export function ReviewEditor({
  page,
  reviewerName,
}: {
  page: ReferencePage;
  reviewerName: string;
}) {
  const router = useRouter();
  const [fields, setFields] = useState<EditableFields>(() => ({
    ...toEditState(page),
    // Always credit the logged-in reviewer — not a manual entry
    reviewer: reviewerName,
  }));
  const [isPending, startTransition] = useTransition();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showSuperseded, setShowSuperseded] = useState(false);
  const [sectionFeedback, setSectionFeedback] = useState<Record<number, { type: 'verified' | 'flag'; note?: string }>>({});
  const [faqFeedback, setFaqFeedback] = useState<Record<number, { type: 'verified' | 'flag'; note?: string }>>({});

  function persistFeedback(sectionType: 'body' | 'faq', index: number, type: 'verified' | 'flag', note?: string) {
    const section = sectionType === 'body' ? fields.body_sections[index] : null;
    fetch('/api/admin/section-feedback', {
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

  function handleSectionFeedback(index: number, type: 'verified' | 'flag', note?: string) {
    setSectionFeedback(prev => ({ ...prev, [index]: { type, note } }));
    persistFeedback('body', index, type, note);
  }

  function handleFaqFeedback(index: number, type: 'verified' | 'flag', note?: string) {
    setFaqFeedback(prev => ({ ...prev, [index]: { type, note } }));
    persistFeedback('faq', index, type, note);
  }
  const [supersededNote, setSupersededNote] = useState(page.deprecation_note ?? '');

  const set = useCallback(<K extends keyof EditableFields>(key: K, val: EditableFields[K]) => {
    setFields(f => ({ ...f, [key]: val }));
  }, []);

  // Inject SOURCE GAP markers into body sections for any values flagged by the verification gate.
  // This surfaces them inline (red block at the source citation) rather than only in a top banner.
  const verificationFlags: Array<{ value: string; context: string; found_in_uncited?: string }> =
    (page as any).draft_metadata?.verification?.unverified ?? [];

  const bodySectionsWithFlags = fields.body_sections.map(section => {
    if (verificationFlags.length === 0) return section;
    const hits = verificationFlags.filter(u =>
      section.prose.toLowerCase().includes(u.value.toLowerCase().replace(/,\s*$/, ''))
    );
    if (hits.length === 0) return section;
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
    const gapNote = hits.map(u => `\u201c${u.value}\u201d not verified against cited source`).join('; ');
    return fields.quick_answer + ` [SOURCE GAP: ${gapNote}]`;
  })();

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
    setSaveStatus('saving');
    startTransition(async () => {
      try {
        await saveDraft(page.id, fields);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (e) {
        setSaveStatus('error');
        alert('Save failed: ' + (e as Error).message);
      }
    });
  }

  function handleApprove() {
    startTransition(async () => {
      try {
        await saveAndApprove(page.id, fields);
        router.push('/admin/kb-review');
      } catch (e) {
        alert('Approve failed: ' + (e as Error).message);
      }
    });
  }

  function handleSupersede() {
    startTransition(async () => {
      try {
        await supersedePageAction(page.id, supersededNote);
        router.push('/admin/kb-review');
      } catch (e) {
        alert('Failed: ' + (e as Error).message);
      }
    });
  }

  // ─── Body section helpers ──────────────────────────────────────────────────
  const updateSection = (i: number, key: keyof BodySection, val: string) =>
    set('body_sections', fields.body_sections.map((s, idx) => idx === i ? { ...s, [key]: val } : s));
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
  const addSection = () => insertSection(fields.body_sections.length - 1);
  const addTable   = () => insertTable(fields.body_sections.length - 1);
  const removeSection = (i: number) =>
    set('body_sections', fields.body_sections.filter((_, idx) => idx !== i));

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
              The page remains published for reference. Describe why below — this note is shown publicly.
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
                {isPending ? 'Saving…' : 'Mark Superseded'}
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

          <a
            href={`/preview/${page.id}`}
            target="_blank"
            rel="noopener"
            style={{ color: NSSA.light, fontSize: 13, textDecoration: 'none' }}
          >
            Full preview ↗
          </a>

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
            {saveStatus === 'saving' ? 'Saving…' : 'Save for Later'}
          </button>

          <button
            onClick={handleApprove}
            disabled={isPending}
            style={{ background: '#16a34a', border: 'none', color: '#fff', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
          >
            {isPending ? 'Saving…' : '✓ Approve'}
          </button>
        </div>
      </div>

      {/* ── Two-column body ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: `calc(100vh - ${HEADER_H}px)` }}>

        {/* LEFT — Editable form */}
        <div style={{ overflowY: 'auto', borderRight: `1px solid ${G.border}`, background: '#fff' }}>
          <div style={{ padding: '24px 28px', maxWidth: 640, margin: '0 auto' }}>

            <FieldGroup label="Page Identity">
              <FormRow label="Title (H1)">
                <FInput value={fields.title} onChange={v => set('title', v)} />
              </FormRow>
              <FormRow label={`SEO Title — ${fields.seo_title.length}/60 chars`} warn={fields.seo_title.length > 60}>
                <FInput value={fields.seo_title} onChange={v => set('seo_title', v)} />
              </FormRow>
              <FormRow label={`Meta Description — ${fields.meta_description.length}/160 chars`} warn={fields.meta_description.length > 160}>
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
                placeholder="The short answer shown at the top of the page…"
                minHeight={120}
              />
            </FieldGroup>

            <FieldGroup label={`Body Sections (${fields.body_sections.filter(s => !(s as any)._review_note).length})`}>
              {fields.body_sections
                .filter(s => !(s as any)._review_note)
                .map((section, i) => (
                  <div key={i} style={{ background: G.bg, borderRadius: 8, padding: '14px 16px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={chipLabel}>
                        {section.type === 'table' ? '📊 Table' : `Section ${i + 1}`}
                      </span>
                      <button onClick={() => removeSection(i)} style={removeBtnStyle}>Remove</button>
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

                        <FormRow label="Citation ref (POMS/CFR section number)">
                          <FInput value={section.citation_ref ?? ''} onChange={v => updateSection(i, 'citation_ref', v)} placeholder="e.g. HI 01101.020" mono />
                        </FormRow>
                      </>
                    ) : (
                      /* ── Prose section ── */
                      <>
                        <FormRow label="Heading">
                          <FInput value={section.heading} onChange={v => updateSection(i, 'heading', v)} />
                        </FormRow>
                        <FormRow label="Prose (HTML OK)">
                          <FTextarea value={section.prose} onChange={v => updateSection(i, 'prose', v)} rows={4} />
                        </FormRow>
                        <FormRow label="Citation ref (POMS/CFR section number)">
                          <FInput
                            value={section.citation_ref ?? ''}
                            onChange={v => updateSection(i, 'citation_ref', v)}
                            placeholder="e.g. GN 00204.020"
                            mono
                          />
                        </FormRow>
                      </>
                    )}
                  </div>
                ))}
              {/* Bottom insert buttons — always visible even with 0 sections */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button onClick={addSection} style={{ ...addBtnStyle, flex: 1 }}>+ Add Prose Section</button>
                <button onClick={addTable}   style={{ ...addBtnStyle, flex: 1 }}>📊 Add Table</button>
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
                </div>
              ))}
              <button onClick={addFaq} style={addBtnStyle}>+ Add FAQ item</button>
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
              <FormRow label="Deprecation note — only fill if marking this rule superseded. Shown publicly on the page.">
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

        {/* RIGHT — Live preview */}
        <div style={{ overflowY: 'auto', background: '#FFFDF5' }}>
          {/* Preview label bar */}
          <div style={{
            position: 'sticky', top: 0, zIndex: 10,
            background: '#fff', borderBottom: `1px solid ${G.border}`,
            padding: '9px 20px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G.text }}>Live Preview</span>
            <span style={{ fontSize: 12, color: G.text }}>— updates as you edit</span>
          </div>

          {/* Compact verification flag count — details shown inline in page below */}
          {verificationFlags.length > 0 && (
            <div style={{
              margin: '12px 20px 0',
              background: '#FEF2F2', border: '1px solid #FECACA',
              borderRadius: 6, padding: '8px 14px',
              fontSize: 12, fontWeight: 600, color: '#991B1B',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <span>⚠</span>
              <span>{verificationFlags.length} value{verificationFlags.length !== 1 ? 's' : ''} flagged for review — see red blocks inline below</span>
            </div>
          )}

          {/* Rendered page */}
          <ReferencePageComponent page={previewPage} previewMode embedded onSectionFeedback={handleSectionFeedback} onFaqFeedback={handleFaqFeedback} />
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

// ─── Style constants ──────────────────────────────────────────────────────────
const chipLabel: CSSProperties = { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: G.text };
const removeBtnStyle: CSSProperties = { background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 };
const addBtnStyle: CSSProperties = { background: '#fff', border: `1px dashed ${G.border}`, color: G.text, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 13, width: '100%', marginTop: 4, fontFamily: 'inherit' };
const secondaryBtn: CSSProperties = { background: '#fff', border: `1px solid ${G.border}`, color: G.text, borderRadius: 6, padding: '8px 16px', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' };
const primaryBtn: CSSProperties = { border: 'none', color: '#fff', borderRadius: 6, padding: '8px 20px', cursor: 'pointer', fontSize: 14, fontWeight: 700, fontFamily: 'inherit', background: NSSA.dark };
