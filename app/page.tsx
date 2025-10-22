'use client'

import { useState, useEffect } from 'react'
import { getRecentDpps, getDppStats } from '@/lib/scraper'
import ServiceEndpointFetcher from '@/components/ServiceEndpointFetcher'

type RecentDpp = {
  id: string
  url: string
  fetch_status: string
  json_ld: any
  error_message?: string
  created_at: string
  metadata?: any
  crawl_target?: { name: string }[]
}

const WORKING_EXAMPLES = [
  {
    name: 'Eclipse Battery Pass',
    url: 'https://raw.githubusercontent.com/eclipse-tractusx/digital-product-pass/main/dpp-backend/digitalproductpass/src/main/resources/static/samples/battery-pass-sample.json',
    type: 'Catena-X Battery',
    color: 'blue'
  },
  {
    name: 'Spherity DID Document',
    url: 'https://acme.dpp.spherity.com/battery/7be3b99c-33a3-4d72-a747-feeb2c2ed263/did.json',
    type: 'DID Document',
    color: 'purple'
  },
  {
    name: 'T-Shirt Schema',
    url: 'https://spherity.github.io/schemas/testing/breathable-t-shirt.json',
    type: 'JSON Schema',
    color: 'green'
  },
  {
    name: 'Battery Pass Schema',
    url: 'https://raw.githubusercontent.com/batterypass/BatteryPassDataModel/main/BatteryPass/gen/BatteryPass.jsonld',
    type: 'JSON-LD Schema',
    color: 'amber'
  }
]

