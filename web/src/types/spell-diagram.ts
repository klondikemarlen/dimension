export type RuneKind = "method" | "local" | "policy" | "async" | "response" | "error" | "context"

export type EdgeKind = "data" | "error" | "response" | "context" | "import"

export interface RuneNode {
  id: string
  label: string
  kind: RuneKind
  x: number
  y: number
  radius: number
  isSelected?: boolean
  ring?: "solid" | "dashed" | "focus"
  collisionRadius?: number
  group?: string
  groupLabel?: string
}

export interface LeylineEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
}

export interface SpellDiagram {
  title: string
  subtitle: string
  nodes: RuneNode[]
  edges: LeylineEdge[]
}
