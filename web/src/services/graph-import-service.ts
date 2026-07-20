import type { SourceGraph } from "@/types/source-graph"

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

async function readGraphImportResponse(response: Response): Promise<GraphImportResponse> {
  try {
    return (await response.json()) as GraphImportResponse
  } catch {
    return {
      message: response.ok ? undefined : "The source importer returned an unreadable response.",
    }
  }
}
