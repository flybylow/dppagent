'use client'

import { useState } from 'react'

type EndpointResult = {
  url: string
  pattern: string
  status: number
  contentType?: string
  data?: any
  preview?: string
  loading?: boolean
  error?: string
}

type EndpointExplorerProps = {
  discoveryResults: {
    results: Array<{
      pattern: string
      url: string
      status: number
      found: boolean
      contentType?: string
      data?: any
    }>
  }
}

export default function EndpointExplorer({ discoveryResults }: EndpointExplorerProps) {
  const [loadedEndpoints, setLoadedEndpoints] = useState<Map<string, EndpointResult>>(new Map())
  const [expandedUrl, setExpandedUrl] = useState<string | null>(null)

  const workingEndpoints = discoveryResults.results.filter(r => r.found)

  const loadEndpoint = async (endpoint: any) => {
    // Mark as loading
    setLoadedEndpoints(prev => new Map(prev).set(endpoint.url, {
      url: endpoint.url,
      pattern: endpoint.pattern,
      status: endpoint.status,
      loading: true
    }))

    try {
      // First, try direct fetch with better headers
      const directResponse = await fetch(endpoint.url, {
        headers: {
          'Accept': 'application/ld+json, application/json, */*',
          'User-Agent': 'DPP-Scanner-Agent/1.0'
        }
      })

      const contentType = directResponse.headers.get('content-type') || ''
      const text = await directResponse.text()
      
      let data = null
      let parseMethod = 'none'

      // Try to parse response
      if (text.trim()) {
        // Try JSON parse first
        try {
          data = JSON.parse(text)
          parseMethod = 'json'
        } catch {
          // Not JSON - return raw text
          data = {
            raw: text.substring(0, 1000),
            fullLength: text.length,
            note: text.length === 0 ? 'Empty response' : 'Non-JSON response'
          }
          parseMethod = 'text'
        }
      } else {
        data = { 
          empty: true, 
          message: 'Endpoint returned empty response. May require parameters (e.g., ?gtin=...)' 
        }
        parseMethod = 'empty'
      }
      
      setLoadedEndpoints(prev => new Map(prev).set(endpoint.url, {
        url: endpoint.url,
        pattern: endpoint.pattern,
        status: directResponse.status,
        contentType,
        data,
        parseMethod,
        loading: false
      }))
    } catch (error: any) {
      setLoadedEndpoints(prev => new Map(prev).set(endpoint.url, {
        url: endpoint.url,
        pattern: endpoint.pattern,
        status: 0,
        error: error.message,
        loading: false
      }))
    }
  }

  const loadAllEndpoints = async () => {
    for (const endpoint of workingEndpoints) {
      await loadEndpoint(endpoint)
      // Small delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return (
    <div className="space-y-4">
      {/* Header with Load All Button */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-blue-900">
          Endpoint Explorer ({workingEndpoints.length} endpoints)
        </h4>
        <button
          onClick={loadAllEndpoints}
          className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          🚀 Load All Endpoints
        </button>
      </div>

      {/* Endpoints Grid */}
      <div className="grid grid-cols-1 gap-3">
        {workingEndpoints.map((endpoint) => {
          const loaded = loadedEndpoints.get(endpoint.url)
          
          return (
            <div
              key={endpoint.url}
              className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Endpoint Header */}
              <div className="p-4 bg-blue-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-200 text-blue-900 rounded border border-blue-400">
                        {endpoint.pattern}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded">
                        {endpoint.status}
                      </span>
                    </div>
                    <code className="text-xs text-blue-700 break-all block">
                      {endpoint.url}
                    </code>
                  </div>
                  
                  <button
                    onClick={() => loadEndpoint(endpoint)}
                    disabled={loaded?.loading}
                    className="flex-shrink-0 px-3 py-1.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors disabled:opacity-50"
                  >
                    {loaded?.loading ? (
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : loaded ? (
                      '✓ Loaded'
                    ) : (
                      'Load →'
                    )}
                  </button>
                </div>
              </div>

              {/* Loaded Data */}
              {loaded && !loaded.loading && (
                <div className="p-4 border-t-2 border-blue-200">
                  {loaded.error ? (
                    <div className="text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                      Error: {loaded.error}
                    </div>
                  ) : loaded.data ? (
                    <div className="space-y-3">
                      {/* Quick Stats */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-500">Content Type</div>
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {loaded.contentType || 'unknown'}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-500">Size</div>
                          <div className="text-xs font-semibold text-gray-900">
                            {(JSON.stringify(loaded.data).length / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded border border-gray-200">
                          <div className="text-xs text-gray-500">Type</div>
                          <div className="text-xs font-semibold text-gray-900 truncate">
                            {loaded.data['@type'] || loaded.data.type || typeof loaded.data}
                          </div>
                        </div>
                      </div>

                      {/* Quick Preview */}
                      {loaded.data.empty ? (
                        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3">
                          <p className="text-sm text-amber-900 font-semibold mb-1">⚠️ Empty Response</p>
                          <p className="text-xs text-amber-700">{loaded.data.message}</p>
                          <div className="mt-2 text-xs text-amber-600">
                            <strong>Try:</strong>
                            <code className="block mt-1 bg-white px-2 py-1 rounded border border-amber-200">
                              {endpoint.url}?gtin=048001705920
                            </code>
                          </div>
                        </div>
                      ) : loaded.data.raw && !loaded.data['@context'] ? (
                        <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                          <p className="text-sm text-blue-900 font-semibold mb-1">📄 Non-JSON Response</p>
                          <p className="text-xs text-blue-700 mb-2">
                            Content-Type: {loaded.contentType}
                          </p>
                          <details>
                            <summary className="text-xs text-blue-700 cursor-pointer hover:text-blue-900">
                              View Raw Response
                            </summary>
                            <pre className="mt-2 text-xs bg-white p-2 rounded border border-blue-200 overflow-x-auto max-h-32">
                              {loaded.data.raw}
                            </pre>
                          </details>
                        </div>
                      ) : null}

                      {/* Preview */}
                      <div>
                        <button
                          onClick={() => setExpandedUrl(expandedUrl === endpoint.url ? null : endpoint.url)}
                          className="w-full text-left px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center justify-between"
                        >
                          <span className="text-sm font-medium text-gray-900">
                            {expandedUrl === endpoint.url ? '▼ Hide Data' : '▶ View Full Data'}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(JSON.stringify(loaded.data, null, 2))
                                alert('Copied!')
                              }}
                              className="px-2 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-300 rounded"
                            >
                              📋 Copy
                            </button>
                          </div>
                        </button>
                        
                        {expandedUrl === endpoint.url && (
                          <pre className="mt-2 text-xs bg-white p-3 rounded border-2 border-gray-300 overflow-x-auto max-h-96 leading-relaxed">
                            {JSON.stringify(loaded.data, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">No data returned</p>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

