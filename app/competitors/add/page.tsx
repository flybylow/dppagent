'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AddCompetitorPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    notes: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Insert into Supabase
      const { data, error: insertError } = await supabase
        .from('crawl_targets')
        .insert([
          {
            name: formData.name,
            base_url: formData.baseUrl,
            status: 'active',
            metadata: formData.notes ? { notes: formData.notes } : null
          }
        ])
        .select()

      if (insertError) {
        throw insertError
      }

      console.log('Competitor added successfully:', data)
      
      // Redirect to competitors list
      router.push('/competitors')
    } catch (err: any) {
      console.error('Error adding competitor:', err)
      setError(err.message || 'Failed to add competitor. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-gray-200 pb-5">
        <h2 className="text-3xl font-bold text-gray-900">Add Competitor</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter competitor details to start monitoring their DPPs
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white border border-gray-200 shadow-lg rounded-xl p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
              Company Name *
            </label>
            <input
              type="text"
              id="name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Lindt, Ferrero, Mars"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-500">The name of the competitor company</p>
          </div>

          {/* Website URL */}
          <div>
            <label htmlFor="baseUrl" className="block text-sm font-semibold text-gray-900 mb-2">
              Website URL *
            </label>
            <input
              type="url"
              id="baseUrl"
              required
              value={formData.baseUrl}
              onChange={(e) => setFormData({ ...formData, baseUrl: e.target.value })}
              placeholder="https://example.com"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
            />
            <p className="mt-1 text-xs text-gray-500">The main website URL of the competitor</p>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-sm font-semibold text-gray-900 mb-2">
              Notes (Optional)
            </label>
            <textarea
              id="notes"
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Add any relevant notes about this competitor..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
            />
            <p className="mt-1 text-xs text-gray-500">Optional notes or context about this competitor</p>
          </div>

          {/* Discovery Info Box */}
          <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2 flex-shrink-0">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">What happens next?</h4>
                <p className="text-sm text-blue-700">
                  After adding a competitor, the system will attempt to discover DPPs using:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    API Discovery (.well-known endpoints)
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Manual DPP URL input (if needed)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-200 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-red-100 rounded-full p-2 flex-shrink-0">
                  <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-red-900 mb-1">Error</h4>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 border-2 border-transparent text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Competitor
                </>
              )}
            </button>
            <a
              href="/competitors"
              className="inline-flex items-center px-6 py-3 border-2 border-gray-300 text-sm font-semibold rounded-lg text-gray-700 bg-white hover:bg-gray-50 shadow-md transition-all duration-200"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>

      {/* Help Section */}
      <div className="bg-gradient-to-br from-amber-50 to-white border-2 border-amber-200 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="bg-amber-100 rounded-full p-2 flex-shrink-0">
            <svg className="h-5 w-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-amber-900 mb-1">Tips</h4>
            <ul className="mt-2 space-y-1 text-sm text-amber-800">
              <li>• Make sure the website URL is accessible and valid</li>
              <li>• You can add multiple competitors to compare their DPPs</li>
              <li>• Discovery process will run automatically after adding</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

