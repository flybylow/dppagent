import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types (will be auto-generated later)
export type CrawlTarget = {
  id: string
  name: string
  base_url: string
  status: 'active' | 'paused' | 'archived'
  created_at: string
}

export type DiscoveredDPP = {
  id: string
  crawl_target_id: string
  url: string
  json_ld: any
  fetch_status: 'pending' | 'fetching' | 'completed' | 'failed'
  created_at: string
  fetched_at?: string
}

export type AnalyzedDPP = {
  id: string
  discovered_dpp_id: string
  product_name?: string
  manufacturer?: string
  trust_score?: number
  completeness_score?: number
  certifications?: any
  field_count?: number
  analyzed_at: string
}

