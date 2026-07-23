import type { SourceGraph } from "./source-graph"

declare global {
  interface DimensionDesktopWorkspace {
    id: string
    name: string
    graph: SourceGraph
  }

  interface DimensionDesktopSource {
    name: string
    graph: SourceGraph
  }

  type DimensionDesktopSourceResult =
    | { kind: "canceled" }
    | { kind: "selected"; source: DimensionDesktopSource }

  type DimensionDesktopWorkspaceResult =
    | { kind: "canceled" }
    | { kind: "selected"; workspace: DimensionDesktopWorkspace }

  interface Window {
    dimensionDesktop?: {
      runtime: () => Promise<{ platform: string }>
      openWorkspace: () => Promise<DimensionDesktopWorkspaceResult>
      openSourceFile: () => Promise<DimensionDesktopSourceResult>
    }
  }
}
