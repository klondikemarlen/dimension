import { createGraphFromProjectImport } from "./graph-import-service.ts"
import type { FolderSelection, FolderSelectionProgress } from "./project-folder-selection-service.ts"
import { planProjectImport, type ProjectImportPlan } from "./project-folder-service.ts"
import type { SourceGraph } from "../types/source-graph.ts"

export type ProjectImportPhase =
  | { kind: "selecting" }
  | { kind: "reading"; rootName: string; fileCount: number }
  | { kind: "planning"; rootName: string; selectedPathCount: number }
  | {
      kind: "requesting"
      rootName: string
      pathCount: number
      parseableCount: number
      skippedCount: number
    }

type ProjectImportResult =
  | { kind: "success"; rootName: string; graph: SourceGraph; plan: ProjectImportPlan }
  | { kind: "canceled" }
  | { kind: "unsupported" }
  | { kind: "failed"; message: string }

type FolderSelector = (onProgress: FolderSelectionProgress) => Promise<FolderSelection>
type PhaseReporter = (phase: ProjectImportPhase) => void | Promise<void>
type GraphCreator = (rootName: string, plan: ProjectImportPlan) => Promise<SourceGraph>

export async function runProjectImport(
  selectFolder: FolderSelector,
  report: PhaseReporter,
  createGraph: GraphCreator = createGraphFromProjectImport,
): Promise<ProjectImportResult> {
  const selectionPromise = selectFolder((rootName, fileCount) => {
    if (fileCount !== 0 && fileCount !== 1 && fileCount % 100 !== 0) return

    return report({ kind: "reading", rootName, fileCount })
  })
  await report({ kind: "selecting" })

  const selection = await selectionPromise

  if (selection.kind !== "selected") return selection

  if (!selection.files.length) {
    return { kind: "failed", message: `Dimension found no files in ${selection.rootName}.` }
  }

  try {
    await report({ kind: "reading", rootName: selection.rootName, fileCount: selection.files.length })
    await report({ kind: "planning", rootName: selection.rootName, selectedPathCount: selection.files.length })
    const plan = planProjectImport(selection.files)
    await report({
      kind: "requesting",
      rootName: selection.rootName,
      pathCount: plan.files.length,
      parseableCount: plan.parseableCount,
      skippedCount: plan.skippedCount,
    })

    return {
      kind: "success",
      rootName: selection.rootName,
      plan,
      graph: await createGraph(selection.rootName, plan),
    }
  } catch (error) {
    return {
      kind: "failed",
      message: error instanceof Error ? error.message : `Dimension could not map ${selection.rootName}.`,
    }
  }
}
