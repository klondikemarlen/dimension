import type { SourceGraph, SourceLink, SourceNode } from "@/types/source-graph"
import type { EdgeKind, RuneKind, RuneNode, SpellDiagram } from "@/types/spell-diagram"

const TAU = Math.PI * 2
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5))

const CANVAS_WIDTH = 1080
const CANVAS_HEIGHT = 720
const CENTER_X = CANVAS_WIDTH / 2
const CENTER_Y = CANVAS_HEIGHT / 2
const CANVAS_PADDING = 56
const LAYOUT_RADIUS_X = 300
const LAYOUT_RADIUS_Y = 205
const DENSE_GRAPH_LIMIT = 28
const CONTEXT_X = 175
const CONTEXT_GAP_Y = 120
const CONTEXT_MAX_PER_COLUMN = 8
const CONTEXT_COLUMN_SPACING = 145
const DETAIL_GROUP_PADDING = 16
const DETAIL_LIMIT = 14
const DETAIL_GROUP_TARGET_SIZE = 8
const DETAIL_GROUP_BUCKET_MAX = 5
const GROUP_ORBIT_X = 300
const GROUP_ORBIT_Y = 165
const GROUP_RING_BASE_RADIUS = 56
const GROUP_RING_STEP = 36
const COLLISION_PASSES = 320
const ANCHOR_PULL = 0.009
const MIN_MOVE = 0.001
const GROUP_RING_SPAN = TAU
const LABEL_COLLISION_MAX_CHARS = 10
const LABEL_COLLISION_MAX_LINES = 2
const LABEL_COLLISION_CHAR_WIDTH = 7.2
const LABEL_COLLISION_LINE_HEIGHT = 16
const LABEL_COLLISION_PADDING = 8

type DetailLayout = { x: number; y: number; group: string; groupLabel: string }

export interface SpellDiagramInput {
  graph: SourceGraph
  title: string
  subtitle: string
  selectedNodeId?: string
}

export function createSpellDiagramFromSourceGraph(input: SpellDiagramInput): SpellDiagram {
  const sourceNodes = uniqueSourceNodesById(input.graph.nodes.length > 0 ? input.graph.nodes : [emptySourceNode()])
  const focusNode = focusNodeFor(sourceNodes, input.selectedNodeId)
  const visibleNodes = uniqueSourceNodesById(visibleSourceNodes(sourceNodes, input.graph.links, focusNode))
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id))
  const hiddenCount = sourceNodes.length - visibleNodes.length
  const subtitle =
    hiddenCount > 0
      ? `${input.subtitle} Showing ${visibleNodes.length} of ${sourceNodes.length}; click a linked rune to refocus.`
      : input.subtitle
  const detailLayouts = layoutDetailNodes(visibleNodes, input.graph.links, focusNode)
  const contextIndexes = new Map<string, number>()
  const detailIndexes = new Map<string, number>()

  visibleNodes.forEach((node) => {
    if (node.type === "context") {
      contextIndexes.set(node.id, contextIndexes.size)
      return
    }

    if (node.id !== focusNode.id) {
      detailIndexes.set(node.id, detailIndexes.size)
    }
  })

  const nodes = visibleNodes.map((node, index) =>
    createRuneNode(
      node,
      index,
      visibleNodes.length,
      node.id === focusNode.id,
      node.id === input.selectedNodeId,
      contextIndexes.get(node.id) ?? 0,
      contextCount(visibleNodes),
      detailIndexes.get(node.id) ?? 0,
      detailIndexes.size,
      detailLayouts.get(node.id),
    ),
  )

  const fixedNodeIds = new Set<string>(
    visibleNodes
      .filter((node) => node.id === focusNode.id || node.type === "context")
      .map((node) => node.id),
  )
  const anchorsByNodeId = new Map<string, { x: number; y: number }>()
  detailLayouts.forEach((layout, nodeId) => {
    anchorsByNodeId.set(nodeId, { x: layout.x, y: layout.y })
  })

  resolveOverlaps(nodes, fixedNodeIds, anchorsByNodeId)

  const edges: SpellDiagram["edges"] = []
  const edgeIds = new Set<string>()

  input.graph.links.forEach((link) => {
    const edgeId = JSON.stringify([link.source, link.target, link.kind ?? "contains"])

    if (!visibleNodeIds.has(link.source) || !visibleNodeIds.has(link.target)) return
    if (edgeIds.has(edgeId)) return

    const source = visibleNodes.find((node) => node.id === link.source)
    const target = visibleNodes.find((node) => node.id === link.target)
    if (source?.type === "context" && target?.type === "context") return

    edges.push({
      id: edgeId,
      source: link.source,
      target: link.target,
      kind: edgeKindFor(link, source, target),
    })
    edgeIds.add(edgeId)
  })

  return {
    title: input.title,
    subtitle,
    nodes,
    edges,
  }
}

