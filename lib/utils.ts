/**
 * Calculate trust score for a DPP (MVP version - simplified)
 */
export function calculateTrustScore(jsonLd: any): number {
  if (!jsonLd) return 0

  let score = 0

  // Has JSON-LD data? +30 points
  score += 30

  // Field count (max 40 points)
  const fieldCount = Object.keys(jsonLd).length
  score += Math.min(fieldCount * 2, 40)

  // Has certifications? +30 points
  const certifications = jsonLd.certifications || jsonLd.certification || []
  const certCount = Array.isArray(certifications) ? certifications.length : 0
  score += Math.min(certCount * 10, 30)

  return Math.min(score, 100)
}

/**
 * Calculate completeness score based on required fields
 */
export function calculateCompletenessScore(jsonLd: any): number {
  if (!jsonLd) return 0

  const requiredFields = [
    'name',
    'manufacturer',
    'identifier',
    'description',
    'category',
    'material',
    'sustainability'
  ]

  const presentFields = requiredFields.filter(field => 
    jsonLd[field] !== undefined && jsonLd[field] !== null
  )

  return Math.round((presentFields.length / requiredFields.length) * 100)
}

/**
 * Extract certifications from JSON-LD
 */
export function extractCertifications(jsonLd: any): string[] {
  if (!jsonLd) return []

  const certs = jsonLd.certifications || jsonLd.certification || []
  
  if (Array.isArray(certs)) {
    return certs.map(c => typeof c === 'string' ? c : c.name || c.type)
  }

  return []
}

/**
 * Count total fields in JSON-LD (recursive)
 */
export function countFields(obj: any, depth = 0): number {
  if (!obj || typeof obj !== 'object' || depth > 5) return 0
  
  let count = 0
  for (const value of Object.values(obj)) {
    count++
    if (typeof value === 'object' && value !== null) {
      count += countFields(value, depth + 1)
    }
  }
  
  return count
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Check if URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

