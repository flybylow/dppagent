'use client'

import { useState } from 'react'
import { type ResolvedLink } from '@/lib/jsonld-resolver'

type LinkListProps = {
  links: Map<string, ResolvedLink>
  rootData: any
}

export default function LinkList({ links, rootData }: LinkListProps) {
  const [selectedLink, setSelectedLink] = useState<string | null>(null)

  const linkArray = Array.from(links.values()).sort((a, b) => {
    // Sort by status (resolved first), then depth
    if (a.status !== b.status) {
      return a.status === 'resolved' ? -1 : 1
    }
    return a.depth - b.depth
  })

  const selectedLinkData = selectedLink ? links.get(selectedLink) : null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Links List */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-3">
          All Links ({links.size})
        </h4>
        <div className="space-y-2 max-h-[600px] overflow-y-auto">
          {linkArray.map((link) => (
            <div
              key={link.id}
              onClick={() => setSelectedLink(link.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                selectedLink === link.id
                  ? 'border-purple-500 bg-purple-50'
                  : link.status === 'resolved'
                  ? 'border-green-200 bg-green-50 hover:border-green-400'
                  : 'border-red-200 bg-red-50 hover:border-red-400'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className={`rounded-full p-1 flex-shrink-0 ${
                    link.status === 'resolved' 
                      ? 'bg-green-100' 
                      : 'bg-red-100'
                  }`}>
                    {link.status === 'resolved' ? (
                      <svg className="h-4 w-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <code className="text-xs text-gray-700 break-all">
                    {link.id.length > 60 ? `${link.id.substring(0, 60)}...` : link.id}
                  </code>
                </div>
                <span className={`px-2 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ${
                  link.status === 'resolved'
                    ? 'bg-green-100 text-green-800 border border-green-300'
                    : link.status === 'failed'
                    ? 'bg-red-100 text-red-800 border border-red-300'
                    : 'bg-gray-100 text-gray-800 border border-gray-300'
                }`}>
                  Depth {link.depth}
                </span>
              </div>

              {link.status === 'resolved' && link.size && (
                <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                  <span>📦 {(link.size / 1024).toFixed(1)} KB</span>
                  {link.hasMoreLinks && (
                    <span className="text-purple-600">🔗 Has more links</span>
                  )}
                </div>
              )}

              {link.status === 'failed' && link.error && (
                <div className="mt-2 text-xs text-red-700 bg-red-100 px-2 py-1 rounded">
                  ⚠️ {link.error}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Detail View */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sticky top-4">
        {selectedLinkData ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-gray-900 text-sm">Link Details</h4>
              <button
                onClick={() => setSelectedLink(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="border-b border-gray-200 pb-3">
              <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">URL</label>
              <code className="text-xs text-blue-600 break-all block">
                {selectedLink}
              </code>
            </div>

            {selectedLinkData.status === 'resolved' && selectedLinkData.data ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs text-gray-500 uppercase tracking-wide block">Type</label>
                  <span className="text-sm font-medium text-gray-900">
                    {selectedLinkData.data['@type'] || 'Unknown'}
                  </span>
                </div>

                {selectedLinkData.data.name && (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-500 uppercase tracking-wide block">Name</label>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedLinkData.data.name}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Full Data</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedLinkData.data, null, 2)}
                  </pre>
                </div>

                <div className="flex gap-2">
                  <a
                    href={selectedLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center px-3 py-2 text-xs font-semibold rounded-lg text-blue-700 bg-blue-50 border-2 border-blue-200 hover:bg-blue-100 transition-all"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open URL
                  </a>
                </div>
              </>
            ) : (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center">
                <svg className="mx-auto h-8 w-8 text-red-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-semibold text-red-900 mb-1">Failed to Resolve</p>
                <p className="text-xs text-red-700">{selectedLinkData.error}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            <p className="text-sm font-medium">Select a link to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

