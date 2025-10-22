'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

type SchemaSource = {
  id: string
  name: string
  base_url: string
  metadata: {
    type: string
    test_url: string
    format: string
    notes: string
  }
}

export default function SchemasPage() {
  const [sources, setSources] = useState<SchemaSource[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSchema, setSelectedSchema] = useState<any>(null)
  const [loadingSchema, setLoadingSchema] = useState<string | null>(null)

  useEffect(() => {
    loadSources()
  }, [])

  const loadSources = async () => {
    try {
      const { data, error } = await supabase
        .from('crawl_targets')
        .select('*')
        .in('metadata->>type', ['Schema', 'JSON-LD Context', 'DID Document', 'Documentation'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setSources(data || [])
    } catch (error) {
      console.error('Error loading sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSchema = async (source: SchemaSource) => {
    setLoadingSchema(source.id)
    
    try {
      const response = await fetch(source.metadata.test_url)
      const contentType = response.headers.get('content-type') || ''
      
      let data
      if (contentType.includes('json') || source.metadata.test_url.endsWith('.json') || source.metadata.test_url.endsWith('.jsonld')) {
        data = await response.json()
      } else {
        data = await response.text()
      }
      
      setSelectedSchema({
        source,
        data,
        contentType
      })
    } catch (error: any) {
      setSelectedSchema({
        source,
        error: error.message
      })
    } finally {
      setLoadingSchema(null)
    }
  }

  const categories = {
    'Schema': { icon: '📋', color: 'blue' },
    'JSON-LD Context': { icon: '🔗', color: 'purple' },
    'DID Document': { icon: '🆔', color: 'green' },
    'Documentation': { icon: '📚', color: 'amber' }
  }

  const groupedSources = sources.reduce((acc, source) => {
    const type = source.metadata?.type || 'Other'
    if (!acc[type]) acc[type] = []
    acc[type].push(source)
    return acc
  }, {} as Record<string, SchemaSource[]>)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-900">Schemas & Contexts</h2>
        <p className="mt-2 text-sm text-gray-600">
          JSON-LD contexts, schemas, and DID documents for validation and understanding
        </p>
      </div>

      {/* Info */}
      <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">What Are These?</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Schemas:</strong> Define the structure and required fields for DPPs</li>
              <li>• <strong>JSON-LD Contexts:</strong> Define what each field means (vocabulary)</li>
              <li>• <strong>DID Documents:</strong> Provide verification keys and service endpoints</li>
              <li>• <strong>Documentation:</strong> Standards and specifications</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Schema List */}
        <div className="space-y-6">
          {Object.entries(groupedSources).map(([category, items]) => {
            const config = categories[category as keyof typeof categories] || { icon: '📄', color: 'gray' }
            
            return (
              <div key={category} className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">{config.icon}</span>
                    {category}
                    <span className="ml-auto px-2 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
                      {items.length}
                    </span>
                  </h3>
                </div>
                <div className="divide-y divide-gray-200">
                  {items.map((source) => (
                    <div 
                      key={source.id}
                      className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => loadSchema(source)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm mb-1">
                            {source.name}
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">
                            {source.metadata.notes}
                          </p>
                          <code className="text-xs text-blue-600 break-all block">
                            {source.metadata.test_url}
                          </code>
                        </div>
                        <button
                          disabled={loadingSchema === source.id}
                          className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold bg-blue-100 hover:bg-blue-200 text-blue-700 rounded transition-colors disabled:opacity-50"
                        >
                          {loadingSchema === source.id ? 'Loading...' : 'Load →'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {loading && (
            <div className="text-center py-12">
              <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">Loading schemas...</p>
            </div>
          )}
        </div>

        {/* Right: Preview Panel */}
        <div className="sticky top-4 h-fit">
          {selectedSchema ? (
            <div className="bg-white border-2 border-green-500 shadow-xl rounded-xl overflow-hidden">
              <div className="px-6 py-4 bg-gradient-to-r from-green-500 to-green-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    {selectedSchema.source.name}
                  </h3>
                  <button
                    onClick={() => setSelectedSchema(null)}
                    className="text-white hover:text-gray-200"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-green-100 mt-1">
                  {selectedSchema.source.metadata.format}
                </p>
              </div>

              <div className="p-6">
                {selectedSchema.error ? (
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                    <svg className="mx-auto h-8 w-8 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-semibold text-red-900">Failed to Load</p>
                    <p className="text-xs text-red-700 mt-1">{selectedSchema.error}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Quick Info */}
                    {selectedSchema.data && typeof selectedSchema.data === 'object' && (
                      <div className="grid grid-cols-2 gap-3">
                        {selectedSchema.data['@context'] && (
                          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                            <div className="text-xs text-purple-600 font-semibold">Has Context</div>
                            <div className="text-sm font-bold text-purple-900">✓ Yes</div>
                          </div>
                        )}
                        {selectedSchema.data['@type'] && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <div className="text-xs text-blue-600 font-semibold">Type</div>
                            <div className="text-sm font-bold text-blue-900 truncate">
                              {selectedSchema.data['@type']}
                            </div>
                          </div>
                        )}
                        {selectedSchema.data.properties && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 font-semibold">Properties</div>
                            <div className="text-sm font-bold text-green-900">
                              {Object.keys(selectedSchema.data.properties).length}
                            </div>
                          </div>
                        )}
                        {selectedSchema.data.required && (
                          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
                            <div className="text-xs text-amber-600 font-semibold">Required</div>
                            <div className="text-sm font-bold text-amber-900">
                              {selectedSchema.data.required.length}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Full Data */}
                    <div className="bg-gray-50 rounded-lg border-2 border-gray-300 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Full Data</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(JSON.stringify(selectedSchema.data, null, 2))
                              alert('Copied to clipboard!')
                            }}
                            className="px-3 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                          >
                            📋 Copy
                          </button>
                          <button
                            onClick={() => {
                              const blob = new Blob([JSON.stringify(selectedSchema.data, null, 2)], { type: 'application/json' })
                              const url = URL.createObjectURL(blob)
                              const a = document.createElement('a')
                              a.href = url
                              a.download = `${selectedSchema.source.name.toLowerCase().replace(/\s+/g, '-')}.json`
                              a.click()
                            }}
                            className="px-3 py-1 text-xs font-semibold bg-gray-200 hover:bg-gray-300 text-gray-700 rounded transition-colors"
                          >
                            💾 Save
                          </button>
                        </div>
                      </div>
                      <pre className="text-xs bg-white p-4 rounded border border-gray-300 overflow-x-auto max-h-[600px] leading-relaxed">
                        {typeof selectedSchema.data === 'string' 
                          ? selectedSchema.data 
                          : JSON.stringify(selectedSchema.data, null, 2)}
                      </pre>
                    </div>

                    <a
                      href={selectedSchema.source.metadata.test_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 border-2 border-blue-300 text-sm font-semibold rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all"
                    >
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Original URL
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 font-medium">Select a schema to preview</p>
              <p className="text-sm text-gray-500 mt-1">Click any schema on the left to view its contents</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

