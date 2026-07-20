import type { SourceGraph, SourceLink, SourceNode } from "@/types/source-graph"

const GENERATED_DIRECTORIES = new Set([".git", ".vite", "coverage", "dist", "node_modules"])

export function createProjectGraphFromFiles(fileList: FileList): SourceGraph {
  const files = Array.from(fileList)
  const nodes = new Map<string, SourceNode>()
  const links: SourceLink[] = []
  const linkIds = new Set<string>()
  const projectName = projectNameForFiles(files)
  const rootId = `folder:${projectName}`

  pushNode(nodes, {
    id: rootId,
    label: projectName,
    type: "folder",
  })

  files.forEach((file) => {
    const path = file.webkitRelativePath || file.name
    const parts = path.split("/").filter(Boolean)
    const childName = file.webkitRelativePath ? parts[1] : parts[0]

    if (!childName || GENERATED_DIRECTORIES.has(childName)) return

    const isFolder = file.webkitRelativePath ? parts.length > 2 : false
    const childType = isFolder ? "folder" : "file"
    const childId = `${childType}:${projectName}/${childName}`

    pushNode(nodes, {
      id: childId,
      label: childName,
      type: childType,
    })
    pushLink(links, linkIds, rootId, childId)
  })

  return {
    nodes: Array.from(nodes.values()),
    links,
  }
}

function projectNameForFiles(files: File[]): string {
  const path = files[0]?.webkitRelativePath
  const root = path?.split("/").filter(Boolean)[0]

  return root || "Selected project"
}

function pushNode(nodes: Map<string, SourceNode>, node: SourceNode): void {
  if (!nodes.has(node.id)) nodes.set(node.id, node)
}

function pushLink(links: SourceLink[], linkIds: Set<string>, source: string, target: string): void {
  const id = `${source}->${target}`

  if (linkIds.has(id)) return

  linkIds.add(id)
  links.push({ source, target })
}
