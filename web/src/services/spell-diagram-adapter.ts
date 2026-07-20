import type { SourceGraph, SourceLink, SourceNode } from "@/types/source-graph"
import type { EdgeKind, RuneKind, RuneNode, SpellDiagram } from "@/types/spell-diagram"

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 720
const CENTER_X = CANVAS_WIDTH / 2
const CENTER_Y = CANVAS_HEIGHT / 2
const LAYOUT_RADIUS_X = 300
const LAYOUT_RADIUS_Y = 205
const DENSE_GRAPH_LIMIT = 28

export interface SpellDiagramInput {
  graph: SourceGraph
  title: string
  subtitle: string
  selectedNodeId?: string
}

export function createSpellDiagramFromSourceGraph(input: SpellDiagramInput): SpellDiagram {
  const sourceNodes = input.graph.nodes.length > 0 ? input.graph.nodes : [emptySourceNode()]
  const focusNode = focusNodeFor(sourceNodes, input.selectedNodeId)
  const visibleNodes = visibleSourceNodes(sourceNodes, input.graph.links, focusNode)
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id))
  const hiddenCount = sourceNodes.length - visibleNodes.length
  const subtitle =
    hiddenCount > 0
      ? `${input.subtitle} Showing ${visibleNodes.length} of ${sourceNodes.length}; click a linked rune to refocus.`
      : input.subtitle

  return {
    title: input.title,
    subtitle,
    nodes: visibleNodes.map((node, index) =>
      createRuneNode(node, index, visibleNodes.length, node.id === focusNode.id, node.id === input.selectedNodeId),
    ),
    edges: input.graph.links
      .filter((link) => visibleNodeIds.has(link.source) && visibleNodeIds.has(link.target))
      .map((link, index) => ({
        id: `${link.source}-${link.target}-${index}`,
        source: link.source,
        target: link.target,
        kind: edgeKindForTarget(visibleNodes.find((node) => node.id === link.target)),
      })),
  }
}

function focusNodeFor(nodes: SourceNode[], selectedNodeId: string | undefined): SourceNode {
  return nodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.type === "method") ?? nodes[0]
}

function visibleSourceNodes(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): SourceNode[] {
  if (isLayerNode(focusNode)) return firstLayerNodes(nodes, links, focusNode)

  if (nodes.length <= DENSE_GRAPH_LIMIT) return nodes

  const visibleIds = new Set<string>([focusNode.id])
  const directIds = linkedNodeIds(links, focusNode.id)

  directIds.forEach((id) => visibleIds.add(id))
  siblingMethodIds(nodes, links, focusNode).forEach((id) => visibleIds.add(id))

  return [focusNode, ...nodes.filter((node) => node.id !== focusNode.id && visibleIds.has(node.id))].slice(
    0,
    DENSE_GRAPH_LIMIT,
  )
}

function firstLayerNodes(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): SourceNode[] {
  const visibleIds = linkedNodeIds(links, focusNode.id)

  return [focusNode, ...nodes.filter((node) => visibleIds.has(node.id))].slice(0, DENSE_GRAPH_LIMIT)
}

function isLayerNode(node: SourceNode): boolean {
  return node.type === "class" || node.type === "folder"
}

function linkedNodeIds(links: SourceLink[], nodeId: string): Set<string> {
  const ids = new Set<string>()

  links.forEach((link) => {
    if (link.source === nodeId) ids.add(link.target)
    if (link.target === nodeId) ids.add(link.source)
  })

  return ids
}

function siblingMethodIds(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): string[] {
  if (focusNode.type !== "method") return []

  const parentIds = links.filter((link) => link.target === focusNode.id).map((link) => link.source)

  return links
    .filter((link) => parentIds.includes(link.source) && link.target !== focusNode.id)
    .map((link) => nodes.find((node) => node.id === link.target))
    .filter((node): node is SourceNode => Boolean(node && node.id.includes(":method:")))
    .map((node) => node.id)
}

function createRuneNode(
  node: SourceNode,
  index: number,
  count: number,
  isFocus: boolean,
  isSelected: boolean,
): RuneNode {
  if (isFocus) {
    return {
      id: node.id,
      label: node.label,
      kind: runeKindForSourceType(node.type),
      x: CENTER_X,
      y: CENTER_Y,
      radius: radiusForSourceType(node.type, true),
      ring: "focus",
      isSelected,
    }
  }

  const angle = (Math.PI * 2 * index) / Math.max(count - 1, 1) - Math.PI / 2

  return {
    id: node.id,
    label: node.label,
    kind: runeKindForSourceType(node.type),
    x: Math.round(CENTER_X + Math.cos(angle) * LAYOUT_RADIUS_X),
    y: Math.round(CENTER_Y + Math.sin(angle) * LAYOUT_RADIUS_Y),
    radius: radiusForSourceType(node.type, false),
    ring: ringForSourceType(node.type),
    isSelected,
  }
}

function runeKindForSourceType(type: string): RuneKind {
  switch (type) {
    case "async":
      return "async"
    case "error":
      return "error"
    case "response":
      return "response"
    case "policy":
      return "policy"
    case "class":
    case "folder":
    case "method":
      return "method"
    default:
      return "local"
  }
}

function edgeKindForTarget(target: SourceNode | undefined): EdgeKind {
  switch (target?.type) {
    case "error":
      return "error"
    case "response":
      return "response"
    default:
      return "data"
  }
}

function ringForSourceType(type: string): RuneNode["ring"] {
  switch (type) {
    case "error":
    case "policy":
      return "dashed"
    default:
      return "solid"
  }
}

function radiusForSourceType(type: string, isFocus: boolean): number {
  if (isFocus) return 84

  switch (type) {
    case "class":
    case "folder":
      return 62
    case "method":
      return 50
    case "response":
      return 46
    default:
      return 40
  }
}

function emptySourceNode(): SourceNode {
  return {
    id: "empty-source",
    label: "No code found",
    type: "response",
  }
}
