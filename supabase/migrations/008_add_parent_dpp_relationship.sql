-- Add parent-child relationship for DPPs
-- Allows linking DID Documents to their Product DPPs

-- Add parent_dpp_id column
ALTER TABLE discovered_dpps
ADD COLUMN IF NOT EXISTS parent_dpp_id UUID REFERENCES discovered_dpps(id) ON DELETE SET NULL;

-- Add index for efficient queries
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_parent 
  ON discovered_dpps(parent_dpp_id);

-- Add index for finding orphans (no parent)
CREATE INDEX IF NOT EXISTS idx_discovered_dpps_no_parent 
  ON discovered_dpps(parent_dpp_id) WHERE parent_dpp_id IS NULL;

-- Comment on column
COMMENT ON COLUMN discovered_dpps.parent_dpp_id IS 
  'References parent DPP. Used when a DID Document points to Product DPPs via service endpoints.';

-- Example query: Get DID Document and its children
-- SELECT 
--   parent.url as did_document_url,
--   parent.metadata->>'endpoints_count' as endpoint_count,
--   child.url as product_url,
--   child.metadata->>'format' as product_format
-- FROM discovered_dpps parent
-- LEFT JOIN discovered_dpps child ON child.parent_dpp_id = parent.id
-- WHERE parent.metadata->>'is_did_document' = 'true';

