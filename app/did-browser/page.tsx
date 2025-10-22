'use client'

import { useState } from 'react'
import { convertDidToUrl } from '@/lib/dpp-utils'

type ResolveResult = {
  did: string
  httpUrl: string
  results: {
    method: string
    url: string
    status: number
    contentType?: string
    data?: any
    error?: string
  }[]
}

export default function DidBrowserPage() {
  const [didInput, setDidInput] = useState('did:web:acme.dpp.spherity.com:battery:7be3b99c-33a3-4d72-a747-feeb2c2ed263')
  const [result, setResult] = useState<ResolveResult | null>(null)
  const [isResolving, setIsResolving] = useState(false)
  const [previewData, setPreviewData] = useState<any>(null)
  const [serviceEndpoints, setServiceEndpoints] = useState<any[]>([])
  const [isLoadingEndpoint, setIsLoadingEndpoint] = useState(false)

  const resolveDid = async () => {
    setIsResolving(true)
    setResult(null)
    setPreviewData(null)
    setServiceEndpoints([])

    try {
      const response = await fetch('/api/resolve-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: didInput })
      })

      const data = await response.json()
      setResult(data)

      // Auto-load the best result
      const bestResult = data.results.find((r: any) => r.status === 200 && r.data)
      if (bestResult?.data) {
        setPreviewData(bestResult.data)
        
        // Check if it's a DID Document with service endpoints
        if (bestResult.data.service && Array.isArray(bestResult.data.service)) {
          setServiceEndpoints(bestResult.data.service)
        }
      }
    } catch (error: any) {
      console.error('DID resolution failed:', error)
    } finally {
      setIsResolving(false)
    }
  }

  const loadServiceEndpoint = async (endpoint: any) => {
    setIsLoadingEndpoint(true)
    
    try {
      const response = await fetch('/api/resolve-did', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ did: endpoint.serviceEndpoint })
      })

      const data = await response.json()
      const bestResult = data.results.find((r: any) => r.status === 200 && r.data)
      
      if (bestResult?.data) {
        setPreviewData(bestResult.data)
      }
    } catch (error: any) {
      console.error('Service endpoint fetch failed:', error)
    } finally {
      setIsLoadingEndpoint(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-900">DID Browser & JSON-LD Inspector</h2>
        <p className="mt-2 text-sm text-gray-600">
          Resolve Decentralized Identifiers and inspect JSON-LD data
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-purple-100 rounded-full p-2 flex-shrink-0">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-purple-900 mb-2">What This Does</h4>
            <ul className="text-sm text-purple-700 space-y-1">
              <li>• Converts DID URLs to HTTP URLs</li>
              <li>• Tries multiple Accept headers to get JSON instead of HTML</li>
              <li>• Tests .well-known/did-configuration</li>
              <li>• Shows you the actual JSON-LD data</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6">
        <label className="block text-sm font-semibold text-gray-900 mb-3">
          Enter DID or HTTP URL
        </label>
        <div className="flex gap-3">
          <input
            type="text"
            value={didInput}
            onChange={(e) => setDidInput(e.target.value)}
            placeholder="did:web:example.com:product:123 or https://..."
            className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button
            onClick={resolveDid}
            disabled={isResolving || !didInput}
            className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
          >
            {isResolving ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Resolving...
              </>
            ) : (
              <>
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Resolve
              </>
            )}
          </button>
        </div>

        {/* Quick Examples */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setDidInput('did:web:acme.dpp.spherity.com:battery:7be3b99c-33a3-4d72-a747-feeb2c2ed263')}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Try Spherity Battery DID
          </button>
          <button
            onClick={() => setDidInput('https://acme.dpp.spherity.com/battery/7be3b99c-33a3-4d72-a747-feeb2c2ed263')}
            className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            Try HTTP URL
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Conversion Info */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">Resolution Path</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                  Original Input
                </label>
                <code className="text-sm text-blue-600 block bg-white px-3 py-2 rounded border border-blue-300 break-all">
                  {result.did}
                </code>
              </div>
              {result.did !== result.httpUrl && (
                <>
                  <div className="flex items-center justify-center text-blue-600">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide block mb-1">
                      Converted to HTTP
                    </label>
                    <code className="text-sm text-green-600 block bg-white px-3 py-2 rounded border border-green-300 break-all">
                      {result.httpUrl}
                    </code>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Resolution Attempts */}
          <div className="bg-white border border-gray-200 shadow-lg rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Resolution Attempts ({result.results.length})
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {result.results.map((attempt, index) => (
                <div key={index} className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                          attempt.status === 200
                            ? 'bg-green-100 text-green-800 border border-green-300'
                            : 'bg-red-100 text-red-800 border border-red-300'
                        }`}>
                          {attempt.status === 200 ? '✓ Success' : `✗ ${attempt.status || 'Failed'}`}
                        </span>
                        <span className="px-2.5 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full border border-blue-300">
                          {attempt.method}
                        </span>
                      </div>
                      <code className="text-sm text-gray-700 block break-all">
                        {attempt.url}
                      </code>
                      {attempt.contentType && (
                        <p className="text-xs text-gray-500 mt-1">
                          Content-Type: {attempt.contentType}
                        </p>
                      )}
                    </div>
                  </div>

                  {attempt.data && (
                    <div className="mt-3">
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-green-700 hover:text-green-900 flex items-center gap-1">
                          <svg className="h-4 w-4 group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          📄 View JSON-LD Data ({JSON.stringify(attempt.data).length} bytes)
                        </summary>
                        <pre className="mt-2 text-xs bg-gray-50 p-4 rounded border border-gray-300 overflow-x-auto max-h-96">
                          {JSON.stringify(attempt.data, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {attempt.error && (
                    <div className="mt-3 text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200">
                      {attempt.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Service Endpoints (if DID Document) */}
          {serviceEndpoints.length > 0 && (
            <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-6">
              <h3 className="text-lg font-bold text-amber-900 mb-3 flex items-center gap-2">
                <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                🔗 Found {serviceEndpoints.length} Service Endpoint{serviceEndpoints.length > 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-amber-700 mb-4">
                This is a DID Document! Service endpoints tell you where to get the actual product data.
              </p>
              <div className="space-y-3">
                {serviceEndpoints.map((endpoint, index) => (
                  <div key={index} className="bg-white border-2 border-amber-300 rounded-lg p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded border border-amber-300">
                          {endpoint.type}
                        </span>
                        <code className="text-sm text-amber-700 block mt-2 break-all">
                          {endpoint.serviceEndpoint}
                        </code>
                      </div>
                      <button
                        onClick={() => loadServiceEndpoint(endpoint)}
                        disabled={isLoadingEndpoint}
                        className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50"
                      >
                        {isLoadingEndpoint ? 'Loading...' : 'Fetch →'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Preview */}
          {previewData && (
            <div className="bg-white border-2 border-green-500 shadow-xl rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  JSON-LD Data Preview
                </h3>
              </div>
              <div className="p-6">
                {/* Quick Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {previewData['@type'] && (
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="text-xs text-blue-600 font-semibold">Type</div>
                      <div className="text-sm font-bold text-blue-900">{previewData['@type']}</div>
                    </div>
                  )}
                  {previewData.id && (
                    <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div className="text-xs text-purple-600 font-semibold">Has ID</div>
                      <div className="text-sm font-bold text-purple-900">✓ Yes</div>
                    </div>
                  )}
                  {previewData.service && (
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                      <div className="text-xs text-amber-600 font-semibold">Services</div>
                      <div className="text-sm font-bold text-amber-900">{previewData.service.length}</div>
                    </div>
                  )}
                  {previewData.verificationMethod && (
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="text-xs text-green-600 font-semibold">Verifiable</div>
                      <div className="text-sm font-bold text-green-900">✓ Yes</div>
                    </div>
                  )}
                </div>

                {/* Full JSON */}
                <div className="bg-gray-50 rounded-lg border-2 border-gray-300 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">Full Data</h4>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(previewData, null, 2))
                        alert('Copied to clipboard!')
                      }}
                      className="px-3 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                    >
                      📋 Copy
                    </button>
                  </div>
                  <pre className="text-xs bg-white p-4 rounded border border-gray-300 overflow-x-auto max-h-[500px] leading-relaxed">
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(previewData, null, 2)], { type: 'application/json' })
                      const url = URL.createObjectURL(blob)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = 'dpp-data.json'
                      a.click()
                    }}
                    className="inline-flex items-center px-4 py-2 border-2 border-green-300 text-sm font-semibold rounded-lg text-green-700 bg-green-50 hover:bg-green-100 transition-all"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download JSON
                  </button>
                  
                  {previewData['@id'] && (
                    <a
                      href={previewData['@id'].startsWith('did:') ? convertDidToUrl(previewData['@id']) : previewData['@id']}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border-2 border-blue-300 text-sm font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open in Browser
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Test DIDs */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Test DIDs</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              name: 'Spherity Battery DID',
              did: 'did:web:acme.dpp.spherity.com:battery:7be3b99c-33a3-4d72-a747-feeb2c2ed263',
              type: 'Battery VC'
            },
            {
              name: 'Spherity Textile DID',
              did: 'did:web:20230614.dpp.spherity.com:textile:sample-uuid',
              type: 'Textile VC'
            },
            {
              name: 'Spherity DID Document',
              did: 'https://20230614.dpp.spherity.com/.well-known/did.json',
              type: 'DID Doc'
            },
            {
              name: 'Spherity Schema',
              did: 'https://spherity.github.io/schemas/testing/breathable-t-shirt.json',
              type: 'Schema'
            },
            {
              name: 'Eclipse (Direct JSON)',
              did: 'https://raw.githubusercontent.com/eclipse-tractusx/digital-product-pass/main/dpp-backend/digitalproductpass/src/main/resources/static/samples/battery-pass-sample.json',
              type: 'Direct JSON'
            },
            {
              name: 'GoDiddy Resolver',
              did: 'https://godiddy.com/did/did:web:20230614.dpp.spherity.com',
              type: 'Resolver'
            }
          ].map((example) => (
            <button
              key={example.did}
              onClick={() => setDidInput(example.did)}
              className="text-left p-4 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all duration-200"
            >
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{example.name}</h4>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                  {example.type}
                </span>
              </div>
              <code className="text-xs text-gray-600 break-all">
                {example.did}
              </code>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

