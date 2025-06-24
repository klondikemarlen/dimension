import ts, { Project } from "ts-morph"

/** Dimension-style node/edge types (same as canvas file) */
export interface DimNode {
  id: string
  label: string
  type: string
}
export interface DimLink {
  source: string
  target: string
}
export interface DimGraph {
  nodes: DimNode[]
  links: DimLink[]
}

/**
 * Convert a ts-morph SourceFile into a Dimension graph.
 */
export function createService(path: string): DimGraph {
  const graph: DimGraph = { nodes: [], links: [] }

  const pushNode = (id: string, label: string, type: string) => {
    if (!graph.nodes.some((n) => n.id === id)) graph.nodes.push({ id, label, type })
  }
  const pushLink = (s: string, t: string) => graph.links.push({ source: s, target: t })

  const project = new Project({
    compilerOptions: {
      allowJs: true,
    },
  })
  const sf = project.addSourceFileAtPath(path)
  sf.getClasses().forEach((cls) => {
    const classIdentifier = cls.getName() ?? "UnknownClass"
    pushNode(classIdentifier, classIdentifier, "class")

    cls.getMethods().forEach((method) => {
      const methodIdentifier = method.getName() ?? "UnknownMethod"
      pushNode(methodIdentifier, methodIdentifier, "method")
      pushLink(classIdentifier, methodIdentifier)

      method.getDescendantsOfKind(ts.SyntaxKind.VariableStatement).forEach((vs) => {
        vs.getDeclarations().forEach((decl) => {
          const id = decl.getName()
          const init = decl.getInitializer()
          const type = init?.getFirstDescendantByKind(ts.SyntaxKind.AwaitExpression)
            ? "async"
            : "helper"
          pushNode(id, id, type)
          pushLink(methodIdentifier, id)
        })
      })

      method.getDescendantsOfKind(ts.SyntaxKind.ReturnStatement).forEach((_, i) => {
        const rId = `${methodIdentifier}_return_${i}`
        pushNode(rId, "return", "response")
        pushLink(methodIdentifier, rId)
      })

      method.getDescendantsOfKind(ts.SyntaxKind.CatchClause).forEach((_, i) => {
        const eId = `${methodIdentifier}_error_${i}`
        pushNode(eId, "error", "error")
        pushLink(methodIdentifier, eId)
      })
    })
  })

  return graph
}

export default createService
