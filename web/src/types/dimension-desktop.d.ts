interface Window {
  dimensionDesktop?: {
    runtime: () => Promise<{ platform: string }>
  }
}
