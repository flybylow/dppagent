import { NextRequest, NextResponse } from 'next/server'
import * as cheerio from 'cheerio'

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Fetch the DPP URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'DPP-Scanner-Agent/1.0',
        'Accept': 'application/ld+json, application/json, text/html, */*'
      },
      // Add timeout
      signal: AbortSignal.timeout(10000)
    })

    const contentType = response.headers.get('content-type')
    let data: any
    let extractedJsonLd: any[] = []

    // Parse response based on content type
    if (contentType?.includes('application/json') || contentType?.includes('application/ld+json')) {
      const text = await response.text()
      if (text.trim()) {
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          data = { raw: text, parseError: 'Failed to parse JSON' }
        }
      } else {
        data = { empty: true, message: 'Response was empty' }
      }
    } else if (contentType?.includes('text/html')) {
      const html = await response.text()
      
      // Use cheerio to properly parse HTML
      const $ = cheerio.load(html)
      
      // Extract all JSON-LD script tags
      $('script[type="application/ld+json"]').each((_, element) => {
        try {
          const jsonText = $(element).html()
          if (jsonText) {
            const parsed = JSON.parse(jsonText)
            extractedJsonLd.push(parsed)
          }
        } catch (error) {
          console.error('Failed to parse JSON-LD script:', error)
        }
      })

      // Try to extract __NEXT_DATA__ (Next.js apps)
      let nextData = null
      const nextDataScript = $('#__NEXT_DATA__').html()
      if (nextDataScript) {
        try {
          nextData = JSON.parse(nextDataScript)
          // Check if there's useful data in pageProps
          if (nextData?.props?.pageProps) {
            extractedJsonLd.push({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              source: 'next.js pageProps',
              data: nextData.props.pageProps
            })
          }
        } catch (error) {
          console.error('Failed to parse __NEXT_DATA__:', error)
        }
      }

      // If we found JSON-LD, use it
      if (extractedJsonLd.length > 0) {
        // If only one JSON-LD block, return it directly
        // If multiple, return as array
        data = extractedJsonLd.length === 1 ? extractedJsonLd[0] : extractedJsonLd
      } else {
        // No JSON-LD found, return HTML snippet + metadata
        const isNextJs = html.includes('/_next/static/') || html.includes('__NEXT_DATA__')
        const isReact = html.includes('react') || html.includes('id="root"') || html.includes('id="__next"')
        
        data = { 
          html: html.substring(0, 1000) + '...',
          title: $('title').text(),
          metaDescription: $('meta[name="description"]').attr('content'),
          ogTitle: $('meta[property="og:title"]').attr('content'),
          framework: isNextJs ? 'next.js' : isReact ? 'react' : 'unknown',
          note: isNextJs || isReact ? 'Client-side rendered app. Data may be loaded via API. Try .well-known endpoints or check network requests.' : undefined,
          nextData: nextData ? 'Found but no pageProps data' : undefined
        }
      }
    } else {
      // Handle other content types
      const text = await response.text()
      
      // Try to parse as JSON anyway (some servers mis-label content-type)
      try {
        data = JSON.parse(text)
      } catch {
        // Not JSON, return as text
        data = { 
          raw: text.substring(0, 2000),
          contentType,
          note: 'Non-JSON response'
        }
      }
    }

    // Check if data has JSON-LD structure
    const hasJsonLd = !!(
      data['@context'] || 
      data['@type'] || 
      data['@id'] ||
      (Array.isArray(data) && data.some(d => d['@context'] || d['@type']))
    )

    return NextResponse.json({
      success: true,
      status: response.status,
      statusText: response.statusText,
      contentType,
      headers: {
        'content-type': response.headers.get('content-type'),
        'content-length': response.headers.get('content-length'),
        'access-control-allow-origin': response.headers.get('access-control-allow-origin')
      },
      data,
      extractedJsonLd: extractedJsonLd.length > 0 ? extractedJsonLd : undefined,
      metadata: {
        url,
        fetchedAt: new Date().toISOString(),
        hasJsonLd,
        jsonLdBlocksFound: extractedJsonLd.length,
        dataSize: JSON.stringify(data).length
      }
    })

  } catch (error: any) {
    console.error('Test DPP error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message,
      type: error.name,
      fetchedAt: new Date().toISOString()
    }, { status: 500 })
  }
}

