/**
 * DPP Scraper Service
 * Handles fetching, parsing, and storing DPP data
 */

import { supabase } from './supabase'
import { convertDidToUrl, detectDppFormat } from './dpp-utils'
import * as cheerio from 'cheerio'

export type ScrapeResult = {
  success: boolean
  url: string
  data?: any
  format?: string
  contentType?: string
  extractionMethod?: string
  error?: string
  size?: number
}

/**
 * Scrape a DPP from a URL or DID
 */
export async function scrapeDpp(url: string): Promise<ScrapeResult> {
  try {
    // Convert DID to HTTP if needed
    const httpUrl = url.startsWith('did:') ? convertDidToUrl(url) : url

    // Try multiple methods to get JSON
    const methods = [
      { name: 'application/ld+json', header: 'application/ld+json' },
      { name: 'application/json', header: 'application/json' },
      { name: 'default', header: '*/*' }
    ]

    for (const method of methods) {
      try {
        const response = await fetch(httpUrl, {
          headers: {
            'Accept': method.header,
            'User-Agent': 'DPP-Scanner-Agent/1.0'
          },
          signal: AbortSignal.timeout(10000)
        })

        if (!response.ok) continue

        const contentType = response.headers.get('content-type') || ''
        const text = await response.text()

        if (!text.trim()) continue

        let data: any
        let extractionMethod = 'none'

        // Check if URL looks like JSON (by extension)
        const urlLooksLikeJson = httpUrl.match(/\.(json|jsonld)(\?|$)/i)

        // Parse based on content type OR file extension
        if (contentType.includes('json') || urlLooksLikeJson) {
          try {
            data = JSON.parse(text)
            extractionMethod = method.name === 'application/ld+json' ? 'content_negotiation_ld' : 'direct_json'
          } catch (parseError) {
            // If URL looks like JSON but parsing failed, this is a real error
            if (urlLooksLikeJson) {
              console.error('Failed to parse JSON from URL that looks like JSON:', httpUrl, parseError)
            }
            continue
          }
        } else if (contentType.includes('html')) {
          // Extract JSON-LD from HTML
          const $ = cheerio.load(text)
          const jsonLdBlocks: any[] = []

          $('script[type="application/ld+json"]').each((_, element) => {
            try {
              const jsonText = $(element).html()
              if (jsonText) {
                jsonLdBlocks.push(JSON.parse(jsonText))
              }
            } catch {}
          })

          if (jsonLdBlocks.length > 0) {
            data = jsonLdBlocks.length === 1 ? jsonLdBlocks[0] : jsonLdBlocks
            extractionMethod = 'html_script_tag'
          } else {
            // Try __NEXT_DATA__
            const nextDataScript = $('#__NEXT_DATA__').html()
            if (nextDataScript) {
              try {
                const nextData = JSON.parse(nextDataScript)
                if (nextData?.props?.pageProps) {
                  data = nextData.props.pageProps
                  extractionMethod = 'next_data'
                }
              } catch {}
            }
          }
        } else {
          // Try to parse as JSON anyway
          try {
            data = JSON.parse(text)
            extractionMethod = 'force_json_parse'
          } catch {
            continue
          }
        }

        if (data) {
          const format = detectDppFormat(data, contentType)
          const size = JSON.stringify(data).length

          return {
            success: true,
            url: httpUrl,
            data,
            format,
            contentType,
            extractionMethod,
            size
          }
        }
      } catch (error) {
        continue
      }
    }

    // If we got here, no method worked
    return {
      success: false,
      url: httpUrl,
      error: 'Failed to fetch or parse DPP data. Tried all methods: content negotiation (ld+json, json), HTML parsing, Next.js data extraction. URL may be protected, require auth, or not contain structured data.'
    }

  } catch (error: any) {
    return {
      success: false,
      url,
      error: error.message || 'Unknown error during scraping'
    }
  }
}

/**
 * Save scraped DPP to database
 */
export async function saveToDatabase(
  url: string,
  scrapeResult: ScrapeResult
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // Try to find matching crawl_target
    const { data: targets } = await supabase
      .from('crawl_targets')
      .select('id, base_url')
    
    let crawlTargetId = null
    if (targets) {
      const match = targets.find(t => url.startsWith(t.base_url))
      if (match) crawlTargetId = match.id
    }

    // Insert into discovered_dpps
    const { data, error } = await supabase
      .from('discovered_dpps')
      .insert({
        crawl_target_id: crawlTargetId,
        url,
        json_ld: scrapeResult.success ? scrapeResult.data : null,
        fetch_status: scrapeResult.success ? 'completed' : 'failed',
        error_message: scrapeResult.error || null,
        fetched_at: new Date().toISOString(),
        metadata: {
          format: scrapeResult.format,
          content_type: scrapeResult.contentType,
          extraction_method: scrapeResult.extractionMethod,
          size: scrapeResult.size,
          scraped_from_dashboard: true
        }
      })
      .select()
      .single()

    if (error) throw error

    return { success: true, id: data.id }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get recent scraped DPPs
 */
export async function getRecentDpps(limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('discovered_dpps')
      .select(`
        id,
        url,
        fetch_status,
        json_ld,
        error_message,
        created_at,
        fetched_at,
        metadata,
        crawl_target:crawl_targets(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return { success: true, data }
  } catch (error: any) {
    return { success: false, error: error.message, data: [] }
  }
}

/**
 * Delete a DPP by ID
 */
export async function deleteDpp(id: string) {
  try {
    const { error } = await supabase
      .from('discovered_dpps')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get DPP statistics
 */
export async function getDppStats() {
  try {
    const { count: total } = await supabase
      .from('discovered_dpps')
      .select('*', { count: 'exact', head: true })

    const { count: successful } = await supabase
      .from('discovered_dpps')
      .select('*', { count: 'exact', head: true })
      .eq('fetch_status', 'completed')

    const { count: failed } = await supabase
      .from('discovered_dpps')
      .select('*', { count: 'exact', head: true })
      .eq('fetch_status', 'failed')

    const { count: last24h } = await supabase
      .from('discovered_dpps')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    return {
      total: total || 0,
      successful: successful || 0,
      failed: failed || 0,
      last24h: last24h || 0
    }
  } catch (error) {
    return { total: 0, successful: 0, failed: 0, last24h: 0 }
  }
}

