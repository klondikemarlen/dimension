import { createSourceGraph } from "./create-service.cjs"

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

export function createService(path: string, sourceName = path): SourceGraph {
  return createSourceGraph(path, sourceName)
}

export default createService
