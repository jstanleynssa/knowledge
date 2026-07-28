-- Add logo_url column to partners table
ALTER TABLE partners ADD COLUMN IF NOT EXISTS logo_url text;

-- Seed logo URLs for existing partners
UPDATE partners SET logo_url = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/stonebridge-logo.png'
  WHERE name = 'Stonebridge Wealth';

UPDATE partners SET logo_url = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/fta-logo.png'
  WHERE name = 'Financial and Tax Professionals';

UPDATE partners SET logo_url = 'https://eqipvrcmugnvkextqmym.supabase.co/storage/v1/object/public/site-resources/arc-financial-logo.png'
  WHERE name = 'ARC Financial and Insurance Group';
