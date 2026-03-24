import { Node, Edge } from '@xyflow/react'

const STORAGE_KEY = 'twr-funnel-builder-v1'

export function loadFunnel(): { nodes: Node[]; edges: Edge[] } | null {
  try {
    if (typeof window === 'undefined') return null
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveFunnel(nodes: Node[], edges: Edge[]) {
  try {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ nodes, edges }))
  } catch {}
}