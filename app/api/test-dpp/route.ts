import { NextRequest, NextResponse } from 'next/server'

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

    // Parse response based on content type
    if (contentType?.includes('application/json') || contentType?.includes('application/ld+json')) {
      data = await response.json()
    } else if (contentType?.includes('text/html')) {
      const html = await response.text()
      
      // Try to extract JSON-LD from HTML
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is)
      if (jsonLdMatch) {
        try {
          data = JSON.parse(jsonLdMatch[1])
        } catch {
          data = { html: html.substring(0, 500) + '...' }
        }
      } else {
        data = { html: html.substring(0, 500) + '...' }
      }
    } else {
      data = await response.text()
    }

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
      metadata: {
        url,
        fetchedAt: new Date().toISOString(),
        hasJsonLd: !!data['@context'] || !!data['@type'],
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

