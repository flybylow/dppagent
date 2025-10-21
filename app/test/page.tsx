'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { convertDidToUrl, detectDppFormat } from '@/lib/dpp-utils'
import LinkExpander from '@/components/LinkExpander'

type TestTarget = {
  id: string
  name: string
  base_url: string
  metadata: {
    type: string
    test_url: string
    notes: string
    format?: string
    did_url?: string
    gtin?: string
  }
}

export default function TestPage() {
  const [targets, setTargets] = useState<TestTarget[]>([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<Record<string, any>>({})
  const [testingId, setTestingId] = useState<string | null>(null)

  useEffect(() => {
    loadTestTargets()
  }, [])

  const loadTestTargets = async () => {
    try {
      const { data, error } = await supabase
        .from('crawl_targets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setTargets(data || [])
    } catch (error) {
      console.error('Error loading targets:', error)
    } finally {
      setLoading(false)
    }
  }

  const testUrl = async (target: TestTarget) => {
    setTestingId(target.id)
    let testUrl = target.metadata?.test_url || target.base_url

    // Convert DID URL to HTTP if needed
    if (target.metadata?.did_url) {
      testUrl = convertDidToUrl(target.metadata.did_url)
    }

    try {
      // Test 1: Fetch the URL
      const response = await fetch('/api/test-dpp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: testUrl })
      })

      const result = await response.json()
      
      // Detect format from the result
      const detectedFormat = result.data ? detectDppFormat(result.data, result.contentType) : 'Unknown'
      
      setTestResults(prev => ({
        ...prev,
        [target.id]: {
          success: response.ok,
          status: response.status,
          data: result,
          detectedFormat,
          timestamp: new Date().toISOString()
        }
      }))
    } catch (error: any) {
      setTestResults(prev => ({
        ...prev,
        [target.id]: {
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }))
    } finally {
      setTestingId(null)
    }
  }

  const testWellKnown = async (baseUrl: string) => {
    const patterns = [
      '/.well-known/dpp-configuration',
      '/.well-known/dppdata',
      '/api/dpp/v1/',
      '/dpp/api/'
    ]

    const results = []
    for (const pattern of patterns) {
      const testUrl = baseUrl + pattern
      try {
        const response = await fetch('/api/test-dpp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: testUrl })
        })
        results.push({
          pattern,
          status: response.status,
          found: response.ok
        })
      } catch (error) {
        results.push({
          pattern,
          status: 'error',
          found: false
        })
      }
    }

    return results
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-900">DPP Testing Lab</h2>
        <p className="mt-2 text-sm text-gray-600">
          Test real-world DPP URLs and discovery methods
        </p>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Real DPP Sources</h4>
            <p className="text-sm text-blue-700 mb-2">
              These are real, live Digital Product Passports from various industries:
            </p>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Spherity:</strong> Battery DPP with full JSON-LD</li>
              <li>• <strong>SmartLabel:</strong> Consumer goods (Unilever, Hersheys)</li>
              <li>• <strong>Tappr:</strong> Interactive demo platform</li>
              <li>• <strong>Eclipse:</strong> Open source battery passport samples</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Test Targets */}
      {loading ? (
        <div className="text-center py-12">
          <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500">Loading test targets...</p>
        </div>
      ) : targets.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-gray-700 font-semibold mb-2">No test data found</p>
          <p className="text-sm text-gray-500 mb-4">
            Run the test data SQL migration to populate real DPP sources
          </p>
          <div className="bg-gray-50 rounded-lg p-4 text-left max-w-2xl mx-auto">
            <code className="text-xs text-gray-700">
              See: /supabase/migrations/002_test_data.sql
            </code>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {targets.map((target) => (
            <div key={target.id} className="bg-white border border-gray-200 shadow-lg rounded-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{target.name}</h3>
                      {target.metadata?.type && (
                        <span className="px-2.5 py-1 text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200 rounded-full">
                          {target.metadata.type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{target.base_url}</p>
                    {target.metadata?.notes && (
                      <p className="text-sm text-gray-500 italic">{target.metadata.notes}</p>
                    )}
                  </div>
                </div>

                {/* Test URL */}
                {target.metadata?.test_url && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1">
                      Test URL
                    </label>
                    <code className="text-sm text-blue-600 break-all block mb-2">
                      {target.metadata.test_url}
                    </code>
                    {target.metadata.did_url && (
                      <>
                        <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide block mb-1 mt-2">
                          DID URL
                        </label>
                        <code className="text-sm text-purple-600 break-all block">
                          {target.metadata.did_url}
                        </code>
                      </>
                    )}
                    {target.metadata.gtin && (
                      <div className="mt-2 text-xs text-gray-600">
                        <span className="font-semibold">GTIN:</span> {target.metadata.gtin}
                      </div>
                    )}
                    {target.metadata.format && (
                      <div className="mt-2">
                        <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded">
                          {target.metadata.format}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => testUrl(target)}
                    disabled={testingId === target.id}
                    className="inline-flex items-center px-4 py-2 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
                  >
                    {testingId === target.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Testing...
                      </>
                    ) : (
                      <>
                        <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test DPP Fetch
                      </>
                    )}
                  </button>

                  <a
                    href={target.metadata?.test_url || target.base_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-md transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open in Browser
                  </a>
                </div>

                {/* Test Results */}
                {testResults[target.id] && (
                  <div className="mt-4 space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900">Test Results</h4>
                        <div className="flex gap-2">
                          {testResults[target.id].detectedFormat && (
                            <span className="px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                              {testResults[target.id].detectedFormat}
                            </span>
                          )}
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            testResults[target.id].success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {testResults[target.id].success ? '✓ Success' : '✗ Failed'}
                          </span>
                        </div>
                      </div>
                      
                      {/* Quick Stats */}
                      {testResults[target.id].data?.metadata && (
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-xs text-gray-500">Has JSON-LD</div>
                            <div className="text-sm font-semibold">
                              {testResults[target.id].data.metadata.hasJsonLd ? '✓ Yes' : '✗ No'}
                            </div>
                          </div>
                          <div className="bg-white p-2 rounded border border-gray-200">
                            <div className="text-xs text-gray-500">Data Size</div>
                            <div className="text-sm font-semibold">
                              {(testResults[target.id].data.metadata.dataSize / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <details className="group">
                        <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-1">
                          <svg className="h-4 w-4 group-open:rotate-90 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                          </svg>
                          View Raw Response
                        </summary>
                        <pre className="mt-2 text-xs bg-white p-3 rounded border border-gray-300 overflow-x-auto max-h-96">
                          {JSON.stringify(testResults[target.id], null, 2)}
                        </pre>
                      </details>
                    </div>

                    {/* Linked Data Expander */}
                    {testResults[target.id].success && testResults[target.id].data?.data && (
                      <LinkExpander 
                        dppData={testResults[target.id].data.data}
                        dppUrl={target.metadata.test_url}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

