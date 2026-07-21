<script setup lang="ts">
import { computed, nextTick, ref } from "vue"

import SpellCanvas from "@/components/SpellCanvas.vue"
import { usersControllerIndexDiagram } from "@/fixtures/usersControllerIndex"
import { publicProjectExamples, type PublicProjectExample } from "@/fixtures/publicProjectExamples"
import { createGraphFromProjectFiles } from "@/services/graph-import-service"
import {
  nativeDirectoryPicker,
  openFolderInput,
  selectNativeDirectory,
  selectionFromFolderInput,
  type FolderSelection,
} from "@/services/project-folder-selection-service"
import {
  createProjectPreviewGraphFromFiles,
  planProjectImport,
  type LocalProjectFile,
} from "@/services/project-folder-service"
import { createSpellDiagramFromSourceGraph } from "@/services/spell-diagram-adapter"
import type { SourceGraph } from "@/types/source-graph"
import type { RuneNode, SpellDiagram } from "@/types/spell-diagram"

const builtInSourceName = "Built-in controller fixture"
const defaultImportMessage = "Choose a source file for layered code review, or open a local folder for a project map."
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
const projectFolderInput = ref<HTMLInputElement>()
const graphNodeCount = computed(() => sourceGraph.value?.nodes.length ?? usersControllerIndexDiagram.nodes.length)
const graphLinkCount = computed(() => sourceGraph.value?.links.length ?? usersControllerIndexDiagram.edges.length)
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

  const rootName = "Selected source"
  const sourceName = sourceFile.name
  const projectFiles: LocalProjectFile[] = [{ file: sourceFile, path: sourceFile.name }]

  try {
    showLocalProjectPreview(rootName, createProjectPreviewGraphFromFiles(rootName, projectFiles), sourceName)
    importMessage.value = `Data-mining ${sourceName}; parsing 1 supported code file…`
    await nextFrame()

    await importProjectFiles(rootName, projectFiles, sourceName)
  } catch (error) {
    importStatus.value = "error"
    importMessage.value = error instanceof Error ? error.message : "Dimension could not map that source file."
  } finally {
    input.value = ""
  }
}

async function openProjectFolderPicker(): Promise<void> {
  if (isImporting.value) return

  const picker = nativeDirectoryPicker(window)

  if (picker) {
    importStatus.value = "loading"
    importMessage.value = "Choose a local folder in your browser dialog to map the project."
    await importFolderSelection(
      await selectNativeDirectory(picker, async (rootName, fileCount) => {
        importMessage.value = fileCount
          ? `Reading ${rootName}; found ${fileCount} file${fileCount === 1 ? "" : "s"}…`
          : `Reading ${rootName}; scanning selected files…`
        await nextFrame()
      }),
    )
    return
  }

  openBrowserFolderPicker()
}

function openBrowserFolderPicker(): void {
  const input = projectFolderInput.value

  if (!input) {
    void importFolderSelection({ kind: "unsupported" })
    return
  }

  importStatus.value = "loading"
  importMessage.value = "Choose a folder, then select Upload in your browser dialog. The browser calls this an upload because Dimension reads its files to map the project."
  openFolderInput(input)
}

async function handleProjectFolderInput(): Promise<void> {
  const input = projectFolderInput.value

  if (!input) return

  const selection = selectionFromFolderInput(input.files)
  input.value = ""
  await importFolderSelection(selection)
}

function handleProjectFolderInputCancel(): void {
  void importFolderSelection({ kind: "canceled" })
}

async function importFolderSelection(selection: FolderSelection): Promise<void> {
  if (selection.kind === "canceled") {
    reportFolderSelectionCanceled()
    return
  }

  if (selection.kind === "unsupported") {
    importStatus.value = "error"
    importMessage.value = "This browser cannot select local folders."
    return
  }

  if (selection.kind === "failed") {
    importStatus.value = "error"
    importMessage.value = selection.message
    return
  }

  if (!selection.files.length) {
    importStatus.value = "error"
    importMessage.value = `Dimension found no files in ${selection.rootName}.`
    return
  }

  importStatus.value = "loading"
  importMessage.value = `Reading ${selection.rootName}; ${selection.files.length} file${selection.files.length === 1 ? "" : "s"} attached by your browser…`
  await nextFrame()

  await importLocalProject(selection.rootName, selection.files)
}

async function importLocalProject(rootName: string, projectFiles: LocalProjectFile[]): Promise<void> {
  showLocalProjectPreview(rootName, createProjectPreviewGraphFromFiles(rootName, projectFiles))
  importMessage.value = `Data-mining ${rootName}; generated folders are skipped before supported code files are parsed…`
  await nextFrame()

  await importProjectFiles(rootName, projectFiles)
}

