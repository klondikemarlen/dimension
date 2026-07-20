import { readFileSync } from "node:fs"
import { extname } from "node:path"
import {
  Node,
  Project,
  ScriptKind,
  SyntaxKind,
  type ArrowFunction,
  type FunctionDeclaration,
  type FunctionExpression,
  type MethodDeclaration,
  type Node as TypeScriptNode,
} from "ts-morph"

export interface SourceNode {
  id: string
  label: string
  type: string
}

export interface SourceLink {
  source: string
  target: string
}

export interface SourceGraph {
  nodes: SourceNode[]
  links: SourceLink[]
}

type CallableDeclaration = FunctionDeclaration | MethodDeclaration | ArrowFunction | FunctionExpression
type RubyStackFrame = { kind: "class" | "method"; node: SourceNode } | { kind: "block" }

export function createService(path: string, sourceName = path): SourceGraph {
  return extname(sourceName) === ".rb" ? createRubyGraph(path) : createTypeScriptGraph(path, sourceName)
}

function createTypeScriptGraph(path: string, sourceName: string): SourceGraph {
  const graph: SourceGraph = { nodes: [], links: [] }

  const pushNode = (id: string, label: string, type: string) => {
    if (!graph.nodes.some((node) => node.id === id)) graph.nodes.push({ id, label, type })
  }

  const pushLink = (source: string, target: string) => graph.links.push({ source, target })

  const project = new Project({
    compilerOptions: {
      allowJs: true,
    },
  })
  const sourceFile =
    extname(path) === extname(sourceName)
      ? project.addSourceFileAtPath(path)
      : project.createSourceFile(`${path}${extname(sourceName)}`, readFileSync(path, "utf8"), {
          scriptKind: scriptKindFor(sourceName),
        })

  const inspectCallable = (
    callable: CallableDeclaration,
    callableIdentifier: string,
    callableLabel: string,
    callableType: string,
    parentIdentifier?: string,
  ) => {
    pushNode(callableIdentifier, callableLabel, callableType)
    if (parentIdentifier) pushLink(parentIdentifier, callableIdentifier)

    let responseIndex = 0
    let errorIndex = 0
    const body = callable.getBody()

    if (!body) return

    visitOwnedNodes(body, (node) => {
      if (Node.isVariableStatement(node)) {
        node.getDeclarations().forEach((declaration) => {
          const localName = declaration.getName()
          const localIdentifier = `${callableIdentifier}:local:${localName}`
          const initializer = declaration.getInitializer()
          const localType = containsAwait(initializer) ? "async" : "helper"

          pushNode(localIdentifier, localName, localType)
          pushLink(callableIdentifier, localIdentifier)
        })
      }

      if (Node.isReturnStatement(node)) {
        const responseIdentifier = `${callableIdentifier}:return:${responseIndex}`
        responseIndex += 1

        pushNode(responseIdentifier, "return", "response")
        pushLink(callableIdentifier, responseIdentifier)
      }

      if (Node.isCatchClause(node)) {
        const errorIdentifier = `${callableIdentifier}:error:${errorIndex}`
        errorIndex += 1

        pushNode(errorIdentifier, "error", "error")
        pushLink(callableIdentifier, errorIdentifier)
      }
    })
  }

  sourceFile.getClasses().forEach((classDeclaration) => {
    const className = classDeclaration.getName() ?? "UnknownClass"
    const classIdentifier = `class:${className}`

    pushNode(classIdentifier, className, "class")

    classDeclaration.getMethods().forEach((methodDeclaration) => {
      const methodName = methodDeclaration.getName()

      inspectCallable(
        methodDeclaration,
        `${classIdentifier}:method:${methodName}`,
        methodName,
        "method",
        classIdentifier,
      )
    })
  })

  sourceFile.getFunctions().forEach((functionDeclaration) => {
    const functionName = functionDeclaration.getName() ?? "anonymousFunction"

    inspectCallable(functionDeclaration, `function:${functionName}`, functionName, "function")
  })

  sourceFile.getVariableStatements().forEach((statement) => {
    statement.getDeclarations().forEach((declaration) => {
      const initializer = declaration.getInitializer()

      if (!initializer || (!Node.isArrowFunction(initializer) && !Node.isFunctionExpression(initializer))) return

      const functionName = declaration.getName()

      inspectCallable(initializer, `function:${functionName}`, functionName, "function")
    })
  })

  return graph
}

