import type { SourceGraph } from "../types/source-graph"

export interface LocalProjectFile {
  file: File
  path: string
}

export interface ProjectPreviewEntry {
  name: string
  type: "file" | "folder"
}

const PARSEABLE_EXTENSIONS = new Set([".js", ".jsx", ".rb", ".ts", ".tsx"])
const GENERATED_PATH_SEGMENTS = new Set([".git", ".vite", "coverage", "dist", "node_modules"])
const MAX_PROJECT_PATHS = 15000
const MAX_PARSEABLE_FILES = 500
const MAX_PARSEABLE_FILE_BYTES = 512 * 1024

export interface ProjectImportPlan {
  files: LocalProjectFile[]
  parseableFiles: LocalProjectFile[]
  skippedCount: number
  parseableCount: number
}

export function planProjectImport(projectFiles: LocalProjectFile[]): ProjectImportPlan {
  const files = projectFiles.filter((projectFile) => !isGeneratedPath(projectFile.path))
  const parseableFiles = files.filter(isParseableProjectFile)

  if (files.length > MAX_PROJECT_PATHS) {
    throw new Error(`Dimension can map up to ${MAX_PROJECT_PATHS} project paths at once; ${files.length} were selected.`)
  }

  if (parseableFiles.length > MAX_PARSEABLE_FILES) {
    throw new Error(
      `Dimension can parse up to ${MAX_PARSEABLE_FILES} source files at once; ${parseableFiles.length} were selected after generated folders were skipped.`,
    )
  }

  return {
    files,
    parseableFiles,
    skippedCount: projectFiles.length - files.length,
    parseableCount: parseableFiles.length,
  }
}

export function projectFilesFromInput(files: FileList): LocalProjectFile[] {
  return Array.from(files).map((file) => {
    const relativePath = file.webkitRelativePath || file.name
    const parts = relativePath.split("/").filter(Boolean)

    return {
      file,
      path: parts.slice(1).join("/") || parts[0] || file.name,
    }
  })
}

export function projectNameForFiles(files: FileList): string {
  const relativePath = files[0]?.webkitRelativePath
  const rootName = relativePath?.split("/").filter(Boolean)[0]

  return rootName || "Selected project"
}

export function createProjectPreviewGraphFromFiles(rootName: string, projectFiles: LocalProjectFile[]): SourceGraph {
  const entries = new Map<string, ProjectPreviewEntry>()

  projectFiles.forEach((projectFile) => {
    const [firstSegment, secondSegment] = projectFile.path.split("/").filter(Boolean)

    if (!firstSegment) return

    entries.set(firstSegment, {
      name: firstSegment,
      type: secondSegment ? "folder" : "file",
    })
  })

  return createProjectPreviewGraph(rootName, entries.values())
}

export function createProjectPreviewGraph(rootName: string, entries: Iterable<ProjectPreviewEntry>): SourceGraph {
  const safeRootName = rootName.trim() || "Selected project"
  const rootId = `folder:${safeRootName}`
  const graph: SourceGraph = {
    nodes: [{ id: rootId, label: safeRootName, type: "folder" }],
    links: [],
  }

  for (const entry of entries) {
    const id = `${entry.type}:${safeRootName}/${entry.name}`

    graph.nodes.push({ id, label: entry.name, type: entry.type })
    graph.links.push({ source: rootId, target: id })
  }

  return graph
}

function isParseableProjectFile(projectFile: LocalProjectFile): boolean {
  return PARSEABLE_EXTENSIONS.has(extensionFor(projectFile.path)) && projectFile.file.size <= MAX_PARSEABLE_FILE_BYTES
}

function isGeneratedPath(path: string): boolean {
  return path.split(/[\\/]+/).some((part) => GENERATED_PATH_SEGMENTS.has(part))
}

function extensionFor(path: string): string {
  const match = /\.[^.\\/]+$/.exec(path)

  return match?.[0] ?? ""
}
