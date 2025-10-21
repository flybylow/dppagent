-- DPP Scanner Agent - Initial Schema
-- MVP Database Schema
-- Created: October 21, 2025

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Table: crawl_targets
-- Purpose: Store competitor websites to monitor
-- ============================================================================
CREATE TABLE crawl_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  base_url TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_crawl_targets_status ON crawl_targets(status);
CREATE INDEX idx_crawl_targets_created ON crawl_targets(created_at DESC);

-- ============================================================================
-- Table: discovered_dpps
-- Purpose: Store all discovered DPP URLs and their data
-- ============================================================================
CREATE TABLE discovered_dpps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  crawl_target_id UUID REFERENCES crawl_targets(id) ON DELETE CASCADE,
  url TEXT NOT NULL UNIQUE,
  json_ld JSONB,
  fetch_status VARCHAR(20) DEFAULT 'pending' CHECK (fetch_status IN ('pending', 'fetching', 'completed', 'failed')),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fetched_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_discovered_dpps_status ON discovered_dpps(fetch_status);
CREATE INDEX idx_discovered_dpps_target ON discovered_dpps(crawl_target_id);
CREATE INDEX idx_discovered_dpps_url ON discovered_dpps USING hash(url);
CREATE INDEX idx_discovered_dpps_created ON discovered_dpps(created_at DESC);

-- ============================================================================
-- Table: analyzed_dpps
-- Purpose: Store analyzed intelligence from DPPs
-- ============================================================================
CREATE TABLE analyzed_dpps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovered_dpp_id UUID REFERENCES discovered_dpps(id) ON DELETE CASCADE,
  
  -- Product Info
  product_name VARCHAR(500),
  manufacturer VARCHAR(255),
  product_category VARCHAR(100),
  
  -- Scores
  trust_score DECIMAL(5,2),
  completeness_score DECIMAL(5,2),
  
  -- Extracted Data
  certifications JSONB,
  field_count INTEGER,
  
  -- Metadata
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_discovered_dpp FOREIGN KEY (discovered_dpp_id) 
    REFERENCES discovered_dpps(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_analyzed_dpps_trust_score ON analyzed_dpps(trust_score DESC);
CREATE INDEX idx_analyzed_dpps_manufacturer ON analyzed_dpps(manufacturer);
CREATE INDEX idx_analyzed_dpps_dpp ON analyzed_dpps(discovered_dpp_id);

-- ============================================================================
-- Functions
-- ============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_crawl_targets_updated_at 
  BEFORE UPDATE ON crawl_targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analyzed_dpps_updated_at 
  BEFORE UPDATE ON analyzed_dpps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Row Level Security (RLS)
-- Note: For MVP, we'll keep this simple. Adjust based on your auth needs.
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE crawl_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE discovered_dpps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyzed_dpps ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (MVP - adjust for production)
CREATE POLICY "Allow all for authenticated users" ON crawl_targets
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON discovered_dpps
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON analyzed_dpps
  FOR ALL USING (true);

-- ============================================================================
-- Seed Data (Optional - for testing)
-- ============================================================================

-- Uncomment to add sample competitor
-- INSERT INTO crawl_targets (name, base_url, status) VALUES
-- ('Example Competitor', 'https://example.com', 'active');

