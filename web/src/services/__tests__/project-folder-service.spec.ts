import assert from "node:assert/strict"

import {
  createProjectPreviewGraphFromFiles,
  planProjectImport,
  projectFilesFromInput,
  projectFilesFromDirectory,
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

const directoryFiles = await projectFilesFromDirectory(selectedDirectory)
assert.deepEqual(directoryFiles.map((file) => file.path), ["src/app.ts"])

const singleSourceGraph = createProjectPreviewGraphFromFiles("Selected source", [
  { file: projectFile("app.ts"), path: "app.ts" },
])
assert.deepEqual(
  singleSourceGraph.nodes.map((node) => `${node.type}:${node.label}`),
  ["folder:Selected source", "file:app.ts"],
)
