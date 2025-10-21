-- Add metadata column to crawl_targets
-- This column stores additional JSON data like test URLs, notes, etc.

ALTER TABLE crawl_targets 
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Add an index for faster JSON queries
CREATE INDEX IF NOT EXISTS idx_crawl_targets_metadata ON crawl_targets USING gin(metadata);

-- Verify the change
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'crawl_targets'
ORDER BY ordinal_position;

