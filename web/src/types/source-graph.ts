export interface SourceNode {
  id: string
  label: string
  type: string
}

export interface SourceLink {
  source: string
  target: string
}

export interface SourceGraph {
  nodes: SourceNode[]
  links: SourceLink[]
}
