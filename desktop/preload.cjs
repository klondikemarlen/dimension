const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("dimensionDesktop", {
  runtime: () => ipcRenderer.invoke("dimension:runtime"),
  openWorkspace: () => ipcRenderer.invoke("dimension:open-workspace"),
  openSourceFile: () => ipcRenderer.invoke("dimension:open-source-file"),
})