function reportFolderSelectionCanceled(): void {
  importStatus.value = "error"
  importMessage.value = "Folder selection was canceled. No files were attached."
}

async function importProjectFiles(rootName: string, projectFiles: LocalProjectFile[], sourceName = rootName): Promise<void> {
  try {
    importStatus.value = "loading"
    importMessage.value = `Preparing ${projectFiles.length} selected local path${projectFiles.length === 1 ? "" : "s"}…`
    await nextFrame()

    const plan = planProjectImport(projectFiles)
    importMessage.value = `Data-mining ${sourceName}; scanning ${plan.files.length} local path${plan.files.length === 1 ? "" : "s"}, parsing ${plan.parseableCount} supported code file${plan.parseableCount === 1 ? "" : "s"}${plan.skippedCount ? `, and skipping ${plan.skippedCount} generated path${plan.skippedCount === 1 ? "" : "s"}` : ""}…`
    await nextFrame()

    const graph = await createGraphFromProjectFiles(rootName, plan.files)
    const selectedId = graph.nodes[0]?.id
    const message = `Mapped ${directChildCount(graph, selectedId)} first-layer item${directChildCount(graph, selectedId) === 1 ? "" : "s"} from ${sourceName}; ${plan.files.length} local path${plan.files.length === 1 ? "" : "s"} attached, with folder/file nodes kept and supported code files parsed.`

    setWorkspace({
      graph,
      title: sourceName,
      subtitle: "Source map with file/folder hierarchy and parsed TypeScript, JavaScript, and Ruby code beneath files.",
      sourceName,
      sourceUrl: undefined,
      selectedNodeId: selectedId,
      message,
    })
  } catch (error) {
    importStatus.value = "error"
    importMessage.value = error instanceof Error ? error.message : `Dimension could not map ${sourceName}.`
  }
}

function showLocalProjectPreview(rootName: string, graph: SourceGraph, sourceName = rootName): void {
  const selectedId = graph.nodes[0]?.id
  const message = `Listed ${directChildCount(graph, selectedId)} top-level item${directChildCount(graph, selectedId) === 1 ? "" : "s"} from ${sourceName}; data-mining supported code files…`

  sourceGraph.value = graph
  diagramTitle.value = sourceName
  diagramSubtitle.value = "Source map with top-level files and folders while Dimension data-mines code relationships."
  selectedSourceName.value = sourceName
  selectedSourceUrl.value = undefined
  selectedNodeId.value = selectedId
  selectedExampleId.value = undefined
  replaceUrlState()
  syncDocumentTitle(sourceName)
  importStatus.value = "loading"
  importMessage.value = message
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
      <p class="eyebrow">Current workspace</p>
      <h1 id="dimension-title">{{ selectedSourceName }}</h1>
      <p class="hero-copy">{{ diagramSubtitle }}</p>
      <form class="source-import" aria-label="Open another source file or local project">
        <p class="source-import__status" :class="`source-import__status--${importStatus}`" aria-live="polite">
          {{ importMessage }}
        </p>
        <label class="source-import__field" :class="{ 'source-import__field--disabled': isImporting }">
          <span>Source file</span>
          <span class="source-import__control">
            <span class="source-import__button">Browse source file</span>
            <span class="source-import__hint">JS, TS, or Ruby</span>
          </span>
          <input
            class="source-import__hidden-input"
            type="file"
            accept=".js,.jsx,.ts,.tsx,.rb,text/javascript,text/typescript,text/x-ruby"
            :disabled="isImporting"
            @change="importSourceFile"
          />
        </label>
        <div class="source-import__field" :class="{ 'source-import__field--disabled': isImporting }">
          <span>Open another project</span>
          <button type="button" :disabled="isImporting" @click="openProjectFolderPicker">Open local folder</button>
          <input
            ref="projectFolderInput"
            hidden
            class="source-import__hidden-input"
            type="file"
            webkitdirectory
            multiple
            @cancel="handleProjectFolderInputCancel"
            @change="handleProjectFolderInput"
          />
        </div>
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
          <dt>Nodes</dt>
          <dd>{{ graphNodeCount }}</dd>
        </div>
        <div>
          <dt>Links</dt>
          <dd>{{ graphLinkCount }}</dd>
        </div>
      </dl>
    </section>

    <section class="inspection-pane" aria-label="Dimension graph inspection">
      <SpellCanvas :diagram="currentDiagram" @select-node="selectNode" />
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
  </main>
</template>
