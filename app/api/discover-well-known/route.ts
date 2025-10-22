import { NextRequest, NextResponse } from 'next/server'

/**
 * Try to discover DPP data via .well-known endpoints
 */
export async function POST(request: NextRequest) {
  try {
    const { baseUrl } = await request.json()

    if (!baseUrl) {
      return NextResponse.json(
        { error: 'baseUrl is required' },
        { status: 400 }
      )
    }

    // Extract domain from URL
    const urlObj = new URL(baseUrl)
    const domain = `${urlObj.protocol}//${urlObj.host}`

    // Patterns to try
    const patterns = [
      '/.well-known/dpp-configuration',
      '/.well-known/dppdata',
      '/.well-known/did-configuration.json',
      '/api/dpp',
      '/api/v1/dpp',
      '/api/passports',
      '/dpp/api',
      '/.well-known/gs1resolver'
    ]

    const results = []

    for (const pattern of patterns) {
      const testUrl = domain + pattern
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/ld+json, application/json, */*',
            'User-Agent': 'DPP-Scanner-Agent/1.0'
          },
          signal: AbortSignal.timeout(5000)
        })

        const data = response.ok ? await response.text() : null
        
        results.push({
          pattern,
          url: testUrl,
          status: response.status,
          found: response.ok,
          contentType: response.headers.get('content-type'),
          size: data ? data.length : 0,
          preview: data ? data.substring(0, 200) : null
        })

        // If we found something, parse it
        if (response.ok && data) {
          try {
            const parsed = JSON.parse(data)
            results[results.length - 1].data = parsed
          } catch {
            // Not JSON, that's okay
          }
        }

      } catch (error: any) {
        results.push({
          pattern,
          url: testUrl,
          status: 0,
          found: false,
          error: error.message
        })
      }
    }

    const foundEndpoints = results.filter(r => r.found)

    return NextResponse.json({
      success: true,
      baseUrl: domain,
      patternsChecked: patterns.length,
      endpointsFound: foundEndpoints.length,
      results,
      recommendations: foundEndpoints.length > 0 
        ? `Found ${foundEndpoints.length} endpoint(s)! Try: ${foundEndpoints[0].url}`
        : 'No .well-known endpoints found. May need browser automation or contact site owner.'
    })

  } catch (error: any) {
    console.error('Discovery error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

