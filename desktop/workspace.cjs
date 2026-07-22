const { createHash } = require("node:crypto")
const { mkdir, readFile, readdir, writeFile } = require("node:fs/promises")
const { basename, join, relative } = require("node:path")

const GENERATED_DIRECTORIES = new Set([".git", ".vite", "coverage", "dist", "node_modules"])
const MAX_PROJECT_PATHS = 15_000

async function openWorkspace({ dialog, userDataPath }) {
  const selection = await dialog.showOpenDialog({
    title: "Open Dimension workspace",
    properties: ["openDirectory"],
  })

  if (selection.canceled || !selection.filePaths[0]) return { kind: "canceled" }

  const rootPath = selection.filePaths[0]
  const name = workspaceName(rootPath)
  const graph = await createWorkspaceGraph(rootPath, name)
  const workspace = {
    id: createHash("sha256").update(rootPath).digest("hex"),
    name,
    graph,
  }

  await persistWorkspaceMetadata(userDataPath, { id: workspace.id, name, rootPath })

  return { kind: "selected", workspace }
}

function workspaceName(rootPath) {
  return basename(rootPath) || rootPath
}

async function createWorkspaceGraph(rootPath, rootName) {
  const nodes = []
  const links = []
  const rootId = `folder:${rootName}`

  nodes.push({ id: rootId, label: rootName, type: "folder" })

  try {
    await visitDirectory(rootPath, rootPath, rootId, rootName, nodes, links)
  } catch (error) {
    throw new Error(`Dimension could not read ${rootName}: ${error.message}`)
  }

  return { nodes, links }
}

async function visitDirectory(rootPath, directoryPath, parentId, rootName, nodes, links) {
  const entries = await readdir(directoryPath, { withFileTypes: true })

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isDirectory() && GENERATED_DIRECTORIES.has(entry.name)) continue
    if (nodes.length >= MAX_PROJECT_PATHS) throw new Error(`more than ${MAX_PROJECT_PATHS} paths were selected`)

    const path = relative(rootPath, join(directoryPath, entry.name)).split("\\").join("/")
    const type = entry.isDirectory() ? "folder" : "file"
    const id = `${type}:${rootName}/${path}`

    nodes.push({ id, label: entry.name, type })
    links.push({ source: parentId, target: id })

    if (entry.isDirectory()) await visitDirectory(rootPath, join(directoryPath, entry.name), id, rootName, nodes, links)
  }
}

async function persistWorkspaceMetadata(userDataPath, workspace) {
  const metadataPath = join(userDataPath, "workspaces.json")
  await mkdir(userDataPath, { recursive: true })

  let workspaces = []
  try {
    workspaces = JSON.parse(await readFile(metadataPath, "utf8"))
  } catch (error) {
    if (error.code !== "ENOENT") throw error
  }

  const savedWorkspaces = workspaces.filter(({ id }) => id !== workspace.id)
  savedWorkspaces.push(workspace)
  await writeFile(metadataPath, JSON.stringify(savedWorkspaces, null, 2))
}

module.exports = { createWorkspaceGraph, openWorkspace, workspaceName }
