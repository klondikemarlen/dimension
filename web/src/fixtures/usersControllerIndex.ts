export type RuneKind = "method" | "local" | "policy" | "async" | "response" | "error"

export type EdgeKind = "data" | "error" | "response"

export interface RuneNode {
  id: string
  label: string
  kind: RuneKind
  x: number
  y: number
  radius: number
  ring?: "solid" | "dashed" | "focus"
}

export interface LeylineEdge {
  id: string
  source: string
  target: string
  kind: EdgeKind
}

export interface SpellDiagram {
  title: string
  subtitle: string
  nodes: RuneNode[]
  edges: LeylineEdge[]
}

export const usersControllerIndexDiagram: SpellDiagram = {
  title: "UsersController#index",
  subtitle: "Source-backed fixture for import, policy, query, serialization, and response flow.",
  nodes: [
    { id: "index", label: "INDEX", kind: "method", x: 480, y: 260, radius: 86, ring: "focus" },
    { id: "build-where", label: "BUILD WHERE", kind: "local", x: 205, y: 120, radius: 48, ring: "solid" },
    { id: "filter-scopes", label: "FILTER SCOPES", kind: "policy", x: 295, y: 255, radius: 55, ring: "dashed" },
    { id: "users-policy", label: "USERS POLICY", kind: "policy", x: 210, y: 400, radius: 50, ring: "dashed" },
    { id: "find-all", label: "FIND ALL", kind: "async", x: 480, y: 445, radius: 58, ring: "solid" },
    { id: "build-order", label: "BUILD ORDER", kind: "local", x: 705, y: 132, radius: 48, ring: "solid" },
    { id: "index-serializer", label: "SERIALIZER", kind: "local", x: 745, y: 315, radius: 54, ring: "solid" },
    { id: "json-response", label: "JSON RESPONSE", kind: "response", x: 920, y: 250, radius: 52, ring: "solid" },
    { id: "count", label: "COUNT", kind: "async", x: 735, y: 480, radius: 42, ring: "solid" },
    { id: "logger", label: "LOGGER", kind: "error", x: 365, y: 560, radius: 42, ring: "dashed" },
    { id: "status", label: "STATUS 400", kind: "error", x: 555, y: 575, radius: 44, ring: "solid" },
  ],
  edges: [
    { id: "where-index", source: "build-where", target: "index", kind: "data" },
    { id: "filter-policy", source: "filter-scopes", target: "users-policy", kind: "data" },
    { id: "policy-find", source: "users-policy", target: "find-all", kind: "data" },
    { id: "find-index", source: "find-all", target: "index", kind: "data" },
    { id: "order-index", source: "build-order", target: "index", kind: "data" },
    { id: "index-serializer", source: "index", target: "index-serializer", kind: "data" },
    { id: "serializer-response", source: "index-serializer", target: "json-response", kind: "response" },
    { id: "count-response", source: "count", target: "json-response", kind: "response" },
    { id: "index-error", source: "index", target: "logger", kind: "error" },
    { id: "logger-status", source: "logger", target: "status", kind: "error" },
    { id: "status-response", source: "status", target: "json-response", kind: "error" },
  ],
}
