/**
 * DPP Utilities - Format detection, DID conversion, and analysis
 */

/**
 * Convert DID URL to HTTP URL
 * @param did - DID URL in format: did:web:domain:path:to:resource
 * @returns HTTP URL
 */
export function convertDidToUrl(did: string): string {
  if (!did.startsWith('did:web:')) {
    return did
  }
  
  // Remove 'did:web:' prefix and replace ':' with '/'
  const path = did.replace('did:web:', '').replace(/:/g, '/')
  return `https://${path}`
}

/**
 * Convert HTTP URL to DID URL
 * @param url - HTTP/HTTPS URL
 * @returns DID URL in did:web format
 */
export function convertUrlToDid(url: string): string {
  try {
    const urlObj = new URL(url)
    const path = (urlObj.hostname + urlObj.pathname).replace(/\//g, ':').replace(/:$/, '')
    return `did:web:${path}`
  } catch {
    return url
  }
}

/**
 * Detect DPP format from data structure and content type
 */
export function detectDppFormat(data: any, contentType?: string): string {
  if (!data) return 'Unknown'

  // Verifiable Credential
  if (
    data['@context']?.includes('credentials') || 
    data['@context']?.includes('www.w3.org/2018/credentials') ||
    data.type?.includes('VerifiableCredential') ||
    data.credentialSubject
  ) {
    return 'Verifiable Credential'
  }

  // Catena-X Battery Pass
  if (data.batteryPass || (data.version && data.identification)) {
    return 'Catena-X Battery Pass'
  }

  // JSON-LD (Schema.org)
  if (
    data['@context'] === 'http://schema.org' || 
    data['@context'] === 'https://schema.org' ||
    (data['@type'] && typeof data['@type'] === 'string')
  ) {
    return 'JSON-LD (Schema.org)'
  }

  // GS1 Digital Link / SmartLabel
  if (data.gtin || data.gtin13 || data.gtin14 || contentType?.includes('gs1')) {
    return 'GS1 Digital Link'
  }

  // UNTP Digital Product Passport
  if (data.type === 'DigitalProductPassport' || data.productPassport) {
    return 'UNTP Digital Product Passport'
  }

  // Generic JSON
  if (contentType?.includes('json')) {
    return 'JSON'
  }

  // HTML (might contain embedded JSON-LD)
  if (contentType?.includes('html')) {
    return 'HTML (Check for embedded JSON-LD)'
  }

  return 'Unknown'
}

/**
 * Calculate trust score based on DPP data and format
 */
export function calculateTrustScore(dpp: any, format?: string): number {
  let score = 0

  // Format quality bonus (max 30 points)
  const formatScores: Record<string, number> = {
    'Verifiable Credential': 30,
    'Catena-X Battery Pass': 30,
    'UNTP Digital Product Passport': 28,
    'JSON-LD (Schema.org)': 25,
    'GS1 Digital Link': 25,
    'JSON': 15,
    'HTML (Check for embedded JSON-LD)': 10,
    'Unknown': 0
  }

  score += formatScores[format || 'Unknown'] || 0

  // Field count (max 40 points)
  const fieldCount = countFields(dpp)
  score += Math.min(fieldCount * 2, 40)

  // Certifications (max 30 points)
  const certs = extractCertifications(dpp)
  score += Math.min(certs.length * 10, 30)

  return Math.min(score, 100)
}

/**
 * Calculate completeness score based on required fields
 */
export function calculateCompletenessScore(dpp: any, format?: string): number {
  if (!dpp) return 0

  let requiredFields: string[] = []

  // Define required fields based on format
  switch (format) {
    case 'Verifiable Credential':
      requiredFields = ['@context', 'type', 'credentialSubject', 'issuer', 'issuanceDate']
      break
    case 'Catena-X Battery Pass':
      requiredFields = ['batteryPass', 'identification', 'manufacturer', 'sustainability']
      break
    case 'JSON-LD (Schema.org)':
    case 'GS1 Digital Link':
      requiredFields = ['@context', '@type', 'name', 'identifier', 'manufacturer']
      break
    default:
      requiredFields = ['name', 'manufacturer', 'identifier']
  }

  const presentFields = requiredFields.filter(field => {
    const keys = field.split('.')
    let value = dpp
    for (const key of keys) {
      value = value?.[key]
      if (value === undefined || value === null) return false
    }
    return true
  })

  return Math.round((presentFields.length / requiredFields.length) * 100)
}

/**
 * Extract certifications from DPP data
 */
export function extractCertifications(dpp: any): string[] {
  if (!dpp) return []

  const certifications: string[] = []

  // Check common certification fields
  const certFields = [
    dpp.certifications,
    dpp.certification,
    dpp.credentialSubject?.certifications,
    dpp.sustainability?.certifications,
    dpp.batteryPass?.certifications,
    dpp.certificateOfCompliance
  ]

  for (const field of certFields) {
    if (Array.isArray(field)) {
      certifications.push(...field.map(c => typeof c === 'string' ? c : c.name || c.type))
    } else if (typeof field === 'string') {
      certifications.push(field)
    } else if (field && typeof field === 'object') {
      if (field.name) certifications.push(field.name)
      if (field.type) certifications.push(field.type)
    }
  }

  // Remove duplicates
  return [...new Set(certifications.filter(Boolean))]
}

/**
 * Count total fields in an object (recursive)
 */
function countFields(obj: any, depth = 0, maxDepth = 5): number {
  if (!obj || typeof obj !== 'object' || depth > maxDepth) return 0
  
  let count = 0
  for (const value of Object.values(obj)) {
    count++
    if (typeof value === 'object' && value !== null) {
      count += countFields(value, depth + 1, maxDepth)
    }
  }
  
  return count
}

/**
 * Extract product information from DPP
 */
export function extractProductInfo(dpp: any, format?: string): {
  name?: string
  manufacturer?: string
  category?: string
  identifier?: string
} {
  if (!dpp) return {}

  let name, manufacturer, category, identifier

  // Try different field locations based on format
  if (format === 'Verifiable Credential' && dpp.credentialSubject) {
    name = dpp.credentialSubject.name || dpp.credentialSubject.productName
    manufacturer = dpp.credentialSubject.manufacturer || dpp.credentialSubject.manufacturerName
    category = dpp.credentialSubject.category || dpp.credentialSubject.productCategory
    identifier = dpp.credentialSubject.identifier || dpp.credentialSubject.id
  } else if (format === 'Catena-X Battery Pass' && dpp.batteryPass) {
    name = dpp.batteryPass.productName
    manufacturer = dpp.batteryPass.manufacturer?.name
    category = 'Battery'
    identifier = dpp.batteryPass.identification?.id
  } else {
    // Generic extraction
    name = dpp.name || dpp.productName || dpp.title
    manufacturer = dpp.manufacturer || dpp.brand || dpp.vendor
    category = dpp.category || dpp.productCategory || dpp['@type']
    identifier = dpp.identifier || dpp.id || dpp.gtin || dpp.sku
  }

  return { name, manufacturer, category, identifier }
}

/**
 * Check if data has JSON-LD structure
 */
export function hasJsonLd(data: any): boolean {
  return !!(data && (data['@context'] || data['@type'] || data['@id']))
}

/**
 * Check if data is a Verifiable Credential
 */
export function isVerifiableCredential(data: any): boolean {
  return !!(
    data && 
    (data.type?.includes('VerifiableCredential') || data.credentialSubject)
  )
}

