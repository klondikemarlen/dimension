import type { SourceGraph } from "@/types/source-graph"
import type { ProjectImportPlan } from "@/services/project-folder-service"

const serverApplicationOrigin = import.meta.env.VITE_SERVER_APPLICATION_ORIGIN?.replace(/\/$/, "") ?? ""

interface GraphImportResponse {
  graph?: SourceGraph
  message?: string
}

export async function createGraphFromProjectImport(rootName: string, plan: ProjectImportPlan): Promise<SourceGraph> {
  const paths = plan.files.map((projectFile) => projectFile.path)
  const parseableFiles = plan.parseableFiles
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

async function readGraphImportResponse(response: Response): Promise<GraphImportResponse> {
  try {
    return (await response.json()) as GraphImportResponse
  } catch {
    return {
      message: response.ok ? undefined : "The source importer returned an unreadable response.",
    }
  }
}
