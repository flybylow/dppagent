'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { CrawlTarget } from '@/lib/supabase'

export default function CompetitorsPage() {
  const [competitors, setCompetitors] = useState<CrawlTarget[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompetitors()
  }, [])

  const loadCompetitors = async () => {
    try {
      const { data, error } = await supabase
        .from('crawl_targets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setCompetitors(data || [])
    } catch (error) {
      console.error('Error loading competitors:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div className="space-y-8">
      <div className="border-b border-gray-200 pb-5 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Competitors</h2>
          <p className="mt-2 text-sm text-gray-600">
            Manage and monitor competitor DPP sources
          </p>
        </div>
        <a
          href="/competitors/add"
          className="inline-flex items-center px-5 py-2.5 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Competitor
        </a>
      </div>

      <div className="bg-white border border-gray-200 shadow-lg rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            All Competitors
            {!loading && competitors.length > 0 && (
              <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {competitors.length}
              </span>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <svg className="animate-spin h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500">Loading competitors...</p>
          </div>
        ) : competitors.length === 0 ? (
          <div className="p-12 text-center bg-gray-50 rounded-b-xl border-t-2 border-dashed border-gray-300">
            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p className="text-gray-700 font-semibold text-lg mb-2">No competitors added yet</p>
            <p className="text-sm text-gray-500 mb-6">
              Start monitoring competitor DPPs by adding your first competitor
            </p>
            <a
              href="/competitors/add"
              className="inline-flex items-center px-5 py-2.5 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Competitor
            </a>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {competitors.map((competitor) => (
              <div key={competitor.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="text-lg font-semibold text-gray-900">{competitor.name}</h4>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(competitor.status)}`}>
                        {competitor.status}
                      </span>
                    </div>
                    <a 
                      href={competitor.base_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mb-2"
                    >
                      {competitor.base_url}
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <p className="text-xs text-gray-500">
                      Added {new Date(competitor.created_at).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                    <button className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
          <div className="bg-blue-100 rounded-full p-3 w-fit mb-4">
            <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Discovery</h4>
          <p className="text-sm text-blue-700">
            Automatically discover DPPs from competitor websites using API endpoints and crawling
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6">
          <div className="bg-purple-100 rounded-full p-3 w-fit mb-4">
            <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-purple-900 mb-2">Analysis</h4>
          <p className="text-sm text-purple-700">
            Calculate trust scores, completeness, and extract certifications from discovered DPPs
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-6">
          <div className="bg-green-100 rounded-full p-3 w-fit mb-4">
            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-green-900 mb-2">Monitoring</h4>
          <p className="text-sm text-green-700">
            Track competitor updates, new certifications, and competitive intelligence over time
          </p>
        </div>
      </div>
    </div>
  )
}
