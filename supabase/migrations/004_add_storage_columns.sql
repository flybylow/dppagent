-- Add columns for clean storage strategy
-- Supports storing both original and cleaned versions

-- Add new columns to discovered_dpps
ALTER TABLE discovered_dpps
ADD COLUMN IF NOT EXISTS raw_html TEXT,
ADD COLUMN IF NOT EXISTS raw_response JSONB,
ADD COLUMN IF NOT EXISTS content_type TEXT,
ADD COLUMN IF NOT EXISTS json_ld_blocks JSONB,
ADD COLUMN IF NOT EXISTS extraction_method TEXT CHECK (extraction_method IN (
  'direct_json',
  'html_script_tag',
  'microdata',
  'rdfa',
  'meta_tags',
  'none',
  'failed'
));

-- Add comment explaining the strategy
COMMENT ON COLUMN discovered_dpps.raw_html IS 'Original HTML response (for audit trail and re-parsing)';
COMMENT ON COLUMN discovered_dpps.raw_response IS 'Original JSON response if content-type was JSON';
COMMENT ON COLUMN discovered_dpps.json_ld IS 'Cleaned, extracted JSON-LD data (primary for queries)';
COMMENT ON COLUMN discovered_dpps.json_ld_blocks IS 'Array of all JSON-LD blocks if multiple found';
COMMENT ON COLUMN discovered_dpps.extraction_method IS 'How the JSON-LD was extracted';

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_extraction 
  ON discovered_dpps(extraction_method);

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_has_jsonld 
  ON discovered_dpps((json_ld IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_content_type 
  ON discovered_dpps(content_type);

-- Add GIN index for JSONB queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_jsonld_gin 
  ON discovered_dpps USING gin(json_ld);

CREATE INDEX IF NOT EXISTS idx_discovered_dpps_blocks_gin 
  ON discovered_dpps USING gin(json_ld_blocks);

-- View for cleaned data only (fast queries)
CREATE OR REPLACE VIEW dpps_with_jsonld AS
SELECT 
  id,
  url,
  json_ld,
  json_ld_blocks,
  extraction_method,
  fetched_at,
  content_type
FROM discovered_dpps
WHERE json_ld IS NOT NULL;

-- View for extraction statistics
CREATE OR REPLACE VIEW extraction_stats AS
SELECT 
  extraction_method,
  COUNT(*) as total,
  COUNT(CASE WHEN json_ld IS NOT NULL THEN 1 END) as successful,
  ROUND(AVG(LENGTH(raw_html::text))) as avg_html_size,
  ROUND(AVG(LENGTH(json_ld::text))) as avg_jsonld_size
FROM discovered_dpps
GROUP BY extraction_method
ORDER BY total DESC;

-- Example queries

-- Find DPPs that failed extraction
-- SELECT url, content_type, error_message 
-- FROM discovered_dpps 
-- WHERE extraction_method = 'failed' OR json_ld IS NULL;

-- Compare storage sizes
-- SELECT 
--   'Original (HTML)' as type,
--   pg_size_pretty(SUM(LENGTH(raw_html::text))::bigint) as size
-- FROM discovered_dpps
-- UNION ALL
-- SELECT 
--   'Cleaned (JSON-LD)' as type,
--   pg_size_pretty(SUM(LENGTH(json_ld::text))::bigint) as size
-- FROM discovered_dpps;

