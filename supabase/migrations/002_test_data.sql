-- Test Data - Real DPP Sources
-- Run this AFTER 001_initial_schema.sql
-- Purpose: Populate database with real-world DPP examples for testing

-- Phase 1: Real DPP Sources
INSERT INTO crawl_targets (name, base_url, status, metadata) VALUES
('Spherity (Battery)', 'https://acme.dpp.spherity.com', 'active', 
 '{"type": "Battery", "test_url": "https://acme.dpp.spherity.com/battery/7be3b99c-33a3-4d72-a747-feeb2c2ed263", "notes": "Live battery DPP with full JSON-LD"}'::jsonb),

('Unilever (Dove)', 'https://smartlabel.unileverusa.com', 'active',
 '{"type": "Consumer Goods", "test_url": "https://smartlabel.unileverusa.com/048001705920-0001-en-US/index.html", "notes": "SmartLabel format, GTIN-based"}'::jsonb),

('Hersheys', 'https://smartlabel.hersheys.com', 'active',
 '{"type": "Food", "test_url": "https://smartlabel.hersheys.com/00034000002405-0001-en-US/index.html", "notes": "Chocolate manufacturer SmartLabel"}'::jsonb),

('Tappr Demo', 'https://usetappr.com', 'active',
 '{"type": "Multi-industry Demo", "test_url": "https://usetappr.com/demo-experience", "notes": "Interactive DPP demo platform"}'::jsonb),

('Eclipse Tractus-X', 'https://github.com/eclipse-tractusx/digital-product-pass', 'active',
 '{"type": "Open Source Battery", "test_url": "https://raw.githubusercontent.com/eclipse-tractusx/digital-product-pass/main/dpp-backend/digitalproductpass/src/main/resources/static/samples/battery-pass-sample.json", "notes": "Sample JSON files for battery passports"}'::jsonb);

-- Phase 2: Add discovered DPPs for immediate testing
INSERT INTO discovered_dpps (crawl_target_id, url, fetch_status, json_ld) 
SELECT 
  id,
  metadata->>'test_url',
  'pending',
  NULL
FROM crawl_targets
WHERE metadata->>'test_url' IS NOT NULL;

-- Optional: Add some example analyzed data (mock data for UI testing)
-- Uncomment if you want to see example analytics immediately

/*
INSERT INTO analyzed_dpps (
  discovered_dpp_id,
  product_name,
  manufacturer,
  product_category,
  trust_score,
  completeness_score,
  certifications,
  field_count
)
SELECT 
  id,
  'Sample Product',
  'Test Manufacturer',
  'Battery',
  85.5,
  92.0,
  '["ISO 9001", "Carbon Neutral"]'::jsonb,
  25
FROM discovered_dpps
LIMIT 1;
*/

-- Verify insertion
SELECT 
  c.name,
  c.base_url,
  c.metadata->>'type' as type,
  c.metadata->>'test_url' as test_dpp_url,
  c.status
FROM crawl_targets c
ORDER BY c.created_at DESC;

