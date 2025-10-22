'use client'

import { useState } from 'react'

interface ServiceEndpoint {
  id: string
  type: string
  serviceEndpoint: string
}

interface Props {
  endpoints: ServiceEndpoint[]
  parentDppId?: string
  onFetch?: (url: string, parentDppId?: string) => Promise<void>
}

export default function ServiceEndpointFetcher({ endpoints, parentDppId, onFetch }: Props) {
  const [fetching, setFetching] = useState<string | null>(null)
  const [fetchingAll, setFetchingAll] = useState(false)

  if (!endpoints || endpoints.length === 0) {
    return null
  }

  const handleFetch = async (url: string) => {
    setFetching(url)
    try {
      if (onFetch) {
        await onFetch(url, parentDppId)
      }
    } finally {
      setFetching(null)
    }
  }

  const handleFetchAll = async () => {
    setFetchingAll(true)
    try {
      for (const endpoint of endpoints) {
        if (onFetch) {
          await onFetch(endpoint.serviceEndpoint, parentDppId)
        }
      }
    } finally {
      setFetchingAll(false)
    }
  }

  return (
    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6 mt-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="text-lg font-bold text-amber-900 mb-1">
            🔗 Found {endpoints.length} Service Endpoint{endpoints.length !== 1 ? 's' : ''}
          </h4>
          <p className="text-sm text-amber-700">
            This DID Document points to actual product data. Fetch the endpoints to get complete DPP information.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {endpoints.map((endpoint, index) => (
          <div
            key={endpoint.id || index}
            className="bg-white border border-amber-300 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800">
                    {endpoint.type}
                  </span>
                  {endpoint.type === 'ProductPassport' && (
                    <span className="text-xs text-amber-600">← Main Product Data</span>
                  )}
                </div>
                <code className="text-xs text-gray-600 break-all block">
                  {endpoint.serviceEndpoint}
                </code>
              </div>
              <button
                onClick={() => handleFetch(endpoint.serviceEndpoint)}
                disabled={fetching === endpoint.serviceEndpoint || fetchingAll}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 
                         disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-semibold
                         whitespace-nowrap transition-colors"
              >
                {fetching === endpoint.serviceEndpoint ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Fetching...
                  </span>
                ) : (
                  'Fetch Product Data →'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {endpoints.length > 1 && (
        <div className="mt-4 pt-4 border-t border-amber-300">
          <button
            onClick={handleFetchAll}
            disabled={fetchingAll || fetching !== null}
            className="w-full px-6 py-3 bg-amber-700 text-white rounded-lg hover:bg-amber-800 
                     disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold
                     transition-colors flex items-center justify-center gap-2"
          >
            {fetchingAll ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Fetching All Endpoints...
              </>
            ) : (
              <>
                🚀 Fetch All {endpoints.length} Endpoints
              </>
            )}
          </button>
        </div>
      )}

      <div className="mt-4 text-xs text-amber-700 bg-amber-100 rounded p-3">
        <p className="font-semibold mb-1">💡 What happens next:</p>
        <ul className="space-y-1 ml-4 list-disc">
          <li>Each endpoint will be fetched with proper headers (Accept: application/ld+json)</li>
          <li>Product data will be saved to the database</li>
          <li>Results will appear in "Recent Scrapes" section below</li>
          <li>You can view, download, or delete the scraped data</li>
        </ul>
      </div>
    </div>
  )
}