function focusNodeFor(nodes: SourceNode[], selectedNodeId: string | undefined): SourceNode {
  return nodes.find((node) => node.id === selectedNodeId) ?? nodes.find((node) => node.type === "method") ?? nodes[0]
}

function visibleSourceNodes(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): SourceNode[] {
  if (isLayerNode(focusNode)) return firstLayerNodes(nodes, links, focusNode)

  const parentNodes = parentContextNodes(nodes, links, focusNode)
  const directIds = linkedNodeIds(links, focusNode.id)
  parentNodes.forEach((node) => directIds.delete(node.id))

  const siblingIds = siblingMethodIds(nodes, links, focusNode).slice(0, 6)
  const siblingNodes = siblingIds
    .map((id) => nodes.find((node) => node.id === id))
    .filter((node): node is SourceNode => Boolean(node))
    .map(asContextNode)
  siblingIds.forEach((id) => directIds.delete(id))
  const detailNodes = nodes.filter((node) => directIds.has(node.id)).slice(0, DETAIL_LIMIT)

  return uniqueSourceNodesById([focusNode, ...parentNodes.map(asContextNode), ...siblingNodes, ...detailNodes])
}

function firstLayerNodes(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): SourceNode[] {
  const childIds = new Set(
    links
      .filter((link) => link.kind !== "imports" && link.source === focusNode.id)
      .map((link) => link.target),
  )
  const importIds =
    focusNode.type === "file"
      ? new Set(
          links
            .filter(
              (link) => link.kind === "imports" && (link.source === focusNode.id || link.target === focusNode.id),
            )
            .map((link) => (link.source === focusNode.id ? link.target : link.source)),
        )
      : new Set<string>()
  const childNodes = nodes.filter((node) => childIds.has(node.id))
  const importNodes = nodes.filter((node) => importIds.has(node.id))

  return uniqueSourceNodesById([focusNode, ...childNodes, ...importNodes]).slice(0, DENSE_GRAPH_LIMIT)
}

function isLayerNode(node: SourceNode): boolean {
  return node.type === "class" || node.type === "file" || node.type === "folder"
}

function uniqueSourceNodesById(nodes: SourceNode[]): SourceNode[] {
  const seen = new Set<string>()
  const deduped: SourceNode[] = []

  nodes.forEach((node) => {
    if (seen.has(node.id)) return
    seen.add(node.id)
    deduped.push(node)
  })

  return deduped
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
  if (!focusNode.id.includes(":method:")) return []

  const containmentLinks = links.filter((link) => link.kind !== "imports")
  const parentIds = containmentLinks.filter((link) => link.target === focusNode.id).map((link) => link.source)
  const siblingIds = new Set<string>()

  containmentLinks.forEach((link) => {
    if (!parentIds.includes(link.source) || link.target === focusNode.id) return

    const siblingNode = nodes.find((node) => node.id === link.target)
    if (!siblingNode || !siblingNode.id.includes(":method:")) return

    siblingIds.add(siblingNode.id)
  })

  return [...siblingIds].slice(0, 6)
}



