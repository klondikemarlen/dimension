import assert from "node:assert/strict"

import {
  createProjectPreviewGraphFromFiles,
  planProjectImport,
  projectFilesFromInput,
  projectNameForFiles,
  type LocalProjectFile,
} from "../project-folder-service.ts"

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
