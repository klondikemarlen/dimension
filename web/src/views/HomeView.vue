<script setup lang="ts">
import { computed, ref } from "vue"

import SpellCanvas from "@/components/SpellCanvas.vue"
import { usersControllerIndexDiagram } from "@/fixtures/usersControllerIndex"
import { createGraphFromSourceFile } from "@/services/graph-import-service"
import { createProjectGraphFromFiles } from "@/services/project-folder-service"
import { createSpellDiagramFromSourceGraph } from "@/services/spell-diagram-adapter"
import type { SourceGraph } from "@/types/source-graph"
import type { RuneNode, SpellDiagram } from "@/types/spell-diagram"

const builtInSourceName = "Built-in controller fixture"
const defaultImportMessage = "Upload a source file for layered code review, or select a folder for a filename-only map."
const builtInSubtitle = "Controller fixture for reviewing project organization across method, policy, query, and response layers."
const workspaceStorageKey = "dimension:last-workspace"
const persistedWorkspace = readPersistedWorkspace()

interface PersistedWorkspace {
  graph: SourceGraph
  title: string
  subtitle: string
  sourceName: string
  selectedNodeId?: string
  message: string
}

const sourceGraph = ref<SourceGraph | undefined>(persistedWorkspace?.graph)
const diagramTitle = ref(persistedWorkspace?.title ?? builtInSourceName)
const diagramSubtitle = ref(persistedWorkspace?.subtitle ?? builtInSubtitle)
const selectedSourceName = ref(persistedWorkspace?.sourceName ?? builtInSourceName)
const selectedNodeId = ref<string | undefined>(persistedWorkspace?.selectedNodeId)
const importStatus = ref<"idle" | "loading" | "success" | "error">(persistedWorkspace ? "success" : "idle")
const importMessage = ref(persistedWorkspace?.message ?? defaultImportMessage)
const isImporting = computed(() => importStatus.value === "loading")
const currentDiagram = computed<SpellDiagram>(() => {
  if (!sourceGraph.value) return usersControllerIndexDiagram

  return createSpellDiagramFromSourceGraph({
    graph: sourceGraph.value,
    title: diagramTitle.value,
    subtitle: diagramSubtitle.value,
    selectedNodeId: selectedNodeId.value,
  })
})
const selectedNode = computed(() => currentDiagram.value.nodes.find((node) => node.id === selectedNodeId.value))
const selectedConnections = computed(() => connectedNodes(currentDiagram.value, selectedNode.value))

function loadBuiltInSample(): void {
  sourceGraph.value = undefined
  diagramTitle.value = builtInSourceName
  diagramSubtitle.value = builtInSubtitle
  selectedSourceName.value = builtInSourceName
  selectedNodeId.value = undefined
  importStatus.value = "idle"
  importMessage.value = defaultImportMessage
  clearPersistedWorkspace()
}

async function importSourceFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const sourceFile = input.files?.[0]

  if (!sourceFile) return

  importStatus.value = "loading"
  importMessage.value = `Parsing ${sourceFile.name} through the server importer…`

  try {
    const graph = await createGraphFromSourceFile(sourceFile)
    const selectedId = firstLayerNodeId(graph) ?? graph.nodes[0]?.id
    const message = `Mapped ${graph.nodes.length} code parts and ${graph.links.length} links from ${sourceFile.name}.`

    setWorkspace({
      graph,
      title: sourceFile.name,
      subtitle: "High-level code map imported from the server parser.",
      sourceName: sourceFile.name,
      selectedNodeId: selectedId,
      message,
    })
  } catch (error) {
    importStatus.value = "error"
    importMessage.value = error instanceof Error ? error.message : "The source importer could not render that file."
  } finally {
    input.value = ""
  }
}

function importProjectFolder(event: Event): void {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) return

  const graph = createProjectGraphFromFiles(files)
  const folderName = graph.nodes[0]?.label ?? "Selected project"
  const selectedId = graph.nodes[0]?.id
  const message = `Mapped ${directChildCount(graph, selectedId)} first-layer items from ${folderName}; file contents stayed local.`

  setWorkspace({
    graph,
    title: folderName,
    subtitle: "Filename-only project map. This MVP shows the selected folder's direct children only.",
    sourceName: folderName,
    selectedNodeId: selectedId,
    message,
  })
  input.value = ""
}

function selectNode(id: string): void {
  selectedNodeId.value = id
  persistCurrentWorkspace()
}

