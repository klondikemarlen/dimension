export interface SourceNode {
  id: string
  label: string
  type: string
}

export type SourceLinkKind = "contains" | "imports"

export interface SourceLink {
  source: string
  target: string
  kind?: SourceLinkKind
}

export interface SourceGraph {
  nodes: SourceNode[]
  links: SourceLink[]
}
