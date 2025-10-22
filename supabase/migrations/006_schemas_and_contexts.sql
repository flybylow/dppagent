-- Schemas, Contexts, and Data Models
-- Reference schemas and JSON-LD contexts for DPP validation and understanding

-- Add schema and context sources
INSERT INTO crawl_targets (name, base_url, status, metadata) VALUES

-- DID Documents
('Spherity Company DID (2023)', 'https://20230614.dpp.spherity.com', 'active',
 '{
   "type": "DID Document",
   "test_url": "https://20230614.dpp.spherity.com/.well-known/did.json",
   "did_url": "did:web:20230614.dpp.spherity.com",
   "format": "DID Document",
   "notes": "Company-level DID Document for Spherity textile DPPs"
 }'::jsonb),

('Spherity T-Shirt DID', 'https://tshirt.dpp.spherity.com', 'active',
 '{
   "type": "DID Document",
   "test_url": "https://tshirt.dpp.spherity.com/.well-known/did.json",
   "did_url": "did:web:tshirt.dpp.spherity.com",
   "format": "DID Document",
   "notes": "T-shirt product DID Document (may exist)"
 }'::jsonb),

-- Schemas
('Battery Pass Schema (Official)', 'https://raw.githubusercontent.com/batterypass', 'active',
 '{
   "type": "Schema",
   "test_url": "https://raw.githubusercontent.com/batterypass/BatteryPassDataModel/main/BatteryPass/gen/BatteryPass.jsonld",
   "format": "JSON-LD Schema",
   "notes": "Official Battery Pass data model from batterypass GitHub repo. Complete schema with RDF."
 }'::jsonb),

('Spherity T-Shirt Schema', 'https://spherity.github.io', 'active',
 '{
   "type": "Schema",
   "test_url": "https://spherity.github.io/schemas/testing/breathable-t-shirt.json",
   "format": "JSON Schema",
   "notes": "Spherity textile product schema for t-shirt DPPs"
 }'::jsonb),

('Smart Data Models Battery', 'https://raw.githubusercontent.com/smart-data-models', 'active',
 '{
   "type": "Schema",
   "test_url": "https://raw.githubusercontent.com/smart-data-models/dataModel.Battery/master/Battery/schema.json",
   "format": "JSON Schema",
   "notes": "Smart Data Models battery schema - alternative battery data model"
 }'::jsonb),

-- JSON-LD Contexts
('W3C Verifiable Credentials Context v2', 'https://www.w3.org', 'active',
 '{
   "type": "JSON-LD Context",
   "test_url": "https://www.w3.org/ns/credentials/v2",
   "format": "JSON-LD Context",
   "notes": "W3C Verifiable Credentials context (version 2). Defines credential vocabulary."
 }'::jsonb),

('W3C Verifiable Credentials Context v1', 'https://www.w3.org', 'active',
 '{
   "type": "JSON-LD Context",
   "test_url": "https://www.w3.org/2018/credentials/v1",
   "format": "JSON-LD Context",
   "notes": "W3C Verifiable Credentials context (version 1). Most commonly used."
 }'::jsonb),

('W3C DID Context', 'https://www.w3.org', 'active',
 '{
   "type": "JSON-LD Context",
   "test_url": "https://www.w3.org/ns/did/v1",
   "format": "JSON-LD Context",
   "notes": "DID document context. Defines DID vocabulary (verificationMethod, service, etc.)"
 }'::jsonb),

('Ed25519 Security Suite', 'https://w3id.org', 'active',
 '{
   "type": "JSON-LD Context",
   "test_url": "https://w3id.org/security/suites/ed25519-2020/v1",
   "format": "JSON-LD Context",
   "notes": "Ed25519 cryptographic suite context for verifiable credentials"
 }'::jsonb),

-- Standards Documentation
('GS1 Digital Link Docs', 'https://gs1.github.io', 'active',
 '{
   "type": "Documentation",
   "test_url": "https://gs1.github.io/DigitalLinkDocs/",
   "format": "HTML Documentation",
   "notes": "GS1 Digital Link standard documentation. Explains GTIN-based DPP URLs."
 }'::jsonb);

-- View all schemas and contexts
SELECT 
  name,
  metadata->>'type' as category,
  metadata->>'test_url' as url,
  metadata->>'format' as format
FROM crawl_targets
WHERE metadata->>'type' IN ('Schema', 'JSON-LD Context', 'DID Document', 'Documentation')
ORDER BY metadata->>'type', name;

