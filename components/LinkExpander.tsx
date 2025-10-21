'use client'

import { useState } from 'react'
import { expandJsonLd, extractLinks, buildGraphStructure, type ResolvedGraph } from '@/lib/jsonld-resolver'
import LinkList from './LinkList'
import GraphViewer from './GraphViewer'

type LinkExpanderProps = {
  dppData: any
  dppUrl: string
}

export default function LinkExpander({ dppData, dppUrl }: LinkExpanderProps) {
  const [expanded, setExpanded] = useState<ResolvedGraph | null>(null)
  const [isExpanding, setIsExpanding] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0, currentLink: '' })
  const [view, setView] = useState<'list' | 'graph'>('list')

  const initialLinks = extractLinks(dppData)

  const handleExpand = async () => {
    setIsExpanding(true)
    setProgress({ current: 0, total: initialLinks.length, currentLink: '' })

    try {
      const graph = await expandJsonLd(dppData, {
        maxDepth: 3,
        maxLinks: 50,
        convertDid: true,
        timeout: 10000,
        onProgress: (resolved, total, currentLink) => {
          setProgress({ current: resolved, total, currentLink })
        }
      })
      
      setExpanded(graph)
    } catch (error) {
      console.error('Expansion failed:', error)
    } finally {
      setIsExpanding(false)
    }
  }

  if (!initialLinks.length) {
    return (
      <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        <p className="text-gray-600 font-medium">No Linked Data Found</p>
        <p className="text-sm text-gray-500 mt-1">This document doesn't contain any @id references to follow</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-50 to-white border-2 border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-purple-900 flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Linked Data Explorer
            </h3>
            <p className="text-sm text-purple-700 mt-1">
              {initialLinks.length} {initialLinks.length === 1 ? 'link' : 'links'} found in this document
            </p>
          </div>
          
          {!expanded && (
            <button
              onClick={handleExpand}
              disabled={isExpanding}
              className="inline-flex items-center px-5 py-2.5 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
            >
              {isExpanding ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Expanding...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Expand All Links
                </>
              )}
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {isExpanding && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm text-purple-700">
              <span>Resolving links...</span>
              <span>{progress.current} / {progress.total}</span>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
            {progress.currentLink && (
              <p className="text-xs text-purple-600 truncate">
                Current: {progress.currentLink}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {expanded && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-green-100 rounded-full p-1">
                  <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-green-700 uppercase">Resolved</div>
              </div>
              <div className="text-3xl font-bold text-green-900">{expanded.stats.resolved}</div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-red-100 rounded-full p-1">
                  <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-red-700 uppercase">Failed</div>
              </div>
              <div className="text-3xl font-bold text-red-900">{expanded.stats.failed}</div>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-blue-100 rounded-full p-1">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-blue-700 uppercase">Depth</div>
              </div>
              <div className="text-3xl font-bold text-blue-900">{expanded.stats.maxDepth}</div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-amber-100 rounded-full p-1">
                  <svg className="h-4 w-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="text-xs font-semibold text-amber-700 uppercase">Data Size</div>
              </div>
              <div className="text-3xl font-bold text-amber-900">
                {(expanded.stats.totalSize / 1024).toFixed(1)}
                <span className="text-sm ml-1">KB</span>
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setView('list')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'list'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              📋 List View
            </button>
            <button
              onClick={() => setView('graph')}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                view === 'graph'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              🕸️ Graph View
            </button>
          </div>

          {/* Content */}
          {view === 'list' ? (
            <LinkList links={expanded.links} rootData={dppData} />
          ) : (
            <GraphViewer 
              root={expanded.root} 
              links={expanded.links}
            />
          )}
        </div>
      )}
    </div>
  )
}

