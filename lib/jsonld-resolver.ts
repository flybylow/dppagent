/**
 * JSON-LD Link Resolution and Expansion
 * Recursively follows @id references to build complete data graphs
 */

import { convertDidToUrl } from './dpp-utils'

export type JsonLdNode = {
  '@id'?: string
  '@type'?: string | string[]
  [key: string]: any
}

export type ResolvedLink = {
  id: string
  data: JsonLdNode | null
  status: 'resolved' | 'failed' | 'pending'
  error?: string
  fetchedAt?: string
  depth: number
  size?: number
  hasMoreLinks?: boolean
}

export type ResolvedGraph = {
  root: JsonLdNode
  links: Map<string, ResolvedLink>
  stats: {
    total: number
    resolved: number
    failed: number
    maxDepth: number
    totalSize: number
  }
}

/**
 * Extract all @id references from a JSON-LD document
 */
export function extractLinks(obj: any, options: {
  excludeRoot?: boolean
  includeBlankNodes?: boolean
} = {}): string[] {
  const { excludeRoot = true, includeBlankNodes = false } = options
  const collected = new Set<string>()

  function extract(node: any, isRoot = true) {
    if (!node || typeof node !== 'object') return

    if (node['@id'] && typeof node['@id'] === 'string') {
      // Skip blank nodes (start with _:) unless explicitly included
      if (!node['@id'].startsWith('_:') || includeBlankNodes) {
        // Skip root if excludeRoot is true
        if (!isRoot || !excludeRoot) {
          collected.add(node['@id'])
        }
      }
    }

    // Recursively check all properties
    for (const [key, value] of Object.entries(node)) {
      if (key === '@context') continue // Skip context
      
      if (Array.isArray(value)) {
        value.forEach(item => extract(item, false))
      } else if (typeof value === 'object' && value !== null) {
        extract(value, false)
      }
    }
  }

  extract(obj, true)
  return Array.from(collected)
}

/**
 * Resolve a single @id reference
 */
export async function resolveLink(
  id: string,
  options: {
    convertDid?: boolean
    timeout?: number
  } = {}
): Promise<{ data: JsonLdNode | null; error?: string; size?: number }> {
  const { convertDid = true, timeout = 10000 } = options

  try {
    let url = id

    // Convert DID to HTTP if needed
    if (convertDid && id.startsWith('did:web:')) {
      url = convertDidToUrl(id)
    }

    // Skip non-HTTP(S) URLs
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return { 
        data: null, 
        error: 'Not an HTTP(S) URL' 
      }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    const response = await fetch(url, {
      headers: {
        'Accept': 'application/ld+json, application/json, */*',
        'User-Agent': 'DPP-Scanner-Agent/1.0'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return { 
        data: null, 
        error: `HTTP ${response.status}: ${response.statusText}` 
      }
    }

    const contentType = response.headers.get('content-type') || ''
    let data: any

    if (contentType.includes('json')) {
      data = await response.json()
    } else if (contentType.includes('html')) {
      // Try to extract JSON-LD from HTML
      const html = await response.text()
      const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is)
      
      if (jsonLdMatch) {
        try {
          data = JSON.parse(jsonLdMatch[1])
        } catch {
          return { data: null, error: 'Failed to parse JSON-LD from HTML' }
        }
      } else {
        return { data: null, error: 'No JSON-LD found in HTML' }
      }
    } else {
      return { data: null, error: `Unsupported content-type: ${contentType}` }
    }

    const size = JSON.stringify(data).length

    return { data, size }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { data: null, error: 'Request timeout' }
    }
    return { data: null, error: error.message || 'Fetch failed' }
  }
}

/**
 * Recursively resolve all linked data (BFS approach)
 */