function parentContextNodes(nodes: SourceNode[], links: SourceLink[], focusNode: SourceNode): SourceNode[] {
  return links
    .filter((link) => link.kind !== "imports" && link.target === focusNode.id)
    .map((link) => nodes.find((node) => node.id === link.source))
    .filter((node): node is SourceNode => Boolean(node))
    .slice(0, 1)
}

function asContextNode(node: SourceNode): SourceNode {
  return {
    ...node,
    type: "context",
  }
}

function layoutDetailNodes(
  visibleNodes: SourceNode[],
  links: SourceLink[],
  focusNode: SourceNode,
): Map<string, DetailLayout> {
  const detailNodes = visibleNodes.filter((node) => node.id !== focusNode.id && node.type !== "context")
  if (detailNodes.length === 0) return new Map()

  const grouped = groupByRelationship(detailNodes, links, focusNode)
  const groupedWithLabels = new Map<string, { members: SourceNode[]; label: string }>()

  grouped.forEach((members, groupId) => {
    const groupLabel = relationshipGroupLabel(groupId)

    if (members.length <= DETAIL_GROUP_TARGET_SIZE) {
      groupedWithLabels.set(groupId, { members, label: groupLabel })
      return
    }

    const bucketedGroups = splitRelationshipGroup(groupId, members)
    bucketedGroups.forEach((bucketMembers, bucketId) => {
      const bucketLabel = `${groupLabel} batch ${bucketIndexFromGroupId(bucketId)}`
      groupedWithLabels.set(bucketId, { members: bucketMembers, label: bucketLabel })
    })
  })

  const anchorInputs = new Map<string, SourceNode[]>()
  groupedWithLabels.forEach((value, groupId) => anchorInputs.set(groupId, value.members))
  const anchors = groupAnchors(anchorInputs)
  const layouts = new Map<string, DetailLayout>()

  groupedWithLabels.forEach((group, groupId) => {
    const members = group.members.toSorted((left, right) => {
      if (left.type !== right.type) return left.type.localeCompare(right.type)
      return left.label.localeCompare(right.label)
    })
    const anchor = anchors.get(groupId)
    if (!anchor || members.length === 0) return

    const groupNodeRadius = maxNodeRadius(members)
    const nodeSpacing = groupNodeRadius * 2 + DETAIL_GROUP_PADDING * 2.2
    const anchorAngle = Math.atan2(anchor.y - CENTER_Y, anchor.x - CENTER_X)
    const ringRadiusStep = Math.max(GROUP_RING_STEP, groupNodeRadius * 2 + DETAIL_GROUP_PADDING * 1.2)
    const minCenterDistance = groupNodeRadius * 2 + DETAIL_GROUP_PADDING
    let cursor = 0
    let ring = 0

    while (cursor < members.length) {
      const projectedRingRadius = GROUP_RING_BASE_RADIUS + ring * ringRadiusStep
      const ringAngleSpan = GROUP_RING_SPAN
      const estimatedCount = Math.min(
        Math.max(1, Math.floor((ringAngleSpan * projectedRingRadius) / (nodeSpacing * 1.12))),
        members.length - cursor,
      )
      const ringRadius =
        estimatedCount <= 1
          ? projectedRingRadius
          : Math.max(
              projectedRingRadius,
              minCenterDistance / (2 * Math.sin(ringAngleSpan / (2 * Math.max(2, estimatedCount)))),
            )
      const ringCapacity = Math.min(
        Math.floor((ringAngleSpan * ringRadius) / (nodeSpacing * 1.12)),
        members.length - cursor,
      )
      const count = Math.max(1, Math.min(ringCapacity, estimatedCount))
      const arcStart = anchorAngle + GOLDEN_ANGLE * ring

      for (let i = 0; i < count; i++) {
        const node = members[cursor + i]
        const localAngle =
          count === 1
            ? 0
            : Math.abs(ringAngleSpan - TAU) < 0.0001
              ? (i / count) * TAU + (ring % 2 ? TAU / (2 * count) : 0)
              : ((i + (ring % 2 ? 0.5 : 0)) / (count - 1) - 0.5) * ringAngleSpan
        const angle = arcStart + localAngle
        layouts.set(node.id, {
          x: anchor.x + Math.cos(angle) * ringRadius,
          y: anchor.y + Math.sin(angle) * ringRadius,
          group: groupId,
          groupLabel: `${group.label}`.trim(),
        })
      }

      cursor += count
      ring += 1
    }
  })

  return layouts
}

