const { contextBridge, ipcRenderer } = require("electron")

contextBridge.exposeInMainWorld("dimensionDesktop", {
  runtime: () => ipcRenderer.invoke("dimension:runtime"),
})
