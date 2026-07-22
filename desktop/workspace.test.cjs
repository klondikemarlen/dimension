const assert = require("node:assert/strict")
const { mkdtemp, mkdir, readFile, writeFile } = require("node:fs/promises")
const { tmpdir } = require("node:os")
const { join } = require("node:path")
const test = require("node:test")

const { createWorkspaceGraph, openWorkspace, workspaceName } = require("./workspace.cjs")

test("creates a native project graph and persists metadata outside the root", async () => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "dimension-workspace-"))
  const projectRoot = join(temporaryDirectory, "project")
  const userDataPath = join(temporaryDirectory, "dimension-data")
  await mkdir(join(projectRoot, "src"), { recursive: true })
  await mkdir(join(projectRoot, "node_modules"), { recursive: true })
  await writeFile(join(projectRoot, "src", "app.ts"), "export const app = true\n")
  await writeFile(join(projectRoot, "node_modules", "ignored.js"), "")

  const result = await openWorkspace({
    dialog: { showOpenDialog: async () => ({ canceled: false, filePaths: [projectRoot] }) },
    userDataPath,
  })

  assert.equal(result.kind, "selected")
  assert.equal(result.workspace.name, "project")
  assert.deepEqual(result.workspace.graph.nodes.map(({ id }) => id), [
    "folder:project",
    "folder:project/src",
    "file:project/src/app.ts",
  ])
  assert.match(await readFile(join(userDataPath, "workspaces.json"), "utf8"), /"rootPath"/)
})

test("reports native picker cancellation without reading a project", async () => {
  const result = await openWorkspace({
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
    userDataPath: tmpdir(),
  })

  assert.deepEqual(result, { kind: "canceled" })
})

test("reports inaccessible native roots", async () => {
  await assert.rejects(
    createWorkspaceGraph(join(tmpdir(), "dimension-missing-root"), "missing-root"),
    /Dimension could not read missing-root/,
  )
})

test("uses the selected root when it has no basename", () => {
  assert.equal(workspaceName("/"), "/")
})
