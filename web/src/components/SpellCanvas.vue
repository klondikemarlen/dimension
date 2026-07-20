<script setup lang="ts">
import { computed } from "vue"
import { curveCatmullRom, line } from "d3"

import type { EdgeKind, RuneNode, SpellDiagram } from "@/types/spell-diagram"

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

function nodeLabelLines(label: string): string[] {
  return label
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .split(/[\s_.:/-]+/)
    .filter(Boolean)
    .slice(0, 2)
}
</script>

<template>
  <figure class="spell-canvas" :aria-label="diagram.title">
    <svg viewBox="0 0 1080 720" role="img">
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
      <circle class="scope-ring scope-ring--outer" cx="480" cy="330" r="300" />
      <circle class="scope-ring scope-ring--inner" cx="480" cy="330" r="188" />

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
    </figcaption>
  </figure>
</template>