function createRubyGraph(path: string): SourceGraph {
  const graph: SourceGraph = { nodes: [], links: [] }
  const stack: RubyStackFrame[] = []
  const responseCountBySource = new Map<string, number>()
  const errorCountBySource = new Map<string, number>()

  const pushNode = (node: SourceNode) => {
    if (!graph.nodes.some((existingNode) => existingNode.id === node.id)) graph.nodes.push(node)
  }

  const pushLink = (source: string, target: string) => graph.links.push({ source, target })

  readFileSync(path, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmedLine = line.trim()

      if (!trimmedLine || trimmedLine.startsWith("#")) return

      if (trimmedLine === "end") {
        stack.pop()
        return
      }

      const parentNode = currentRubyNode(stack)
      const classMatch = /^(?:class|module)\s+([A-Z][\w:]*)/.exec(trimmedLine)

      if (classMatch) {
        const className = classMatch[1]
        const node = { id: `ruby:class:${className}`, label: className, type: "class" }

        pushNode(node)
        if (parentNode) pushLink(parentNode.id, node.id)
        stack.push({ kind: "class", node })
        return
      }

      const methodMatch = /^def\s+(?:self\.)?([a-zA-Z_]\w*[!?=]?)/.exec(trimmedLine)

      if (methodMatch) {
        const methodName = methodMatch[1]
        const node = {
          id: `${parentNode?.id ?? "ruby"}:method:${methodName}`,
          label: methodName,
          type: "method",
        }

        pushNode(node)
        if (parentNode) pushLink(parentNode.id, node.id)
        stack.push({ kind: "method", node })
        return
      }

      const methodNode = currentRubyMethodNode(stack)

      if (!methodNode) return

      const localMatch = /^([a-z_]\w*)\s*=/.exec(trimmedLine)

      if (localMatch) {
        const localName = localMatch[1]
        const localNode = {
          id: `${methodNode.id}:local:${localName}`,
          label: localName,
          type: "helper",
        }

        pushNode(localNode)
        pushLink(methodNode.id, localNode.id)
      }

      if (/^(return|render|redirect_to|head|json_response)\b/.test(trimmedLine)) {
        const nextIndex = responseCountBySource.get(methodNode.id) ?? 0
        const responseNode = {
          id: `${methodNode.id}:response:${nextIndex}`,
          label: trimmedLine.split(/\s+/, 1)[0],
          type: "response",
        }

        responseCountBySource.set(methodNode.id, nextIndex + 1)
        pushNode(responseNode)
        pushLink(methodNode.id, responseNode.id)
      }

      if (/^(raise|rescue)\b/.test(trimmedLine)) {
        const nextIndex = errorCountBySource.get(methodNode.id) ?? 0
        const errorNode = {
          id: `${methodNode.id}:error:${nextIndex}`,
          label: trimmedLine.split(/\s+/, 1)[0],
          type: "error",
        }

        errorCountBySource.set(methodNode.id, nextIndex + 1)
        pushNode(errorNode)
        pushLink(methodNode.id, errorNode.id)
      }

      if (opensRubyBlock(trimmedLine)) stack.push({ kind: "block" })
    })

  return graph
}

function currentRubyNode(stack: RubyStackFrame[]): SourceNode | undefined {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const frame = stack[index]

    if (frame.kind !== "block") return frame.node
  }

  return undefined
}

function currentRubyMethodNode(stack: RubyStackFrame[]): SourceNode | undefined {
  for (let index = stack.length - 1; index >= 0; index -= 1) {
    const frame = stack[index]

    if (frame.kind === "method") return frame.node
  }

  return undefined
}

function opensRubyBlock(line: string): boolean {
  return /^(?:if|unless|case|begin|for|while|until)\b/.test(line) || /\bdo(?:\s*\|[^|]*\|)?$/.test(line)
}

function scriptKindFor(sourceName: string): ScriptKind {
  switch (extname(sourceName)) {
    case ".js":
      return ScriptKind.JS
    case ".jsx":
      return ScriptKind.JSX
    case ".tsx":
      return ScriptKind.TSX
    default:
      return ScriptKind.TS
  }
}

function containsAwait(node: TypeScriptNode | undefined): boolean {
  return Boolean(node && (Node.isAwaitExpression(node) || node.getFirstDescendantByKind(SyntaxKind.AwaitExpression)))
}

function visitOwnedNodes(root: TypeScriptNode, visit: (node: TypeScriptNode) => void): void {
  root.forEachChild((child) => {
    if (isCallable(child)) return

    visit(child)
    visitOwnedNodes(child, visit)
  })
}

function isCallable(node: TypeScriptNode): boolean {
  return (
    Node.isFunctionDeclaration(node) ||
    Node.isMethodDeclaration(node) ||
    Node.isArrowFunction(node) ||
    Node.isFunctionExpression(node)
  )
}

export default createService
