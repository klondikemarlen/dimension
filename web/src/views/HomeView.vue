<script setup lang="ts">
import { computed, nextTick, ref } from "vue"

import SpellCanvas from "@/components/SpellCanvas.vue"
import { usersControllerIndexDiagram } from "@/fixtures/usersControllerIndex"
import { publicProjectExamples, type PublicProjectExample } from "@/fixtures/publicProjectExamples"
import { createGraphFromSourceFile } from "@/services/graph-import-service"
import { createProjectGraphFromFiles } from "@/services/project-folder-service"
import { createSpellDiagramFromSourceGraph } from "@/services/spell-diagram-adapter"
import type { SourceGraph } from "@/types/source-graph"
import type { RuneNode, SpellDiagram } from "@/types/spell-diagram"

const builtInSourceName = "Built-in controller fixture"
const defaultImportMessage = "Upload a source file for layered code review, or select a folder for a filename-only map."
const builtInSubtitle = "Controller fixture for reviewing project organization across method, policy, query, and response layers."
const workspaceStorageKey = "dimension:last-workspace"
const defaultPageTitle = "Dimension Project Intelligence"
const urlExample = readExampleFromUrl()
const storedWorkspace = readPersistedWorkspace()
const persistedWorkspace = urlExample ? workspaceFromExample(urlExample, storedWorkspace) : storedWorkspace
interface PersistedWorkspace {
  graph: SourceGraph
  title: string
  subtitle: string
  sourceName: string
  selectedNodeId?: string
  message: string
  exampleId?: string
  sourceUrl?: string
}

const sourceGraph = ref<SourceGraph | undefined>(persistedWorkspace?.graph)
const diagramTitle = ref(persistedWorkspace?.title ?? builtInSourceName)
const diagramSubtitle = ref(persistedWorkspace?.subtitle ?? builtInSubtitle)
const selectedSourceName = ref(persistedWorkspace?.sourceName ?? builtInSourceName)
const selectedSourceUrl = ref<string | undefined>(persistedWorkspace?.sourceUrl)
const selectedExampleId = ref<string | undefined>(persistedWorkspace?.exampleId)
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
syncDocumentTitle(diagramTitle.value)

function loadBuiltInSample(): void {
  sourceGraph.value = undefined
  diagramTitle.value = builtInSourceName
  diagramSubtitle.value = builtInSubtitle
  selectedSourceName.value = builtInSourceName
  selectedSourceUrl.value = undefined
  selectedNodeId.value = undefined
  importStatus.value = "idle"
  selectedExampleId.value = undefined
  importMessage.value = defaultImportMessage
  clearPersistedWorkspace()
  replaceUrlState()
  syncDocumentTitle(builtInSourceName)
}

function loadPublicProjectExample(example: PublicProjectExample): void {
  setWorkspace(workspaceFromExample(example))
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
      sourceUrl: undefined,
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

async function importProjectFolder(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const files = input.files

  if (!files?.length) return

  importStatus.value = "loading"
  importMessage.value = `Reading ${files.length} selected path${files.length === 1 ? "" : "s"} locally…`
  await nextFrame()

  try {
    const graph = createProjectGraphFromFiles(files)
    const folderName = graph.nodes[0]?.label ?? "Selected project"
    const selectedId = graph.nodes[0]?.id
    const message = `Mapped ${directChildCount(graph, selectedId)} first-layer items from ${folderName}; file contents stayed local.`

    setWorkspace({
      graph,
      title: folderName,
      subtitle: "Filename-only project map. This MVP shows the selected folder's direct children only.",
      sourceName: folderName,
      sourceUrl: undefined,
      selectedNodeId: selectedId,
      message,
    })
  } catch {
    importStatus.value = "error"
    importMessage.value = "Dimension could not map that folder."
  } finally {
    input.value = ""
  }
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
  selectedSourceUrl.value = workspace.sourceUrl
  selectedNodeId.value = workspace.selectedNodeId
  importStatus.value = "success"
  selectedExampleId.value = workspace.exampleId
  importMessage.value = persistWorkspace(workspace)
    ? workspace.message
    : `${workspace.message} This graph is loaded, but browser storage refused to save it for refresh.`
  replaceUrlState(workspace)
  syncDocumentTitle(workspace.title)
}

function persistCurrentWorkspace(): void {
  if (!sourceGraph.value) return

  persistWorkspace({
    graph: sourceGraph.value,
    title: diagramTitle.value,
    subtitle: diagramSubtitle.value,
    sourceName: selectedSourceName.value,
    sourceUrl: selectedSourceUrl.value,
    selectedNodeId: selectedNodeId.value,
    message: importMessage.value,
    exampleId: selectedExampleId.value,
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

async function nextFrame(): Promise<void> {
  await nextTick()
  await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
}

function readPersistedWorkspace(): PersistedWorkspace | undefined {
  try {
    const value = localStorage.getItem(workspaceStorageKey)

    return value ? (JSON.parse(value) as PersistedWorkspace) : undefined
  } catch {
    return undefined
  }
}

function persistWorkspace(workspace: PersistedWorkspace): boolean {
  try {
    localStorage.setItem(workspaceStorageKey, JSON.stringify(workspace))
    return true
  } catch {
    return false
  }
}

function clearPersistedWorkspace(): void {
  try {
    localStorage.removeItem(workspaceStorageKey)
  } catch {
    // Best effort only. The built-in sample is still loaded.
  }
}

function readExampleFromUrl(): PublicProjectExample | undefined {
  const exampleId = new URLSearchParams(window.location.search).get("example")

  return publicProjectExamples.find((example) => example.id === exampleId)
}

function workspaceFromExample(example: PublicProjectExample, storedWorkspace?: PersistedWorkspace): PersistedWorkspace {
  const defaultSelectedId = firstLayerNodeId(example.graph) ?? example.graph.nodes[0]?.id
  const selectedId = storedWorkspace?.exampleId === example.id ? storedWorkspace.selectedNodeId ?? defaultSelectedId : defaultSelectedId

  return {
    graph: example.graph,
    title: example.title,
    subtitle: example.subtitle,
    sourceName: example.sourceName,
    sourceUrl: example.sourceUrl,
    selectedNodeId: selectedId,
    message: `Loaded ${example.graph.nodes.length} code parts and ${example.graph.links.length} links from public ${example.label}.`,
    exampleId: example.id,
  }
}

function replaceUrlState(workspace?: PersistedWorkspace): void {
  const url = new URL(window.location.href)

  url.search = workspace?.exampleId ? `?example=${encodeURIComponent(workspace.exampleId)}` : ""
  window.history.replaceState(null, "", url)
}

function syncDocumentTitle(workspaceTitle: string): void {
  document.title = workspaceTitle === builtInSourceName ? defaultPageTitle : `${workspaceTitle} · Dimension`
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
        <div class="source-import__examples" aria-label="Public project examples">
          <span>Public examples</span>
          <button
            v-for="example in publicProjectExamples"
            :key="example.id"
            type="button"
            :disabled="isImporting"
            @click="loadPublicProjectExample(example)"
          >
            {{ example.label }}
          </button>
        </div>
        <p class="source-import__status" :class="`source-import__status--${importStatus}`" aria-live="polite">
          {{ importMessage }}
        </p>
      </form>
      <dl class="framework-grid" aria-label="Current source graph">
        <div>
          <dt>Source</dt>
          <dd>
            <a v-if="selectedSourceUrl" :href="selectedSourceUrl" target="_blank" rel="noreferrer">
              {{ selectedSourceName }}
            </a>
            <template v-else>{{ selectedSourceName }}</template>
          </dd>
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