function relationshipGroupLabel(groupId: string): string {
  const baseGroupId = stripBucketSuffix(groupId)
  const parsed = parseRelationshipGroup(baseGroupId)
  const parentLabel = formatNodeLabel(parsed.parentId)

  if (parsed.relationshipKind === "imports") return `Imports near ${parentLabel}`

  return `${pluralizeNodeType(parsed.nodeType)} from ${parentLabel}`
}

function bucketIndexFromGroupId(groupId: string): number {
  const bucketIndexMatch = groupId.match(/:bucket:(\d+)$/)
  if (!bucketIndexMatch) return 1

  return Number(bucketIndexMatch[1]) || 1
}

function pluralizeNodeType(nodeType: string): string {
  if (nodeType.endsWith("s")) return nodeType
  return `${nodeType}s`
}

function stripBucketSuffix(groupId: string): string {
  const match = groupId.match(/(.+):bucket:\d+$/)
  if (!match) return groupId

  return match[1]
}

function parseRelationshipGroup(groupId: string): {
  parentId: string
  relationshipKind: "contains" | "imports"
  nodeType: string
} {
  const relationshipKind = groupId.startsWith("imports:") ? "imports" : "contains"
  const groupWithoutKind = groupId.slice(`${relationshipKind}:`.length)
  const delimiterIndex = groupWithoutKind.lastIndexOf(":")

  if (delimiterIndex <= 0 || delimiterIndex === groupWithoutKind.length - 1) {
    return { parentId: "root", relationshipKind, nodeType: "item" }
  }

  return {
    parentId: groupWithoutKind.slice(0, delimiterIndex),
    relationshipKind,
    nodeType: groupWithoutKind.slice(delimiterIndex + 1),
  }
}

function formatNodeLabel(nodeId: string): string {
  const path = nodeId.includes(":") ? nodeId.split(":").slice(1).join(":") : nodeId
  const segments = path.split("/").filter(Boolean)

  const parentLabel = segments.at(-1) || path

  return parentLabel || "root"
}
function maxNodeRadius(nodes: SourceNode[]): number {
  let radius = 0

  nodes.forEach((node) => {
    const nextRadius = radiusForSourceType(node.type, false)
    if (nextRadius > radius) radius = nextRadius
  })

  return Math.max(1, radius)
}

function groupByRelationship(
  detailNodes: SourceNode[],
  links: SourceLink[],
  focusNode: SourceNode,
): Map<string, SourceNode[]> {
  const byTypeAndParent = new Map<string, SourceNode[]>()

  for (const node of detailNodes) {
    const directRelationship = links.find(
      (link) =>
        (link.source === focusNode.id && link.target === node.id) ||
        (link.target === focusNode.id && link.source === node.id),
    )
    const incomingRelationship = links.find((link) => link.target === node.id)
    const relationship = directRelationship ?? incomingRelationship
    const parentId = directRelationship ? focusNode.id : relationship?.source ?? focusNode.id
    const relationshipKind = relationship?.kind === "imports" ? "imports" : "contains"
    const relationshipGroupId = `${relationshipKind}:${parentId}:${node.type}`
    const members = byTypeAndParent.get(relationshipGroupId) ?? []
    members.push(node)
    byTypeAndParent.set(relationshipGroupId, members)
  }

  const grouped = new Map<string, SourceNode[]>()
  byTypeAndParent.forEach((members, groupId) => {
    if (members.length <= DETAIL_GROUP_TARGET_SIZE) {
      grouped.set(groupId, members)
      return
    }

    splitRelationshipGroup(groupId, members).forEach((bucketMembers, bucketId) => {
      grouped.set(bucketId, bucketMembers)
    })
  })

  return grouped
}