export async function expandJsonLd(
  root: JsonLdNode,
  options: {
    maxDepth?: number
    maxLinks?: number
    convertDid?: boolean
    timeout?: number
    onProgress?: (resolved: number, total: number, currentLink: string) => void
  } = {}
): Promise<ResolvedGraph> {
  const {
    maxDepth = 3,
    maxLinks = 50,
    convertDid = true,
    timeout = 10000,
    onProgress
  } = options

  const links = new Map<string, ResolvedLink>()
  const queue: Array<{ id: string; depth: number }> = []
  const seen = new Set<string>()

  // Extract initial links from root
  const rootLinks = extractLinks(root)
  
  // Initialize queue
  for (const link of rootLinks) {
    if (link === root['@id']) continue // Skip self-reference
    queue.push({ id: link, depth: 1 })
    seen.add(link)
    links.set(link, {
      id: link,
      data: null,
      status: 'pending',
      depth: 1
    })
  }

  let processedCount = 0
  let totalSize = 0

  // Process queue
  while (queue.length > 0 && links.size < maxLinks) {
    const { id, depth } = queue.shift()!

    if (depth > maxDepth) {
      links.get(id)!.status = 'failed'
      links.get(id)!.error = 'Max depth exceeded'
      continue
    }

    processedCount++
    if (onProgress) {
      onProgress(processedCount, links.size, id)
    }

    // Resolve the link
    const { data, error, size } = await resolveLink(id, { convertDid, timeout })

    if (data) {
      // Extract more links from resolved data
      const childLinks = extractLinks(data)
      const hasMoreLinks = childLinks.length > 0

      links.set(id, {
        id,
        data,
        status: 'resolved',
        fetchedAt: new Date().toISOString(),
        depth,
        size,
        hasMoreLinks
      })

      if (size) totalSize += size

      // Add new links to queue if within depth limit
      if (depth < maxDepth && links.size < maxLinks) {
        for (const childLink of childLinks) {
          if (!seen.has(childLink) && childLink !== id) {
            seen.add(childLink)
            queue.push({ id: childLink, depth: depth + 1 })
            links.set(childLink, {
              id: childLink,
              data: null,
              status: 'pending',
              depth: depth + 1
            })
          }
        }
      }
    } else {
      links.set(id, {
        id,
        data: null,
        status: 'failed',
        error: error || 'Unknown error',
        depth
      })
    }
  }

  // Calculate stats
  const resolved = Array.from(links.values()).filter(l => l.status === 'resolved').length
  const failed = Array.from(links.values()).filter(l => l.status === 'failed').length

  return {
    root,
    links,
    stats: {
      total: links.size,
      resolved,
      failed,
      maxDepth,
      totalSize
    }
  }
}

/**
 * Build graph structure for visualization
 */
export type GraphNode = {
  id: string
  label: string
  type: string
  depth: number
  status: 'resolved' | 'failed' | 'pending'
  size?: number
}

export type GraphEdge = {
  from: string
  to: string
  label: string
}

export function buildGraphStructure(
  root: JsonLdNode,
  links: Map<string, ResolvedLink>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const processedNodes = new Set<string>()

  // Add root node
  const rootId = root['@id'] || 'root'
  const rootType = Array.isArray(root['@type']) ? root['@type'][0] : (root['@type'] || 'Document')
  
  nodes.push({
    id: rootId,
    label: root.name || rootType || 'Root',
    type: rootType,
    depth: 0,
    status: 'resolved'
  })
  processedNodes.add(rootId)

  // Helper to extract edges from an object
  function extractEdges(obj: any, fromId: string, depth: number) {
    if (!obj || typeof obj !== 'object') return

    for (const [key, value] of Object.entries(obj)) {
      if (key === '@context' || key === '@id') continue

      if (value && typeof value === 'object' && value['@id']) {
        const toId = value['@id']
        
        // Add edge
        edges.push({
          from: fromId,
          to: toId,
          label: key
        })

        // Add node if not already added
        if (!processedNodes.has(toId)) {
          const link = links.get(toId)
          if (link) {
            const nodeType = Array.isArray(value['@type']) 
              ? value['@type'][0] 
              : (value['@type'] || 'Unknown')
            
            nodes.push({
              id: toId,
              label: value.name || nodeType || toId.split('/').pop() || toId,
              type: nodeType,
              depth: link.depth,
              status: link.status,
              size: link.size
            })
            processedNodes.add(toId)

            // Recursively process if resolved
            if (link.data) {
              extractEdges(link.data, toId, depth + 1)
            }
          }
        }
      } else if (Array.isArray(value)) {
        value.forEach(item => {
          if (item && typeof item === 'object') {
            extractEdges(item, fromId, depth)
          }
        })
      }
    }
  }

  // Build graph from root
  extractEdges(root, rootId, 0)

  return { nodes, edges }
}

/**
 * Merge resolved data back into original document
 */
export function mergeResolvedData(
  root: JsonLdNode,
  links: Map<string, ResolvedLink>
): JsonLdNode {
  const merged = JSON.parse(JSON.stringify(root))

  function merge(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj

    if (obj['@id'] && links.has(obj['@id'])) {
      const link = links.get(obj['@id'])!
      if (link.status === 'resolved' && link.data) {
        // Merge resolved data
        Object.assign(obj, link.data)
      }
    }

    for (const [key, value] of Object.entries(obj)) {
      if (Array.isArray(value)) {
        obj[key] = value.map(merge)
      } else if (typeof value === 'object' && value !== null) {
        obj[key] = merge(value)
      }
    }

    return obj
  }

  return merge(merged)
}

