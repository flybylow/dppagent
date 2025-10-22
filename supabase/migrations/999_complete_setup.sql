-- Complete Setup for Dashboard Scraper
-- Run this ONE migration to add all required columns
-- Safe to run multiple times (uses IF NOT EXISTS)

-- Add missing columns to discovered_dpps
ALTER TABLE discovered_dpps
ADD COLUMN IF NOT EXISTS fetched_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS raw_html TEXT,
ADD COLUMN IF NOT EXISTS raw_response JSONB,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS json_ld_blocks JSONB,
ADD COLUMN IF NOT EXISTS extraction_method TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Drop old constraint if exists
ALTER TABLE discovered_dpps 
DROP CONSTRAINT IF EXISTS discovered_dpps_extraction_method_check;

-- Add updated constraint
ALTER TABLE discovered_dpps
ADD CONSTRAINT discovered_dpps_extraction_method_check 
CHECK (extraction_method IN (
  'direct_json',
  'html_script_tag',
  'microdata',
  'rdfa',
  'meta_tags',
  'content_negotiation_ld',
  'next_data',
  'force_json_parse',
  'none',
  'failed'
));

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_extraction 
  ON discovered_dpps(extraction_method);

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_metadata 
  ON discovered_dpps USING gin(metadata);

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_content_type 
  ON discovered_dpps(content_type);

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_jsonld_gin 
  ON discovered_dpps USING gin(json_ld);

-- Verify columns exist
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'discovered_dpps'
  AND column_name IN ('metadata', 'fetched_at', 'raw_html', 'extraction_method')
ORDER BY column_name;

-- Success message
SELECT 'All columns added successfully!' as status;

