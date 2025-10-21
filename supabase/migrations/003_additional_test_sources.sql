-- Additional Test Sources - More DPP Formats
-- Includes Verifiable Credentials, Textile, Fashion, and more GS1 examples

INSERT INTO crawl_targets (name, base_url, status, metadata) VALUES

-- Spherity T-Shirt (Textile/Verifiable Credential)
('Spherity T-Shirt', 'https://dpp.spherity.com', 'active',
 '{"type": "Textile", "test_url": "https://dpp.spherity.com/textile/sample", "notes": "Textile composition, sustainability data, Verifiable Credential format", "did_format": "did:web:dpp.spherity.com:textile:[UUID]", "format": "Verifiable Credential"}'::jsonb),

-- Nobody's Child (Fashion DPP)
('Nobodys Child', 'https://www.nobodyschild.com', 'active',
 '{"type": "Fashion", "test_url": "https://www.nobodyschild.com", "notes": "Fashion brand using Fabacus/Xelacore DPP platform. Look for QR codes on product pages.", "format": "QR-based DPP", "platform": "Fabacus/Xelacore"}'::jsonb),

-- Additional real SmartLabel products
('Unilever Dove Bar (GTIN)', 'https://smartlabel.unileverusa.com', 'active',
 '{"type": "Consumer Goods", "test_url": "https://smartlabel.unileverusa.com/048001705920-0001-en-US/index.html", "gtin": "048001705920", "notes": "Real Dove Beauty Bar product with full ingredient and sustainability data", "format": "GS1 SmartLabel"}'::jsonb),

('Hersheys Reeses (GTIN)', 'https://smartlabel.hersheys.com', 'active',
 '{"type": "Food", "test_url": "https://smartlabel.hersheys.com/034000288007-0012-en-US/index.html", "gtin": "034000288007", "notes": "Reeses Peanut Butter Cups - nutrition, ingredients, sustainability", "format": "GS1 SmartLabel"}'::jsonb),

-- Reference DID URL example for Spherity Battery
('Spherity Battery (DID)', 'https://acme.dpp.spherity.com', 'active',
 '{"type": "Battery", "test_url": "https://acme.dpp.spherity.com/battery/7be3b99c-33a3-4d72-a747-feeb2c2ed263", "did_url": "did:web:acme.dpp.spherity.com:battery:7be3b99c-33a3-4d72-a747-feeb2c2ed263", "notes": "Battery DPP with DID identifier support", "format": "Verifiable Credential"}'::jsonb);

-- View all sources with format information
SELECT 
  name,
  metadata->>'type' as type,
  metadata->>'format' as format,
  metadata->>'test_url' as test_url,
  metadata->>'did_url' as did_url
FROM crawl_targets
ORDER BY created_at DESC;

