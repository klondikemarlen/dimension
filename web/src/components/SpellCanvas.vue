<script setup lang="ts">
import { computed } from "vue"
import { curveCatmullRom, line } from "d3"

import type { EdgeKind, RuneNode, SpellDiagram } from "@/types/spell-diagram"

interface GroupBoundary {
  id: string
  cx: number
  cy: number
  rx: number
  ry: number
  hue: number
  label: string
  lines: string[]
  labelY: number
}

const MAX_NODE_LABEL_LINE_LENGTH = 10
const MAX_NODE_LABEL_LINES = 2
const MAX_GROUP_LABEL_LINE_LENGTH = 24
const MAX_GROUP_LABEL_LINES = 2
const GROUP_LABEL_LINE_HEIGHT = 12
const GROUP_LABEL_PADDING_Y = 12
const GROUP_LABEL_PADDING_X = 10
const props = defineProps<{
  diagram: SpellDiagram
}>()

const emit = defineEmits<{
  selectNode: [id: string]
}>()

const nodeById = computed(() => new Map(props.diagram.nodes.map((node) => [node.id, node])))

const pathBuilder = line<[number, number]>()
  .x((point: [number, number]) => point[0])
  .y((point: [number, number]) => point[1])
  .curve(curveCatmullRom.alpha(0.5))

const runeBoundaries = computed<GroupBoundary[]>(() => {
  const byGroup = new Map<string, RuneNode[]>()

  props.diagram.nodes.forEach((node) => {
    if (node.group) {
      const nodes = byGroup.get(node.group) ?? []
      nodes.push(node)
      byGroup.set(node.group, nodes)
    }
  })

  return [...byGroup.entries()]
    .filter(([, nodes]) => nodes.length > 1)
    .map(([id, nodes]) => {
      let minX = Number.POSITIVE_INFINITY
      let maxX = Number.NEGATIVE_INFINITY
      let minY = Number.POSITIVE_INFINITY
      let maxY = Number.NEGATIVE_INFINITY

      nodes.forEach((node) => {
        const nodeCollisionRadius = node.collisionRadius ?? node.radius
        minX = Math.min(minX, node.x - nodeCollisionRadius)
        maxX = Math.max(maxX, node.x + nodeCollisionRadius)
        minY = Math.min(minY, node.y - nodeCollisionRadius)
        maxY = Math.max(maxY, node.y + nodeCollisionRadius)
      })

      const label = resolveGroupLabel(nodes, id)
      const lines = splitLabelLines(label, MAX_GROUP_LABEL_LINE_LENGTH, MAX_GROUP_LABEL_LINES)
      const lineHeight = Math.max(1, lines.length) * GROUP_LABEL_LINE_HEIGHT
      const desiredLabelY = Math.round((minY + maxY) / 2 - lineHeight / 2)
      const minLabelY = minY + GROUP_LABEL_PADDING_Y
      const maxLabelY = maxY - GROUP_LABEL_PADDING_Y - lineHeight + 2
      const labelY = Math.max(minLabelY, Math.min(desiredLabelY, maxLabelY))

      return {
        id,
        cx: Math.round((minX + maxX) / 2),
        cy: Math.round((minY + maxY) / 2),
        rx: Math.round((maxX - minX) / 2 + 22 + GROUP_LABEL_PADDING_X),
        ry: Math.round((maxY - minY) / 2 + 16),
        hue: groupHue(id),
        label,
        lines,
        labelY,
      }
    })
})

const edges = computed(() =>
  props.diagram.edges.flatMap((edge) => {
    const source = nodeById.value.get(edge.source)
    const target = nodeById.value.get(edge.target)

    if (!source || !target) return []

    return [
      {
        ...edge,
        source,
        target,
        path: buildEdgePath(source, target),
      },
    ]
  }),
)

const hasImportEdges = computed(() => props.diagram.edges.some((edge) => edge.kind === "import"))

function buildEdgePath(source: RuneNode, target: RuneNode): string {
  const midpoint: [number, number] = [
    (source.x + target.x) / 2,
    (source.y + target.y) / 2 - Math.abs(source.x - target.x) * 0.08,
  ]

  return (
    pathBuilder([
      [source.x, source.y],
      midpoint,
      [target.x, target.y],
    ]) ?? ""
  )
}

function edgeClass(kind: EdgeKind): string {
  return `leyline leyline--${kind}`
}

function nodeClass(node: RuneNode): string {
  return [
    "rune",
    `rune--${node.kind}`,
    node.ring ? `rune--${node.ring}` : "",
    node.isSelected ? "rune--selected" : "",
  ]
    .filter(Boolean)
    .join(" ")
}

function resolveGroupLabel(nodes: RuneNode[], fallback: string): string {
  return nodes
    .map((node) => node.groupLabel?.trim())
    .find(Boolean) ?? `${fallback} (${nodes.length})`
}

function nodeLabelLines(label: string): string[] {
  return splitLabelLines(label, MAX_NODE_LABEL_LINE_LENGTH, MAX_NODE_LABEL_LINES)
}

