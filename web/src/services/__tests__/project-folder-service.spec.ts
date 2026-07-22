import assert from "node:assert/strict"

import {
  createProjectPreviewGraphFromFiles,
  planProjectImport,
  projectFilesFromInput,
  projectFilesFromDirectory,
  projectNameForFiles,
  type LocalProjectFile,
} from "../project-folder-service.ts"
import { selectNativeDirectory, selectionFromFolderInput } from "../project-folder-selection-service.ts"
import { runProjectImport } from "../project-import-workflow-service.ts"

function projectFile(path: string, size = 1): File {
  const parts = path.split("/")
  const name = parts[parts.length - 1] ?? path
  const file = new File(["x".repeat(size)], name, { type: "text/typescript" })

  Object.defineProperty(file, "webkitRelativePath", { value: path })

  return file
}

function fileList(paths: string[]): FileList {
  const files = paths.map((path) => projectFile(path))

  Object.defineProperty(files, "item", { value: (index: number) => files[index] })

  return files as unknown as FileList
}

const selectedFiles = fileList([
  "dimension-folder-input-qa/README.md",
  "dimension-folder-input-qa/src/app.ts",
  "dimension-folder-input-qa/node_modules/pkg/ignored.ts",
])

assert.equal(projectNameForFiles(selectedFiles), "dimension-folder-input-qa")

const projectFiles = projectFilesFromInput(selectedFiles)
assert.deepEqual(
  projectFiles.map((file) => file.path),
  ["README.md", "src/app.ts", "node_modules/pkg/ignored.ts"],
)

const previewGraph = createProjectPreviewGraphFromFiles("dimension-folder-input-qa", projectFiles)
assert.deepEqual(
  previewGraph.nodes.map((node) => `${node.type}:${node.label}`),
  ["folder:dimension-folder-input-qa", "file:README.md", "folder:src", "folder:node_modules"],
)
assert.deepEqual(
  previewGraph.links.map((link) => link.target),
  [
    "file:dimension-folder-input-qa/README.md",
    "folder:dimension-folder-input-qa/src",
    "folder:dimension-folder-input-qa/node_modules",
  ],
)

const importPlan = planProjectImport(projectFiles as LocalProjectFile[])
assert.deepEqual(
  importPlan.files.map((file) => file.path),
  ["README.md", "src/app.ts"],
)
assert.equal(importPlan.skippedCount, 1)
assert.equal(importPlan.parseableCount, 1)

const selectedDirectory = {
  name: "dimension-directory-picker-qa",
  kind: "directory" as const,
  async *entries() {
    yield [
      "src",
      {
        name: "src",
        kind: "directory" as const,
        async *entries() {
          yield ["app.ts", { kind: "file" as const, getFile: async () => projectFile("app.ts") }]
        },
      },
    ] as const
    yield [
      "node_modules",
      {
        name: "node_modules",
        kind: "directory" as const,
        async *entries() {
          throw new Error("Generated directories must not be traversed.")
        },
      },
    ] as const
  },
}

const directoryProgress: number[] = []
const directoryFiles = await projectFilesFromDirectory(selectedDirectory, (fileCount) => directoryProgress.push(fileCount))
assert.deepEqual(directoryProgress, [1])
assert.deepEqual(directoryFiles.map((file) => file.path), ["src/app.ts"])

const nativeSelection = await selectNativeDirectory(async () => selectedDirectory)
assert.equal(nativeSelection.kind, "selected")
if (nativeSelection.kind === "selected") {
  assert.equal(nativeSelection.rootName, "dimension-directory-picker-qa")
  assert.deepEqual(nativeSelection.files.map((file) => file.path), ["src/app.ts"])
}
assert.deepEqual(await selectNativeDirectory(async () => Promise.reject(new DOMException("Canceled", "AbortError"))), {
  kind: "canceled",
})
assert.deepEqual(selectionFromFolderInput(null), { kind: "canceled" })

const workflowPhases: string[] = []
let requestedPathCount = 0
const workflowResult = await runProjectImport(
  async () => ({ kind: "selected", rootName: "workflow-project", files: directoryFiles }),
  async (phase) => workflowPhases.push(phase.kind),
  async (_rootName, plan) => {
    requestedPathCount = plan.files.length
    return { nodes: [{ id: "folder:workflow-project", label: "workflow-project", type: "folder" }], links: [] }
  },
)
assert.equal(workflowResult.kind, "success")
if (workflowResult.kind === "success") {
  assert.equal(workflowResult.plan.files.length, requestedPathCount)
  assert.equal(workflowResult.graph.nodes[0]?.label, "workflow-project")
}
assert.deepEqual(workflowPhases, ["selecting", "reading", "planning", "requesting"])

const canceledWorkflow = await runProjectImport(
  async () => ({ kind: "canceled" }),
  async () => undefined,
  async () => ({ nodes: [], links: [] }),
)
assert.deepEqual(canceledWorkflow, { kind: "canceled" })

const failedWorkflow = await runProjectImport(
  async () => ({ kind: "failed", message: "Picker failed" }),
  async () => undefined,
  async () => ({ nodes: [], links: [] }),
)
assert.deepEqual(failedWorkflow, { kind: "failed", message: "Picker failed" })

const singleSourceGraph = createProjectPreviewGraphFromFiles("Selected source", [
  { file: projectFile("app.ts"), path: "app.ts" },
])
assert.deepEqual(
  singleSourceGraph.nodes.map((node) => `${node.type}:${node.label}`),
  ["folder:Selected source", "file:app.ts"],
)
