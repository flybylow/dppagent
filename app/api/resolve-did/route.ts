import { NextRequest, NextResponse } from 'next/server'
import { convertDidToUrl } from '@/lib/dpp-utils'

/**
 * Resolve a DID and try multiple methods to get JSON-LD data
 */
export async function POST(request: NextRequest) {
  try {
    const { did } = await request.json()

    if (!did) {
      return NextResponse.json(
        { error: 'DID or URL is required' },
        { status: 400 }
      )
    }

    // Convert DID to HTTP if needed
    const httpUrl = did.startsWith('did:') ? convertDidToUrl(did) : did

    const results = []

    // Method 1: Try with Accept: application/ld+json
    try {
      const response = await fetch(httpUrl, {
        headers: {
          'Accept': 'application/ld+json',
          'User-Agent': 'DPP-Scanner-Agent/1.0'
        },
        signal: AbortSignal.timeout(10000)
      })

      const contentType = response.headers.get('content-type') || ''
      let data = null

      if (response.ok) {
        const text = await response.text()
        try {
          data = JSON.parse(text)
        } catch {
          data = { text: text.substring(0, 500) }
        }
      }

      results.push({
        method: 'Accept: application/ld+json',
        url: httpUrl,
        status: response.status,
        contentType,
        data: response.ok ? data : null,
        error: !response.ok ? `HTTP ${response.status}` : undefined
      })
    } catch (error: any) {
      results.push({
        method: 'Accept: application/ld+json',
        url: httpUrl,
        status: 0,
        error: error.message
      })
    }

    // Method 2: Try with Accept: application/json
    try {
      const response = await fetch(httpUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DPP-Scanner-Agent/1.0'
        },
        signal: AbortSignal.timeout(10000)
      })

      const contentType = response.headers.get('content-type') || ''
      let data = null

      if (response.ok && contentType.includes('json')) {
        data = await response.json()
      }

      results.push({
        method: 'Accept: application/json',
        url: httpUrl,
        status: response.status,
        contentType,
        data: response.ok && data ? data : null,
        error: !response.ok ? `HTTP ${response.status}` : undefined
      })
    } catch (error: any) {
      results.push({
        method: 'Accept: application/json',
        url: httpUrl,
        status: 0,
        error: error.message
      })
    }

    // Method 3: Try .well-known/did.json (Spherity standard)
    try {
      const urlObj = new URL(httpUrl)
      const didJsonUrl = `${urlObj.protocol}//${urlObj.host}/.well-known/did.json`

      const response = await fetch(didJsonUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DPP-Scanner-Agent/1.0'
        },
        signal: AbortSignal.timeout(5000)
      })

      let data = null
      if (response.ok) {
        data = await response.json()
      }

      results.push({
        method: '.well-known/did.json',
        url: didJsonUrl,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        data: response.ok ? data : null,
        error: !response.ok ? `HTTP ${response.status}` : undefined
      })
    } catch (error: any) {
      // Skip if can't parse URL
    }

    // Method 3b: Try .well-known/did-configuration.json  
    try {
      const urlObj = new URL(httpUrl)
      const didConfigUrl = `${urlObj.protocol}//${urlObj.host}/.well-known/did-configuration.json`

      const response = await fetch(didConfigUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'DPP-Scanner-Agent/1.0'
        },
        signal: AbortSignal.timeout(5000)
      })

      let data = null
      if (response.ok) {
        data = await response.json()
      }

      results.push({
        method: '.well-known/did-configuration',
        url: didConfigUrl,
        status: response.status,
        contentType: response.headers.get('content-type') || '',
        data: response.ok ? data : null,
        error: !response.ok ? `HTTP ${response.status}` : undefined
      })
    } catch (error: any) {
      // Skip if can't parse URL
    }

    // Method 4: Try adding .json extension
    if (!httpUrl.endsWith('.json')) {
      try {
        const jsonUrl = httpUrl + '.json'
        const response = await fetch(jsonUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DPP-Scanner-Agent/1.0'
          },
          signal: AbortSignal.timeout(5000)
        })

        let data = null
        if (response.ok) {
          data = await response.json()
        }

        results.push({
          method: 'Add .json extension',
          url: jsonUrl,
          status: response.status,
          contentType: response.headers.get('content-type') || '',
          data: response.ok ? data : null,
          error: !response.ok ? `HTTP ${response.status}` : undefined
        })
      } catch (error: any) {
        results.push({
          method: 'Add .json extension',
          url: httpUrl + '.json',
          status: 0,
          error: error.message
        })
      }
    }

    // Method 5: Try DID Document endpoint
    if (did.startsWith('did:')) {
      try {
        const didDocUrl = httpUrl + '/did.json'
        const response = await fetch(didDocUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'DPP-Scanner-Agent/1.0'
          },
          signal: AbortSignal.timeout(5000)
        })

        let data = null
        if (response.ok) {
          data = await response.json()
        }

        results.push({
          method: 'DID Document (/did.json)',
          url: didDocUrl,
          status: response.status,
          contentType: response.headers.get('content-type') || '',
          data: response.ok ? data : null,
          error: !response.ok ? `HTTP ${response.status}` : undefined
        })
      } catch (error: any) {
        // Skip
      }
    }

    // Find successful results
    const successful = results.filter(r => r.status === 200 && r.data)

    return NextResponse.json({
      did,
      httpUrl,
      results,
      summary: {
        totalAttempts: results.length,
        successful: successful.length,
        bestMethod: successful[0]?.method,
        bestUrl: successful[0]?.url
      }
    })

  } catch (error: any) {
    console.error('DID resolution error:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
}