function splitRelationshipGroup(groupId: string, members: SourceNode[]): Map<string, SourceNode[]> {
  const sortedMembers = members.toSorted((left, right) => left.label.localeCompare(right.label))
  const bucketCount = Math.min(Math.ceil(sortedMembers.length / DETAIL_GROUP_TARGET_SIZE), DETAIL_GROUP_BUCKET_MAX)
  const bucketSize = Math.ceil(sortedMembers.length / bucketCount)
  const grouped = new Map<string, SourceNode[]>()

  sortedMembers.forEach((member, index) => {
    const bucketIndex = Math.min(Math.floor(index / bucketSize), bucketCount - 1)
    const bucketId = `${groupId}:bucket:${bucketIndex + 1}`
    const bucketMembers = grouped.get(bucketId) ?? []
    grouped.set(bucketId, [...bucketMembers, member])
  })

  return grouped
}

function maxNodeRadiusByGroups(groups: Map<string, SourceNode[]>): number {
  let radius = 0

  groups.forEach((nodes) => {
    const groupRadius = maxNodeRadius(nodes)
    if (groupRadius > radius) radius = groupRadius
  })

  return Math.max(1, radius)
}

function groupAnchors(grouped: Map<string, SourceNode[]>): Map<string, { x: number; y: number }> {
  const anchors = new Map<string, { x: number; y: number }>()
  const groupIds = [...grouped.keys()]
  const groupCount = groupIds.length
  if (groupCount === 0) return anchors

  if (groupCount === 1) {
    const singleGroupId = groupIds[0]
    const singleGroup = grouped.get(singleGroupId) ?? []
    const singleGroupRadius = maxNodeRadius(singleGroup)
    const singleGroupX = CANVAS_WIDTH - CANVAS_PADDING - singleGroupRadius - DETAIL_GROUP_PADDING
    const yOffset = clamp(
      DETAIL_GROUP_PADDING + singleGroupRadius / 2 + Math.min(92, singleGroup.length * 4.8),
      40,
      GROUP_ORBIT_Y * 1.35,
    )
    const singleGroupY = clamp(
      CENTER_Y - yOffset,
      CANVAS_PADDING + singleGroupRadius + DETAIL_GROUP_PADDING,
      CANVAS_HEIGHT - CANVAS_PADDING - singleGroupRadius - DETAIL_GROUP_PADDING,
    )

    anchors.set(singleGroupId, { x: singleGroupX, y: singleGroupY })
    return anchors
  }

  const maxNodeRadiusValue = maxNodeRadiusByGroups(grouped)
  const minCenterDistance = maxNodeRadiusValue * 2 + DETAIL_GROUP_PADDING
  const xClearance = CANVAS_PADDING + maxNodeRadiusValue + DETAIL_GROUP_PADDING
  const yClearance = CANVAS_PADDING + maxNodeRadiusValue + DETAIL_GROUP_PADDING
  const maxOrbitX = Math.max(
    140,
    Math.min(
      GROUP_ORBIT_X,
      Math.min(CENTER_X - xClearance, CANVAS_WIDTH - xClearance - CENTER_X),
    ),
  )
  const maxOrbitY = Math.max(
    90,
    Math.min(
      GROUP_ORBIT_Y,
      Math.min(CENTER_Y - yClearance, CANVAS_HEIGHT - yClearance - CENTER_Y),
    ),
  )
  const orbitX = Math.min(maxOrbitX, Math.max(150, (minCenterDistance * groupCount) / TAU))
  const orbitY = Math.min(maxOrbitY, Math.max(90, orbitX * 0.58))

  groupIds.forEach((groupId, index) => {
    const angle = (TAU * index) / groupCount - Math.PI / 2 + GOLDEN_ANGLE * 0.3
    anchors.set(groupId, {
      x: clamp(CENTER_X + Math.cos(angle) * orbitX, CANVAS_PADDING, CANVAS_WIDTH - CANVAS_PADDING),
      y: clamp(CENTER_Y + Math.sin(angle) * orbitY, CANVAS_PADDING, CANVAS_HEIGHT - CANVAS_PADDING),
    })
  })

  return anchors
}

