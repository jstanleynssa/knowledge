// ============================================================
// TypeScript types for the NSSA Knowledge Base
// Derived from supabase/migrations/001_initial_schema.sql
// ============================================================

export type SourceType = 'poms' | 'cfr' | 'handbook' | 'regs';
export type DocKind = 'rule' | 'toc' | 'empty';
export type PageStatus = 'draft' | 'in_review' | 'approved' | 'published' | 'retired' | 'superseded';
export type Category = 'social-security' | 'irmaa';

// ─── Layer 1 ──────────────────────────────────────────────────────────────────

export interface SourceDocument {
  id: string;
  source_type: SourceType;
  doc_kind: DocKind;
  section_number: string | null;
  title: string | null;
  full_text: string | null;
  source_url: string | null;
  last_updated: string | null;  // SSA's date string, e.g. '10/19/2023'
  scrape_date: string;          // ISO date
  created_at: string;
}

export interface SourceChunk {
  id: string;
  source_document_id: string;
  section_number: string | null;
  chunk_text: string;
  embedding: number[] | null;   // vector(1536)
  created_at: string;
}

// ─── Layer 2 ──────────────────────────────────────────────────────────────────

export interface BodySection {
  type?: 'prose' | 'table';   // defaults to 'prose' for backward compat
  heading: string;
  prose: string;
  citation_ref?: string;       // section_number that sourced this claim
  // Table-specific fields (only used when type === 'table')
  headers?: string[];          // column header labels
  rows?: string[][];           // row data [row][col]
}

export interface WorkedExample {
  label: string;
  paragraphs: string[];
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface PrimarySource {
  tag: string;                  // e.g. 'Source', 'POMS'
  section_number: string;       // resolves to source_documents.section_number
  url: string;                  // canonical policy.ssa.gov URL
}

export interface ReferencePage {
  id: string;
  slug: string;
  category: Category;
  /** Short canonical label — used in breadcrumbs, admin queue, nav. */
  title: string;
  /** SEO-optimised headline rendered as the page <h1>. Keyword-rich, 8–12 words.
   *  Falls back to title if not set (older records). */
  h1?: string | null;
  seo_title: string;
  meta_description: string;
  eyebrow: string | null;
  quick_answer: string;
  body_sections: BodySection[];
  worked_example: WorkedExample | null;
  faq: FaqItem[];
  primary_sources: PrimarySource[];
  og_image_url: string | null;
  reviewer: string | null;
  status: PageStatus;
  deprecation_note: string | null;  // set when status = 'superseded'
  source_last_verified: string | null;   // ISO date
  date_published: string | null;         // ISO date
  date_modified: string | null;          // ISO date
  approved_by: string | null;            // display name of approving reviewer
  approved_at: string | null;            // ISO timestamp
  created_at: string;
  updated_at: string;
}

// ─── KB Reviewers ────────────────────────────────────────────────────────────

export interface KbReviewer {
  id: string;
  email: string;
  display_name: string;
  categories: Category[];
  created_at: string;
}

// ─── Phase 2 ─────────────────────────────────────────────────────────────────

export interface VerifiedAnswer {
  id: string;
  question: string;
  answer: string;
  primary_sources: PrimarySource[];
  answered_by: string;
  category: Category;
  status: PageStatus;
  embedding: number[] | null;
  last_reviewed: string;       // ISO date
  created_at: string;
}

export interface UnansweredQuestion {
  id: string;
  question: string;
  advisor_id: string | null;
  retrieval_score: number | null;
  routed_to: string | null;
  resolved_by: string | null;  // uuid → verified_answers.id
  status: 'open' | 'routed' | 'resolved';
  created_at: string;
}

// ─── Octoparse raw row shape (POMS CSV export) ────────────────────────────────

export interface OctoparsePOMSRow {
  Page_URL: string;
  PageTitle: string | null;
  SectionTitle: string | null;
  subSectionTitle: string | null;
  LastUpdated: string | null;
  References: string | null;
  RuleText: string | null;
  FullRule: string | null;
}

// ─── Normalized row ready for Supabase upsert ─────────────────────────────────

export type SourceDocumentInsert = Omit<SourceDocument, 'id' | 'created_at'>;
export type ReferencePageInsert = Omit<ReferencePage, 'id' | 'created_at' | 'updated_at' | 'approved_by' | 'approved_at'> & {
  approved_by?: string | null;
  approved_at?: string | null;
};
