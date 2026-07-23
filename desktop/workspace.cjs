const { createHash } = require("node:crypto")
const { mkdir, readFile, readdir, writeFile } = require("node:fs/promises")
const { basename, dirname, extname, join, normalize, relative } = require("node:path")

const GENERATED_DIRECTORIES = new Set([".git", ".vite", "coverage", "dist", "node_modules"])
const IMPORTABLE_EXTENSIONS = new Set([".cjs", ".cts", ".js", ".jsx", ".mjs", ".mts", ".ts", ".tsx"])
const IMPORT_PATH_EXTENSIONS = [...IMPORTABLE_EXTENSIONS]
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
  const fileNodes = []
  const rootId = `folder:${rootName}`

  nodes.push({ id: rootId, label: rootName, type: "folder" })

  try {
    await visitDirectory(rootPath, rootPath, rootId, rootName, nodes, links, fileNodes)
    await addImportLinks(fileNodes, links)
  } catch (error) {
    throw new Error(`Dimension could not read ${rootName}: ${error.message}`)
  }

  return { nodes, links }
}

async function visitDirectory(rootPath, directoryPath, parentId, rootName, nodes, links, fileNodes) {
  const entries = await readdir(directoryPath, { withFileTypes: true })

  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    if (entry.isDirectory() && GENERATED_DIRECTORIES.has(entry.name)) continue
    if (nodes.length >= MAX_PROJECT_PATHS) throw new Error(`more than ${MAX_PROJECT_PATHS} paths were selected`)

    const path = relative(rootPath, join(directoryPath, entry.name)).split("\\").join("/")
    const type = entry.isDirectory() ? "folder" : "file"
    const id = `${type}:${rootName}/${path}`

    nodes.push({ id, label: entry.name, type })
    links.push({ source: parentId, target: id, kind: "contains" })

    if (entry.isDirectory()) {
      await visitDirectory(rootPath, join(directoryPath, entry.name), id, rootName, nodes, links, fileNodes)
    } else if (entry.isFile() && IMPORTABLE_EXTENSIONS.has(extname(entry.name))) {
      fileNodes.push({ id, path: join(directoryPath, entry.name), relativePath: path })
    }
  }
}

async function addImportLinks(fileNodes, links) {
  const nodeIdByPath = new Map(fileNodes.map((fileNode) => [fileNode.relativePath, fileNode.id]))
  const linkIds = new Set(links.map((link) => JSON.stringify([link.source, link.target, link.kind ?? "contains"])))

  for (const fileNode of fileNodes) {
    let source

    try {
      source = await readFile(fileNode.path, "utf8")
    } catch {
      continue
    }
    for (const specifier of importedSpecifiers(source)) {
      const targetId = importedFileId(fileNode.relativePath, specifier, nodeIdByPath)
      if (!targetId || targetId === fileNode.id) continue

      const linkId = JSON.stringify([fileNode.id, targetId, "imports"])
      if (linkIds.has(linkId)) continue

      links.push({ source: fileNode.id, target: targetId, kind: "imports" })
      linkIds.add(linkId)
    }
  }
}

function importedSpecifiers(source) {
  const specifiers = []

  for (let index = 0; index < source.length; ) {
    const character = source[index]

    if (character === "/" && (source[index + 1] === "/" || source[index + 1] === "*")) {
      index = skipComment(source, index)
      continue
    }

    if (character === "'" || character === '"' || character === "`") {
      index = skipString(source, index)
      continue
    }

    if (!isIdentifierCharacter(character)) {
      index += 1
      continue
    }

    const wordEnd = identifierEnd(source, index)
    const word = source.slice(index, wordEnd)
    const match =
      word === "import"
        ? importSpecifier(source, wordEnd)
        : word === "export"
          ? fromSpecifier(source, wordEnd)
          : word === "require"
            ? requireSpecifier(source, wordEnd)
            : undefined

    if (match?.specifier.startsWith(".")) specifiers.push(match.specifier)
    index = match?.end ?? wordEnd
  }

  return specifiers
}