function resolveOverlaps(
  nodes: RuneNode[],
  fixedNodeIds: Set<string>,
  anchorsByNodeId: Map<string, { x: number; y: number }>,
): void {
  if (nodes.length < 2) return

  const movableNodes = nodes.filter((node) => !fixedNodeIds.has(node.id))
  if (movableNodes.length === 0) return
  if (anchorsByNodeId.size === 0) return

  const collisionRadii = new Map<string, number>(
    nodes.map((node) => [node.id, collisionRadiusForRune(node)]),
  )

  for (let pass = 0; pass < COLLISION_PASSES; pass++) {
    let moved = 0
    const deltas = new Map<string, { x: number; y: number }>()

    movableNodes.forEach((node) => {
      deltas.set(node.id, { x: 0, y: 0 })
    })

    for (let i = 0; i < nodes.length; i++) {
      const source = nodes[i]
      const sourceFixed = fixedNodeIds.has(source.id)
      const sourceDelta = sourceFixed ? undefined : deltas.get(source.id)
      const sourceCollisionRadius = collisionRadii.get(source.id)

      for (let j = i + 1; j < nodes.length; j++) {
        const target = nodes[j]
        const targetFixed = fixedNodeIds.has(target.id)
        const targetDelta = targetFixed ? undefined : deltas.get(target.id)
        const targetCollisionRadius = collisionRadii.get(target.id)

        if (sourceFixed && targetFixed) continue

        const dx = target.x - source.x
        const dy = target.y - source.y
        const minDistance =
          (sourceCollisionRadius ?? source.radius) + (targetCollisionRadius ?? target.radius) + DETAIL_GROUP_PADDING
        const minDistanceSq = minDistance * minDistance
        const actualDistanceSq = dx * dx + dy * dy
        if (actualDistanceSq >= minDistanceSq) continue

        const actualDistance = Math.sqrt(Math.max(0.0001, actualDistanceSq))
        const bothMovable = Boolean(sourceDelta) && Boolean(targetDelta)
        const overlap = (minDistance - actualDistance) / (bothMovable ? 2 : 1)
        if (overlap <= 0) continue

        let unitX = dx
        let unitY = dy

        if (actualDistanceSq === 0) {
          const driftAngle = deterministicAngle(source.id, target.id)
          unitX = Math.cos(driftAngle)
          unitY = Math.sin(driftAngle)
        } else {
          unitX /= actualDistance
          unitY /= actualDistance
        }

        if (sourceDelta) {
          sourceDelta.x -= unitX * overlap
          sourceDelta.y -= unitY * overlap
          moved += Math.abs(unitX * overlap) + Math.abs(unitY * overlap)
        }

        if (targetDelta) {
          targetDelta.x += unitX * overlap
          targetDelta.y += unitY * overlap
          moved += Math.abs(unitX * overlap) + Math.abs(unitY * overlap)
        }
      }
    }

    const shouldSettle = moved < MIN_MOVE || pass === COLLISION_PASSES - 1

    movableNodes.forEach((node) => {
      const delta = deltas.get(node.id)
      if (!delta) return

      const anchor = anchorsByNodeId.get(node.id)
      if (anchor && !shouldSettle) {
        delta.x += (anchor.x - node.x) * ANCHOR_PULL
        delta.y += (anchor.y - node.y) * ANCHOR_PULL
      }

      const nodeCollisionRadius = collisionRadii.get(node.id) ?? node.radius
      node.x = clamp(node.x + delta.x, CANVAS_PADDING + nodeCollisionRadius, CANVAS_WIDTH - CANVAS_PADDING - nodeCollisionRadius)
      node.y = clamp(node.y + delta.y, CANVAS_PADDING + nodeCollisionRadius, CANVAS_HEIGHT - CANVAS_PADDING - nodeCollisionRadius)
    })

    if (shouldSettle) break
  }
}