function splitLabelLines(label: string, maxCharsPerLine: number, maxLines: number): string[] {
  const words = label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_.:/-]+/)
    .filter(Boolean)

  const lines: string[] = []

  for (const word of words) {
    const token = word.length <= maxCharsPerLine ? word : `${word.slice(0, maxCharsPerLine - 1)}…`

    if (lines.length === 0 || lines[lines.length - 1] === "") {
      lines.push(token)
      continue
    }

    if (lines.length >= maxLines) {
      const currentLine = lines[maxLines - 1]
      if (!currentLine.endsWith("…")) {
        lines[maxLines - 1] = `${currentLine.slice(0, Math.max(3, maxCharsPerLine - 1))}…`
      }
      break
    }

    if (`${lines[lines.length - 1]} ${token}`.length <= maxCharsPerLine) {
      lines[lines.length - 1] = `${lines[lines.length - 1]} ${token}`
      continue
    }

    lines.push(token)
  }

  if (lines.length === 0) return []
  const compact = lines.slice(0, maxLines)
  const last = compact[compact.length - 1]

  if (lines.length > maxLines && !last.endsWith("…")) {
    compact[compact.length - 1] = `${last.slice(0, Math.max(3, maxCharsPerLine - 1))}…`
  }

  return compact
}

function groupHue(value: string): number {
  let hash = 0
  for (const char of value) {
    hash = (hash * 13 + char.charCodeAt(0)) % 360
  }
  return hash
}
</script>

<template>
  <figure class="spell-canvas" :aria-label="diagram.title">
    <svg viewBox="0 0 1080 720" preserveAspectRatio="xMidYMin meet" role="img">
      <title>{{ diagram.title }}</title>
      <desc>{{ diagram.subtitle }}</desc>

      <defs>
        <marker
          id="arrowhead"
          markerWidth="16"
          markerHeight="16"
          refX="10"
          refY="5"
          orient="auto"
          markerUnits="strokeWidth"
        >
          <path d="M 0 0 L 10 5 L 0 10 z" class="arrowhead" />
        </marker>
        <filter id="ink-bleed">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="0.8" />
        </filter>
      </defs>

      <rect class="parchment" x="24" y="24" width="1032" height="672" rx="34" />
      <circle class="scope-ring scope-ring--outer" cx="540" cy="360" r="300" />
      <circle class="scope-ring scope-ring--inner" cx="540" cy="360" r="188" />

      <g class="rune-groups">
        <ellipse
          v-for="group in runeBoundaries"
          :key="group.id"
          class="rune-group"
          :cx="group.cx"
          :cy="group.cy"
          :rx="group.rx"
          :ry="group.ry"
          :style="{ stroke: `hsla(${group.hue}, 68%, 35%, 0.4)`, fill: `hsla(${group.hue}, 70%, 44%, 0.1)` }"
        />
        <text
          v-for="group in runeBoundaries"
          :key="`label-${group.id}`"
          class="rune-group__label"
          :x="group.cx"
          :y="group.labelY"
          text-anchor="middle"
          dominant-baseline="hanging"
          :style="{ fill: `hsl(${group.hue}, 40%, 16%)` }"
        >
          <tspan v-for="(line, index) in group.lines" :key="`label-${group.id}-${index}`" :x="group.cx" :dy="index ? 14 : 0">
            {{ line }}
          </tspan>
        </text>
      </g>


      <g class="leylines" filter="url(#ink-bleed)">
        <path
          v-for="edge in edges"
          :key="edge.id"
          :class="edgeClass(edge.kind)"
          :d="edge.path"
          marker-end="url(#arrowhead)"
        />
      </g>

      <g class="runes">
        <g
          v-for="node in diagram.nodes"
          :key="node.id"
          :class="nodeClass(node)"
          :transform="`translate(${node.x} ${node.y})`"
          role="button"
          tabindex="0"
          :aria-label="`Select ${node.label}`"
          :aria-pressed="node.isSelected"
          @click="emit('selectNode', node.id)"
          @keydown.enter="emit('selectNode', node.id)"
          @keydown.space.prevent="emit('selectNode', node.id)"
        >
          <circle :r="node.radius" />
          <circle v-if="node.kind === 'async'" class="async-halo" :r="node.radius + 11" />
          <text text-anchor="middle" dominant-baseline="middle">
            <tspan
              v-for="(line, index) in nodeLabelLines(node.label)"
              :key="`${node.id}-${line}-${index}`"
              x="0"
              :dy="index === 0 ? -7 : 16"
            >
              {{ line }}
            </tspan>
          </text>
        </g>
      </g>
    </svg>

    <figcaption>
      <strong>{{ diagram.title }}</strong>
      <span>{{ diagram.subtitle }}</span>
      <small v-if="hasImportEdges" class="relationship-key">Solid lines: containment · dashed orange lines: local imports</small>
    </figcaption>
  </figure>

</template>
