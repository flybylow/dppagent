-- Spherity Advanced Sources - Real DID endpoints with proper JSON-LD
-- Based on Spherity documentation and Medium articles

-- Clear old Spherity entries if needed (optional)
-- DELETE FROM crawl_targets WHERE name LIKE 'Spherity%';

-- Add comprehensive Spherity test sources
INSERT INTO crawl_targets (name, base_url, status, metadata) VALUES

-- 1. Spherity Textile DPP (T-Shirt)
('Spherity Textile (T-Shirt)', 'https://20230614.dpp.spherity.com', 'active',
 '{
   "type": "Textile",
   "test_url": "https://20230614.dpp.spherity.com/textile/sample-uuid",
   "did_url": "did:web:20230614.dpp.spherity.com:textile:sample-uuid",
   "did_document_url": "https://20230614.dpp.spherity.com/.well-known/did.json",
   "schema_url": "https://spherity.github.io/schemas/testing/breathable-t-shirt.json",
   "format": "Verifiable Credential",
   "notes": "T-shirt DPP with textile composition, sustainability data, and verifiable credentials",
   "accepts_header": "application/ld+json",
   "godiddy_resolver": "https://godiddy.com/did/did:web:20230614.dpp.spherity.com:textile:UUID?service=product"
 }'::jsonb),

-- 2. Spherity Battery (ACME Demo)
('Spherity Battery (ACME)', 'https://acme.dpp.spherity.com', 'active',
 '{
   "type": "Battery",
   "test_url": "https://acme.dpp.spherity.com/battery/7be3b99c-33a3-4d72-a747-feeb2c2ed263",
   "did_url": "did:web:acme.dpp.spherity.com:battery:7be3b99c-33a3-4d72-a747-feeb2c2ed263",
   "did_document_url": "https://acme.dpp.spherity.com/.well-known/did.json",
   "format": "Verifiable Credential",
   "notes": "Battery passport with full specs, carbon footprint, manufacturer data",
   "accepts_header": "application/ld+json"
 }'::jsonb),

-- 3. Spherity Battery Demo Portal
('Spherity Battery Portal', 'http://battery.dpp.spherity.com', 'active',
 '{
   "type": "Battery Portal",
   "test_url": "http://battery.dpp.spherity.com",
   "format": "Web Portal",
   "notes": "Interactive battery passport demo portal. May link to multiple battery DPPs."
 }'::jsonb),

-- 4. Spherity Company DID
('Spherity Organization', 'https://20230614.dpp.spherity.com', 'active',
 '{
   "type": "Organization",
   "test_url": "https://20230614.dpp.spherity.com/.well-known/did.json",
   "did_url": "did:web:20230614.dpp.spherity.com",
   "format": "DID Document",
   "notes": "Company-level DID document with public keys and service endpoints"
 }'::jsonb),

-- 5. Spherity Schema Repository
('Spherity Schemas', 'https://spherity.github.io', 'active',
 '{
   "type": "Schema Repository",
   "test_url": "https://spherity.github.io/schemas/testing/breathable-t-shirt.json",
   "format": "JSON Schema",
   "notes": "JSON-LD schemas for product types. Reference schemas for validation.",
   "additional_schemas": [
     "https://spherity.github.io/schemas/testing/breathable-t-shirt.json",
     "https://spherity.github.io/schemas/battery/battery-passport.json"
   ]
 }'::jsonb);

-- Add discovered DPPs for immediate testing
INSERT INTO discovered_dpps (crawl_target_id, url, fetch_status, metadata)
SELECT 
  c.id,
  c.metadata->>'test_url',
  'pending',
  jsonb_build_object(
    'source', 'manual_import',
    'did_url', c.metadata->>'did_url',
    'accepts_header', c.metadata->>'accepts_header'
  )
FROM crawl_targets c
WHERE c.metadata->>'test_url' IS NOT NULL
  AND c.name LIKE 'Spherity%'
  AND c.metadata->>'test_url' NOT IN (SELECT url FROM discovered_dpps);

-- View all Spherity sources
SELECT 
  name,
  base_url,
  metadata->>'type' as type,
  metadata->>'did_url' as did_url,
  metadata->>'test_url' as test_url,
  metadata->>'did_document_url' as did_doc
FROM crawl_targets
WHERE name LIKE 'Spherity%'
ORDER BY created_at DESC;