function deterministicAngle(left: string, right: string): number {
  let hash = 0
  for (const char of left) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360
  }
  for (const char of right) {
    hash = (hash * 31 + char.charCodeAt(0)) % 360
  }
  return (hash / 360) * TAU
}

function collisionRadiusForRune(node: RuneNode): number {
  return collisionRadiusForLabel(node.label, node.radius)
}

function collisionRadiusForLabel(label: string, baseRadius: number): number {
  const lines = splitLabelForCollision(label, LABEL_COLLISION_MAX_CHARS, LABEL_COLLISION_MAX_LINES)
  if (lines.length === 0) return baseRadius + LABEL_COLLISION_PADDING

  const maxLineLength = lines.reduce((currentMax, line) => Math.max(currentMax, line.length), 0)
  const estimatedTextHalfWidth = (maxLineLength * LABEL_COLLISION_CHAR_WIDTH) / 2
  const estimatedTextHalfHeight = (lines.length * LABEL_COLLISION_LINE_HEIGHT) / 2

  return Math.max(baseRadius, estimatedTextHalfWidth, estimatedTextHalfHeight) + LABEL_COLLISION_PADDING
}

function splitLabelForCollision(label: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_.:/-]+/)
    .filter(Boolean)

  const lines: string[] = []

  for (const word of words) {
    const token = word.length <= maxCharsPerLine ? word : `${word.slice(0, Math.max(1, maxCharsPerLine - 1))}…`

    if (lines.length === 0) {
      lines.push(token)
      continue
    }

    if (lines.length >= maxLines) {
      const last = lines[maxLines - 1]
      if (!last.endsWith("…")) {
        lines[maxLines - 1] = `${last.slice(0, Math.max(1, maxCharsPerLine - 1))}…`
      }
      break
    }

    if (`${lines[lines.length - 1]} ${token}`.length <= maxCharsPerLine) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${token}`
      continue
    }

    lines.push(token)
  }

  return lines
}

function contextCount(nodes: SourceNode[]): number {
  return nodes.filter((node) => node.type === "context").length
}

function createRuneNode(
  node: SourceNode,
  index: number,
  count: number,
  isFocus: boolean,
  isSelected: boolean,
  nodeContextIndex: number,
  nodeContextCount: number,
  nodeDetailIndex: number,
  nodeDetailCount: number,
  detailLayout?: DetailLayout,
): RuneNode {
  if (isFocus) {
    const radius = radiusForSourceType(node.type, true)

    return {
      id: node.id,
      label: node.label,
      kind: runeKindForSourceType(node.type),
      x: CENTER_X,
      y: CENTER_Y,
      radius,
      ring: "focus",
      isSelected,
      collisionRadius: collisionRadiusForLabel(node.label, radius),
    }
  }

  if (node.type === "context") {
    const contextRadius = radiusForSourceType(node.type, false)
    const contextRows = Math.min(nodeContextCount, CONTEXT_MAX_PER_COLUMN)
    const contextColumns = Math.max(1, Math.ceil(nodeContextCount / CONTEXT_MAX_PER_COLUMN))
    const contextRow = contextRows > 0 ? nodeContextIndex % contextRows : 0
    const contextColumn = contextRows > 0 ? Math.floor(nodeContextIndex / contextRows) : 0
    const contextRowSpan = Math.max(1, (CANVAS_HEIGHT - CANVAS_PADDING * 2) - contextRadius * 2)
    const contextGapY =
      contextRows <= 1 ? 0 : Math.min(CONTEXT_GAP_Y, contextRowSpan / Math.max(contextRows - 1, 1))
    const contextCenterOffset = contextRows <= 1 ? 0 : (contextRow - (contextRows - 1) / 2) * contextGapY
    const contextColumnSpan = contextColumns <= 1 ? 0 : Math.max(1, contextColumns - 1)
    const contextColumnGap =
      contextColumns <= 1
        ? 0
        : Math.min(CONTEXT_COLUMN_SPACING, (CANVAS_WIDTH - CANVAS_PADDING * 2 - contextRadius * 2) / contextColumnSpan)
    const contextRawStartX = CONTEXT_X - ((contextColumns - 1) * contextColumnGap) / 2
    const contextShiftX = Math.max(0, CANVAS_PADDING + contextRadius - contextRawStartX)
    const contextX = Math.min(
      CANVAS_WIDTH - CANVAS_PADDING - contextRadius,
      Math.round(contextRawStartX + contextShiftX + contextColumn * contextColumnGap),
    )

    return {
      id: node.id,
      label: node.label,
      kind: "context",
      x: contextX,
      y: Math.round(CENTER_Y + contextCenterOffset),
      radius: contextRadius,
      ring: "dashed",
      isSelected,
      collisionRadius: collisionRadiusForLabel(node.label, contextRadius),
    }
  }

  const detailAngle =
    nodeDetailCount <= 1 ? 0 : (Math.PI * 1.45 * nodeDetailIndex) / Math.max(nodeDetailCount - 1, 1) - Math.PI * 0.72

  const angle = detailLayout
    ? Math.atan2(detailLayout.y - CENTER_Y, detailLayout.x - CENTER_X)
    : nodeContextCount > 0
      ? detailAngle
      : (Math.PI * 2 * index) / Math.max(count - 1, 1) - Math.PI / 2

  const x = detailLayout
    ? detailLayout.x
    : Math.round(CENTER_X + Math.cos(angle) * LAYOUT_RADIUS_X)
  const y = detailLayout
    ? detailLayout.y
    : Math.round(CENTER_Y + Math.sin(angle) * LAYOUT_RADIUS_Y)
  const radius = radiusForSourceType(node.type, false)

  return {
    id: node.id,
    label: node.label,
    kind: runeKindForSourceType(node.type),
    x: Math.round(x),
    y: Math.round(y),
    radius,
    ring: ringForSourceType(node.type),
    isSelected,
    group: detailLayout?.group,
    groupLabel: detailLayout?.groupLabel,
    collisionRadius: collisionRadiusForLabel(node.label, radius),
  }
}

function runeKindForSourceType(type: string): RuneKind {
  switch (type) {
    case "async":
      return "async"
    case "context":
      return "context"
    case "error":
      return "error"
    case "response":
      return "response"
    case "policy":
      return "policy"
    case "class":
    case "folder":
    case "file":
    case "method":
      return "method"
    default:
      return "local"
  }
}

function edgeKindFor(link: SourceLink, source: SourceNode | undefined, target: SourceNode | undefined): EdgeKind {
  if (link.kind === "imports") return "import"
  if (source?.type === "context" || target?.type === "context") return "context"

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
    case "context":
      return 34
    case "class":
    case "folder":
    case "file":
      return 62
    case "method":
      return 50
    case "response":
      return 46
    default:
      return 40
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(value, max))
}

function emptySourceNode(): SourceNode {
  return {
    id: "empty-source",
    label: "No code found",
    type: "response",
  }
}