export default function Home() {
  const [urlInput, setUrlInput] = useState('')
  const [isScraping, setIsScraping] = useState(false)
  const [scrapeResult, setScrapeResult] = useState<any>(null)
  const [recentDpps, setRecentDpps] = useState<RecentDpp[]>([])
  const [stats, setStats] = useState({ total: 0, successful: 0, failed: 0, last24h: 0 })
  const [selectedDpp, setSelectedDpp] = useState<RecentDpp | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [recentResult, statsResult] = await Promise.all([
      getRecentDpps(10),
      getDppStats()
    ])

    if (recentResult.success) {
      setRecentDpps(recentResult.data || [])
    }
    setStats(statsResult)
  }

  const handleScrape = async (url?: string) => {
    const targetUrl = url || urlInput
    if (!targetUrl) return

    setIsScraping(true)
    setScrapeResult(null)

    try {
      const response = await fetch('/api/scrape-dpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const result = await response.json()
      setScrapeResult(result)

      // Reload data if successful
      if (result.success) {
        await loadData()
        setUrlInput('')
      }
    } catch (error: any) {
      setScrapeResult({
        success: false,
        error: error.message
      })
    } finally {
      setIsScraping(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this DPP?')) return

    try {
      const response = await fetch('/api/delete-dpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        await loadData()
        setSelectedDpp(null)
      }
    } catch (error) {
      console.error('Delete failed:', error)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-900">DPP JSON-LD Scraper</h2>
        <p className="mt-2 text-sm text-gray-600">
          Fetch and store Digital Product Passport data from any URL or DID
        </p>
      </div>

      {/* Quick Fetch Tool */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Quick Fetch
        </h3>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleScrape()}
              placeholder="Paste DPP URL or DID (e.g., did:web:... or https://...)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
            />
            <button
              onClick={() => handleScrape()}
              disabled={isScraping || !urlInput}
              className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isScraping ? (
                <>
                  <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fetching...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Fetch DPP
                </>
              )}
            </button>
          </div>

          {/* Working Examples */}
          <div>
            <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-2">
              ⭐ Try These (Guaranteed to Work - Direct JSON)
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {WORKING_EXAMPLES.map((example) => (
                <button
                  key={example.url}
                  onClick={() => handleScrape(example.url)}
                  disabled={isScraping}
                  className={`p-3 text-left border-2 rounded-lg transition-all hover:scale-105 disabled:opacity-50 ${
                    example.color === 'blue' ? 'border-blue-200 bg-blue-50 hover:border-blue-400' :
                    example.color === 'purple' ? 'border-purple-200 bg-purple-50 hover:border-purple-400' :
                    example.color === 'green' ? 'border-green-200 bg-green-50 hover:border-green-400' :
                    'border-amber-200 bg-amber-50 hover:border-amber-400'
                  }`}
                >
                  <div className={`text-xs font-semibold mb-1 ${
                    example.color === 'blue' ? 'text-blue-900' :
                    example.color === 'purple' ? 'text-purple-900' :
                    example.color === 'green' ? 'text-green-900' :
                    'text-amber-900'
                  }`}>
                    {example.name}
                  </div>
                  <div className={`text-xs ${
                    example.color === 'blue' ? 'text-blue-700' :
                    example.color === 'purple' ? 'text-purple-700' :
                    example.color === 'green' ? 'text-green-700' :
                    'text-amber-700'
                  }`}>
                    {example.type}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Scrape Result */}
          {scrapeResult && (
            <div className={`p-4 rounded-xl border-2 ${
              scrapeResult.success 
                ? 'bg-gradient-to-br from-green-50 to-white border-green-200' 
                : 'bg-gradient-to-br from-red-50 to-white border-red-200'
            }`}>
              <div className="flex items-start gap-3 mb-3">
                <div className={`rounded-full p-2 flex-shrink-0 ${
                  scrapeResult.success ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {scrapeResult.success ? (
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <h4 className={`text-sm font-semibold mb-1 ${
                    scrapeResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {scrapeResult.success ? '✓ Successfully Scraped!' : '✗ Scraping Failed'}
                  </h4>
                  <p className={`text-sm ${
                    scrapeResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {scrapeResult.message}
                  </p>
                  {scrapeResult.format && (
                    <div className="mt-2">
                      <span className="px-2 py-1 text-xs font-medium bg-white border rounded">
                        {scrapeResult.format}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {scrapeResult.success && scrapeResult.data && (
                <details className="mt-3">
                  <summary className={`cursor-pointer text-sm font-medium hover:underline ${
                    scrapeResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    View Scraped Data ({(scrapeResult.size / 1024).toFixed(1)} KB)
                  </summary>
                  <pre className="mt-2 text-xs bg-white p-3 rounded border overflow-x-auto max-h-64">
                    {JSON.stringify(scrapeResult.data, null, 2)}
                  </pre>
                </details>
              )}

              {scrapeResult.error && (
                <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-900 mb-1">Error Details:</p>
                  <p className="text-xs text-red-700 mb-2">{scrapeResult.error}</p>
                  <div className="text-xs text-red-600">
                    <p className="font-semibold mb-1">Suggestions:</p>
                    <ul className="space-y-1 ml-4 list-disc">
                      <li>Try in DID Browser first (may need different Accept headers)</li>
                      <li>Check if URL requires parameters (?gtin=...)</li>
                      <li>Verify URL is accessible (not behind auth/firewall)</li>
                      <li>Use Test Lab's "Try API Discovery" to find working endpoints</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Service Endpoint Fetcher - Auto-detect DID Documents */}
              {scrapeResult.success && scrapeResult.serviceEndpoints && scrapeResult.serviceEndpoints.length > 0 && (
                <ServiceEndpointFetcher
                  endpoints={scrapeResult.serviceEndpoints}
                  parentDppId={scrapeResult.savedId}
                  onFetch={async (url, parentId) => {
                    await handleScrape(url, parentId)
                  }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 uppercase tracking-wide">Total DPPs</p>
              <p className="mt-2 text-3xl font-bold text-blue-900">{stats.total}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 uppercase tracking-wide">Successful</p>
              <p className="mt-2 text-3xl font-bold text-green-900">{stats.successful}</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 uppercase tracking-wide">Failed</p>
              <p className="mt-2 text-3xl font-bold text-red-900">{stats.failed}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6 hover:scale-[1.02] hover:shadow-xl transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">Last 24h</p>
              <p className="mt-2 text-3xl font-bold text-purple-900">{stats.last24h}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Scrapes
            {recentDpps.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {recentDpps.length}
              </span>
            )}
          </h3>
          <button
            onClick={loadData}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            ↻ Refresh
          </button>
        </div>

        {recentDpps.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-b-xl border-t-2 border-dashed border-gray-300">
            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="text-gray-500 font-medium">No DPPs scraped yet</p>
            <p className="text-sm text-gray-400 mt-1">Try one of the working examples above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {recentDpps.map((dpp) => (
              <div key={dpp.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                        dpp.fetch_status === 'completed'
                          ? 'bg-green-100 text-green-800 border border-green-300'
                          : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {dpp.fetch_status}
                      </span>
                      {dpp.metadata?.format && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                          {dpp.metadata.format}
                        </span>
                      )}
                      {dpp.crawl_target?.[0]?.name && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-800 rounded">
                          {dpp.crawl_target[0].name}
                        </span>
                      )}
                    </div>
                    <code className="text-sm text-gray-700 break-all block mb-1">
                      {dpp.url}
                    </code>
                    <p className="text-xs text-gray-500">
                      {new Date(dpp.created_at).toLocaleString()}
                      {dpp.metadata?.size && ` • ${(dpp.metadata.size / 1024).toFixed(1)} KB`}
                    </p>
                    {dpp.error_message && (
                      <p className="text-xs text-red-600 mt-1">Error: {dpp.error_message}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {dpp.json_ld && (
                      <button
                        onClick={() => setSelectedDpp(dpp)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="View Data"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(dpp.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data Viewer Modal */}
      {selectedDpp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedDpp(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">DPP Data</h3>
              <button
                onClick={() => setSelectedDpp(null)}
                className="text-white hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <div className="mb-4">
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">URL</label>
                <code className="text-sm text-blue-600 break-all block">
                  {selectedDpp.url}
                </code>
              </div>
              <div className="mb-4 flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(selectedDpp.json_ld, null, 2))
                    alert('Copied to clipboard!')
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition-colors"
                >
                  📋 Copy JSON
                </button>
                <button
                  onClick={() => {
                    const blob = new Blob([JSON.stringify(selectedDpp.json_ld, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = 'dpp-data.json'
                    a.click()
                  }}
                  className="px-4 py-2 text-sm font-semibold bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition-colors"
                >
                  💾 Download
                </button>
              </div>
              <pre className="text-xs bg-gray-50 p-4 rounded border-2 border-gray-300 overflow-x-auto leading-relaxed">
                {JSON.stringify(selectedDpp.json_ld, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