function importSpecifier(source, index) {
  const nextIndex = nextCodeIndex(source, index)

  if (source[nextIndex] === "(") return quotedSpecifier(source, nextCodeIndex(source, nextIndex + 1))
  if (source[nextIndex] === "'" || source[nextIndex] === '"') return quotedSpecifier(source, nextIndex)

  return fromSpecifier(source, nextIndex)
}

function requireSpecifier(source, index) {
  const nextIndex = nextCodeIndex(source, index)

  return source[nextIndex] === "(" ? quotedSpecifier(source, nextCodeIndex(source, nextIndex + 1)) : undefined
}

function fromSpecifier(source, index) {
  for (let cursor = index; cursor < source.length; ) {
    if (source[cursor] === ";") return undefined
    if (source[cursor] === "/" && (source[cursor + 1] === "/" || source[cursor + 1] === "*")) {
      cursor = skipComment(source, cursor)
      continue
    }
    if (source[cursor] === "'" || source[cursor] === '"' || source[cursor] === "`") {
      cursor = skipString(source, cursor)
      continue
    }
    if (!isIdentifierCharacter(source[cursor])) {
      cursor += 1
      continue
    }

    const wordEnd = identifierEnd(source, cursor)
    if (source.slice(cursor, wordEnd) === "from") return quotedSpecifier(source, nextCodeIndex(source, wordEnd))
    cursor = wordEnd
  }
}

function quotedSpecifier(source, index) {
  const quote = source[index]
  if (quote !== "'" && quote !== '"') return undefined

  let specifier = ""
  for (let cursor = index + 1; cursor < source.length; cursor++) {
    if (source[cursor] === "\\") {
      specifier += source[cursor + 1] ?? ""
      cursor += 1
      continue
    }
    if (source[cursor] === quote) return { specifier, end: cursor + 1 }
    specifier += source[cursor]
  }
}

function nextCodeIndex(source, index) {
  let cursor = index

  while (cursor < source.length) {
    if (/\s/.test(source[cursor])) {
      cursor += 1
      continue
    }
    if (source[cursor] === "/" && (source[cursor + 1] === "/" || source[cursor + 1] === "*")) {
      cursor = skipComment(source, cursor)
      continue
    }
    break
  }

  return cursor
}

function skipComment(source, index) {
  if (source[index + 1] === "/") {
    const newlineIndex = source.indexOf("\n", index + 2)
    return newlineIndex === -1 ? source.length : newlineIndex + 1
  }

  const commentEnd = source.indexOf("*/", index + 2)
  return commentEnd === -1 ? source.length : commentEnd + 2
}

function skipString(source, index) {
  const quote = source[index]

  for (let cursor = index + 1; cursor < source.length; cursor++) {
    if (source[cursor] === "\\") {
      cursor += 1
      continue
    }
    if (source[cursor] === quote) return cursor + 1
  }

  return source.length
}

function identifierEnd(source, index) {
  let cursor = index
  while (isIdentifierCharacter(source[cursor])) cursor += 1
  return cursor
}

function isIdentifierCharacter(character) {
  return Boolean(character) && /[A-Za-z0-9_$]/.test(character)
}

function importedFileId(sourcePath, specifier, nodeIdByPath) {
  const importPath = normalize(join(dirname(sourcePath), specifier)).split("\\").join("/")
  const importedExtension = extname(importPath)
  const importPathWithoutExtension = IMPORTABLE_EXTENSIONS.has(importedExtension)
    ? importPath.slice(0, -importedExtension.length)
    : importPath
  const candidatePaths = [
    importPath,
    ...IMPORT_PATH_EXTENSIONS.map((extension) => `${importPathWithoutExtension}${extension}`),
    ...IMPORT_PATH_EXTENSIONS.map((extension) => `${importPath}/index${extension}`),
  ]

  return candidatePaths.map((path) => nodeIdByPath.get(path)).find(Boolean)
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
