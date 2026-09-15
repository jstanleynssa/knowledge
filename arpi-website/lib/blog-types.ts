export interface BlogPost {
  id: string
  slug: string
  title: string
  dek: string | null
  excerpt: string | null
  body_mdx: string | null
  body_md_published: string | null
  hero_image_url: string | null
  hero_image_alt: string | null
  meta_title: string | null
  meta_description: string | null
  canonical_url: string | null
  legacy_published_at: string | null
  published_at: string | null
  status: string
  triage_bucket: string | null
  is_time_bound: boolean | null
  as_of_date: string | null
  is_superseded: boolean | null
  superseded_note: string | null
  author_id: string | null
  review_status: string | null
  content_updated_at: string | null
  updated_at: string | null
  categories?: Category[]
}

export interface Category {
  id: string
  slug: string
  name: string
}
