const assert = require("node:assert/strict")
const { mkdir, mkdtemp, readFile, rm, symlink, writeFile } = require("node:fs/promises")
const { tmpdir } = require("node:os")
const { join } = require("node:path")
const test = require("node:test")

const { createWorkspaceGraph, openWorkspace, workspaceName } = require("./workspace.cjs")

test("creates a native project graph and persists metadata outside the root", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "dimension-workspace-"))
  t.after(() => rm(temporaryDirectory, { force: true, recursive: true }))
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

test("adds local import links without changing folder containment", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "dimension-workspace-imports-"))
  t.after(() => rm(temporaryDirectory, { force: true, recursive: true }))
  const projectRoot = join(temporaryDirectory, "project")

  await mkdir(join(projectRoot, "src", "formatters"), { recursive: true })
  await writeFile(
    join(projectRoot, "src", "app.ts"),
    '// import { ignored } from "./ignored"\n/* require("./ignored") */\nconst pattern = /import(".\\/ignored")/\nfunction matches() { return /import(".\\/ignored")/ }\nimport {\n  format,\n} from "./formatters"\nimport { release } from "./release.test"\n',
  )
  await writeFile(join(projectRoot, "src", "formatters", "index.ts"), "export const format = () => true\n")
  await writeFile(join(projectRoot, "src", "ignored.ts"), "export const ignored = true\n")
  await writeFile(join(projectRoot, "src", "release.test.ts"), "export const release = true\n")

  const graph = await createWorkspaceGraph(projectRoot, "project")

  assert.deepEqual(
    graph.links.filter((link) => link.kind === "imports"),
    [
      {
        source: "file:project/src/app.ts",
        target: "file:project/src/formatters/index.ts",
        kind: "imports",
      },
      {
        source: "file:project/src/app.ts",
        target: "file:project/src/release.test.ts",
        kind: "imports",
      },
    ],
  )
  assert.ok(graph.links.some((link) => link.kind === "contains" && link.target === "folder:project/src"))
})

test("keeps symlinks in the containment map without scanning their target", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "dimension-workspace-symlink-"))
  t.after(() => rm(temporaryDirectory, { force: true, recursive: true }))
  const projectRoot = join(temporaryDirectory, "project")
  const outsideSource = join(temporaryDirectory, "outside.ts")

  await mkdir(join(projectRoot, "src"), { recursive: true })
  await writeFile(join(projectRoot, "src", "inside.ts"), "export const inside = true\n")
  await writeFile(outsideSource, 'import { inside } from "./inside"\n')
  await symlink(outsideSource, join(projectRoot, "src", "linked.ts"))

  const graph = await createWorkspaceGraph(projectRoot, "project")

  assert.ok(graph.nodes.some((node) => node.id === "file:project/src/linked.ts"))
  assert.ok(graph.links.some((link) => link.kind === "contains" && link.target === "file:project/src/linked.ts"))
  assert.ok(!graph.links.some((link) => link.source === "file:project/src/linked.ts" && link.kind === "imports"))
})

test("reports native picker cancellation without reading a project", async () => {
  const result = await openWorkspace({
    dialog: { showOpenDialog: async () => ({ canceled: true, filePaths: [] }) },
    userDataPath: tmpdir(),
  })

  assert.deepEqual(result, { kind: "canceled" })
})

test("reports inaccessible native roots", async (t) => {
  const temporaryDirectory = await mkdtemp(join(tmpdir(), "dimension-missing-root-"))
  t.after(() => rm(temporaryDirectory, { force: true, recursive: true }))

  await assert.rejects(
    createWorkspaceGraph(join(temporaryDirectory, "missing-root"), "missing-root"),
    /Dimension could not read missing-root/,
  )
})

test("uses the selected root when it has no basename", () => {
  assert.equal(workspaceName("/"), "/")
})
