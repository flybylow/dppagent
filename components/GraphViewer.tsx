'use client'

import { useState, useMemo } from 'react'
import { buildGraphStructure, type ResolvedLink } from '@/lib/jsonld-resolver'

type GraphViewerProps = {
  root: any
  links: Map<string, ResolvedLink>
}

type TreeNode = {
  id: string
  label: string
  type: string
  status: 'resolved' | 'failed' | 'pending'
  depth: number
  children: TreeNode[]
  data?: any
}

export default function GraphViewer({ root, links }: GraphViewerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']))

  // Build tree structure
  const tree = useMemo(() => {
    return buildTree(root, links, 0)
  }, [root, links])

  const selectedNodeData = selectedNode ? links.get(selectedNode) : null

  function buildTree(node: any, linksMap: Map<string, ResolvedLink>, depth: number): TreeNode {
    const nodeId = node['@id'] || 'root'
    const nodeType = Array.isArray(node['@type']) ? node['@type'][0] : (node['@type'] || 'Document')
    const label = node.name || nodeType || nodeId.split('/').pop() || 'Unknown'

    const children: TreeNode[] = []

    // Find all @id references in this node
    for (const [key, value] of Object.entries(node)) {
      if (key === '@context' || key === '@id' || key === '@type') continue

      if (value && typeof value === 'object') {
        if (value['@id']) {
          const linkData = linksMap.get(value['@id'])
          if (linkData) {
            const childNode: TreeNode = {
              id: value['@id'],
              label: value.name || (linkData.data?.name) || key || 'Link',
              type: value['@type'] || (linkData.data?.['@type']) || key,
              status: linkData.status,
              depth: linkData.depth,
              children: linkData.status === 'resolved' && linkData.data 
                ? buildTree(linkData.data, linksMap, depth + 1).children 
                : [],
              data: linkData.data
            }
            children.push(childNode)
          }
        } else if (Array.isArray(value)) {
          // Handle arrays
          value.forEach((item, index) => {
            if (item && typeof item === 'object' && item['@id']) {
              const linkData = linksMap.get(item['@id'])
              if (linkData) {
                children.push({
                  id: item['@id'],
                  label: item.name || (linkData.data?.name) || `${key}[${index}]`,
                  type: item['@type'] || (linkData.data?.['@type']) || key,
                  status: linkData.status,
                  depth: linkData.depth,
                  children: linkData.status === 'resolved' && linkData.data
                    ? buildTree(linkData.data, linksMap, depth + 1).children
                    : [],
                  data: linkData.data
                })
              }
            }
          })
        }
      }
    }

    return {
      id: nodeId,
      label,
      type: nodeType,
      status: 'resolved',
      depth,
      children,
      data: node
    }
  }

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes)
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId)
    } else {
      newExpanded.add(nodeId)
    }
    setExpandedNodes(newExpanded)
  }

  const renderTreeNode = (node: TreeNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children.length > 0

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors ${
            selectedNode === node.id ? 'bg-purple-100' : ''
          }`}
          style={{ marginLeft: `${level * 24}px` }}
          onClick={() => {
            setSelectedNode(node.id)
            if (hasChildren) toggleNode(node.id)
          }}
        >
          {/* Expand/Collapse Icon */}
          {hasChildren ? (
            <svg 
              className={`h-4 w-4 text-gray-600 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <div className="w-4" />
          )}

          {/* Status Icon */}
          <div className={`rounded-full p-1 ${
            node.status === 'resolved' 
              ? 'bg-green-100' 
              : node.status === 'failed'
              ? 'bg-red-100'
              : 'bg-gray-100'
          }`}>
            {node.status === 'resolved' ? (
              <svg className="h-3 w-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : node.status === 'failed' ? (
              <svg className="h-3 w-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            )}
          </div>

          {/* Type Icon */}
          <span className="text-lg">
            {getTypeIcon(node.type)}
          </span>

          {/* Label */}
          <span className="text-sm font-medium text-gray-900 flex-1">
            {node.label}
          </span>

          {/* Type Badge */}
          <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-300">
            {node.type}
          </span>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {node.children.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Tree View */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4">
        <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
          <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          Data Tree
        </h4>
        <div className="max-h-[600px] overflow-y-auto">
          {renderTreeNode(tree)}
        </div>
      </div>

      {/* Detail Panel */}
      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sticky top-4">
        {selectedNodeData ? (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">Node Details</h4>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">ID</label>
                <code className="text-xs text-blue-600 break-all block bg-blue-50 p-2 rounded">
                  {selectedNode}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${
                    selectedNodeData.status === 'resolved'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedNodeData.status === 'resolved' ? '✓ Resolved' : '✗ Failed'}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Depth</label>
                  <span className="text-sm font-semibold text-gray-900">Level {selectedNodeData.depth}</span>
                </div>
              </div>

              {selectedNodeData.status === 'resolved' && selectedNodeData.data && (
                <div className="border-t border-gray-200 pt-3">
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-2">Data</label>
                  <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto max-h-96">
                    {JSON.stringify(selectedNodeData.data, null, 2)}
                  </pre>
                </div>
              )}

              {selectedNodeData.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-700">{selectedNodeData.error}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <p className="text-sm font-medium">Click a node to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}

function getTypeIcon(type: string): string {
  const lowerType = type.toLowerCase()
  
  if (lowerType.includes('battery') || lowerType.includes('product')) return '🔋'
  if (lowerType.includes('organization') || lowerType.includes('manufacturer')) return '🏭'
  if (lowerType.includes('carbon') || lowerType.includes('footprint')) return '🌱'
  if (lowerType.includes('certificate') || lowerType.includes('certification')) return '⭐'
  if (lowerType.includes('component') || lowerType.includes('part')) return '⚙️'
  if (lowerType.includes('material')) return '🪨'
  if (lowerType.includes('location') || lowerType.includes('address')) return '📍'
  if (lowerType.includes('report') || lowerType.includes('document')) return '📄'
  if (lowerType.includes('person') || lowerType.includes('contact')) return '👤'
  
  return '📦'
}