function setWorkspace(workspace: PersistedWorkspace): void {
  sourceGraph.value = workspace.graph
  diagramTitle.value = workspace.title
  diagramSubtitle.value = workspace.subtitle
  selectedSourceName.value = workspace.sourceName
  selectedNodeId.value = workspace.selectedNodeId
  importStatus.value = "success"
  importMessage.value = workspace.message
  persistWorkspace(workspace)
}

function persistCurrentWorkspace(): void {
  if (!sourceGraph.value) return

  persistWorkspace({
    graph: sourceGraph.value,
    title: diagramTitle.value,
    subtitle: diagramSubtitle.value,
    sourceName: selectedSourceName.value,
    selectedNodeId: selectedNodeId.value,
    message: importMessage.value,
  })
}

function firstLayerNodeId(graph: SourceGraph): string | undefined {
  return graph.nodes.find((node) => node.type === "class" || node.type === "folder")?.id ?? graph.nodes[0]?.id
}

function directChildCount(graph: SourceGraph, nodeId: string | undefined): number {
  if (!nodeId) return 0

  return graph.links.filter((link) => link.source === nodeId).length
}

function connectedNodes(diagram: SpellDiagram, node: RuneNode | undefined): RuneNode[] {
  if (!node) return []

  const connectionIds = new Set<string>()

  diagram.edges.forEach((edge) => {
    if (edge.source === node.id) connectionIds.add(edge.target)
    if (edge.target === node.id) connectionIds.add(edge.source)
  })

  return diagram.nodes.filter((candidate) => connectionIds.has(candidate.id))
}

function readPersistedWorkspace(): PersistedWorkspace | undefined {
  try {
    const value = localStorage.getItem(workspaceStorageKey)

    return value ? (JSON.parse(value) as PersistedWorkspace) : undefined
  } catch {
    return undefined
  }
}

function persistWorkspace(workspace: PersistedWorkspace): void {
  try {
    localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace))
  } catch {
    // Best effort only. The in-memory workspace is still loaded.
  }
}

function clearPersistedWorkspace(): void {
  try {
    localStorage.removeItem(workspaceStorageKey)
  } catch {
    // Best effort only. The built-in sample is still loaded.
  }
}
</script>

<template>
  <main class="workspace">
    <section class="hero-panel" aria-labelledby="dimension-title">
      <p class="eyebrow">Project intelligence for humans and agents</p>
      <h1 id="dimension-title">See what AI built.</h1>
      <p class="hero-copy">
        Dimension maps project code into browsable layers so humans and AI agents can inspect structure,
        spot organization problems, and ask for focused changes without reading every file by hand.
      </p>
      <form class="source-import" aria-label="Import source file or project folder">
        <label>
          <span>Source file</span>
          <input
            type="file"
            accept=".ts,.tsx,.rb,text/typescript,text/x-ruby"
            :disabled="isImporting"
            @change="importSourceFile"
          />
        </label>
        <label>
          <span>Project folder</span>
          <input type="file" webkitdirectory multiple :disabled="isImporting" @change="importProjectFolder" />
        </label>
        <button type="button" :disabled="isImporting" @click="loadBuiltInSample">Load built-in sample</button>
        <p class="source-import__status" :class="`source-import__status--${importStatus}`" aria-live="polite">
          {{ importMessage }}
        </p>
      </form>
      <dl class="framework-grid" aria-label="Current source graph">
        <div>
          <dt>Source</dt>
          <dd>{{ selectedSourceName }}</dd>
        </div>
        <div>
          <dt>Visual shell</dt>
          <dd>Vue 3 + Scalable Vector Graphics</dd>
        </div>
        <div>
          <dt>Source import</dt>
          <dd>Express + ts-morph</dd>
        </div>
      </dl>
      <section class="graph-details" aria-label="Selected rune details">
        <p class="eyebrow">Navigation</p>
        <h2>{{ selectedNode?.label ?? "Click a rune" }}</h2>
        <p>
          {{
            selectedNode
              ? `${selectedConnections.length} linked rune${selectedConnections.length === 1 ? "" : "s"}`
              : "Select any rune to see linked neighbors and refocus dense graphs."
          }}
        </p>
        <div v-if="selectedConnections.length" class="graph-details__links">
          <button
            v-for="connection in selectedConnections"
            :key="connection.id"
            type="button"
            @click="selectNode(connection.id)"
          >
            {{ connection.label }}
          </button>
        </div>
      </section>
    </section>

    <SpellCanvas :diagram="currentDiagram" @select-node="selectNode" />
  </main>
</template>
