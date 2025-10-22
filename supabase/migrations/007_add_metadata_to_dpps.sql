-- Add metadata column to discovered_dpps if not exists
-- This stores scraping metadata like format, size, extraction method details

ALTER TABLE discovered_dpps
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_metadata 
  ON discovered_dpps USING gin(metadata);

-- Update extraction_method check to include new methods
ALTER TABLE discovered_dpps 
DROP CONSTRAINT IF EXISTS discovered_dpps_extraction_method_check;

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

-- Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'discovered_dpps'
  AND column_name IN ('raw_html', 'raw_response', 'metadata', 'extraction_method')
ORDER BY column_name;

