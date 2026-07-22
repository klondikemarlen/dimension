import type { SourceGraph } from "../types/source-graph.ts"

const serverApplicationOrigin = import.meta.env?.VITE_SERVER_APPLICATION_ORIGIN?.replace(/\/$/, "") ?? ""

type SourceGraphImportResponse = {
  graph?: SourceGraph
  message?: string
}

export async function createGraphFromSourceFile(sourceFile: File): Promise<SourceGraph> {
  const formData = new FormData()
  formData.append("file", sourceFile, sourceFile.name)

  const response = await fetch(`${serverApplicationOrigin}/graphs/source`, {
    method: "POST",
    body: formData,
  })
  const responseBody = await readSourceGraphImportResponse(response)

  if (!response.ok) {
    throw new Error(responseBody.message ?? `The source importer rejected ${sourceFile.name}.`)
  }

  if (!responseBody.graph) {
    throw new Error("The source importer did not return a graph.")
  }

  return responseBody.graph
}

async function readSourceGraphImportResponse(response: Response): Promise<SourceGraphImportResponse> {
  try {
    return (await response.json()) as SourceGraphImportResponse
  } catch {
    return {
      message: response.ok ? undefined : "The source importer returned an unreadable response.",
    }
  }
}
