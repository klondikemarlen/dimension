import type { SourceGraph } from "@/types/source-graph"

export interface LocalProjectFile {
  file: File
  path: string
}

const PARSEABLE_EXTENSIONS = new Set([".js", ".jsx", ".rb", ".ts", ".tsx"])
const GENERATED_PATH_SEGMENTS = new Set([".git", ".vite", "coverage", "dist", "node_modules"])
const MAX_PROJECT_PATHS = 15000
const MAX_PARSEABLE_FILES = 500
const MAX_PARSEABLE_FILE_BYTES = 512 * 1024

export interface ProjectImportPlan {
  files: LocalProjectFile[]
  skippedCount: number
  parseableCount: number
}


const serverApplicationOrigin = import.meta.env.VITE_SERVER_APPLICATION_ORIGIN?.replace(/\/$/, "") ?? ""

interface GraphImportResponse {
  graph?: SourceGraph
  message?: string
}

export async function createGraphFromSourceFile(file: File): Promise<SourceGraph> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch(`${serverApplicationOrigin}/graphs`, {
    method: "POST",
    body: formData,
  })

  const responseBody = await readGraphImportResponse(response)

  if (!response.ok) {
    throw new Error(responseBody.message ?? `The source importer rejected ${file.name}.`)
  }

  if (!responseBody.graph) {
    throw new Error("The source importer did not return a graph.")
  }

  return responseBody.graph
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
    skippedCount: projectFiles.length - files.length,
    parseableCount: parseableFiles.length,
  }
}

export async function createGraphFromProjectFiles(rootName: string, projectFiles: LocalProjectFile[]): Promise<SourceGraph> {
  const plan = planProjectImport(projectFiles)
  const paths = plan.files.map((projectFile) => projectFile.path)
  const parseableFiles = plan.files.filter(isParseableProjectFile)
  const formData = new FormData()
  formData.append("rootName", rootName)
  formData.append("paths", JSON.stringify(paths))
  formData.append("parsePaths", JSON.stringify(parseableFiles.map((projectFile) => projectFile.path)))
  parseableFiles.forEach((projectFile) => formData.append("files", projectFile.file, projectFile.file.name))

  const response = await fetch(`${serverApplicationOrigin}/graphs/project`, {
    method: "POST",
    body: formData,
  })

  const responseBody = await readGraphImportResponse(response)

  if (!response.ok) {
    throw new Error(responseBody.message ?? `The project importer rejected ${rootName}.`)
  }

  if (!responseBody.graph) {
    throw new Error("The project importer did not return a graph.")
  }

  return responseBody.graph
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

async function readGraphImportResponse(response: Response): Promise<GraphImportResponse> {
  try {
    return (await response.json()) as GraphImportResponse
  } catch {
    return {
      message: response.ok ? undefined : "The source importer returned an unreadable response.",
    }
  }
}
