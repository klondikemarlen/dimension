const { app, BrowserWindow, dialog, ipcMain } = require("electron")
const path = require("node:path")
const { pathToFileURL } = require("node:url")

const { createSourceGraph } = require("../api/src/services/graphs/create-service.cjs")
const { openWorkspace } = require("./workspace.cjs")

const rendererUrl = process.env.DIMENSION_WEB_ORIGIN
  ? new URL(process.env.DIMENSION_WEB_ORIGIN)
  : pathToFileURL(path.join(__dirname, "..", "web", "dist", "index.html"))
const rendererOrigin = rendererUrl.protocol === "file:" ? undefined : rendererUrl.origin

async function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  })

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }))
  window.webContents.on("will-navigate", (event, url) => {
    const nextUrl = new URL(url)
    const isAllowedFileNavigation =
      rendererUrl.protocol === "file:" && nextUrl.protocol === "file:" && nextUrl.pathname === rendererUrl.pathname
    const isAllowedWebNavigation = Boolean(rendererOrigin && nextUrl.origin === rendererOrigin)

    if (!isAllowedFileNavigation && !isAllowedWebNavigation) event.preventDefault()
  })

  await window.loadURL(rendererUrl.href)

  if (process.env.DIMENSION_DESKTOP_SMOKE_TEST) {
    const [runtime, hasWorkspacePicker, hasSourceFilePicker] = await window.webContents.executeJavaScript(
      "Promise.all([window.dimensionDesktop.runtime(), typeof window.dimensionDesktop.openWorkspace === 'function', typeof window.dimensionDesktop.openSourceFile === 'function'])",
    )

    if (runtime.platform !== process.platform || !hasWorkspacePicker || !hasSourceFilePicker) {
      throw new Error("Desktop preload bridge is unavailable.")
    }
    app.exit()
  }
}

async function openSourceFile() {
  const selection = await dialog.showOpenDialog({
    title: "Open Dimension source file",
    properties: ["openFile"],
    filters: [{ name: "Source files", extensions: ["js", "jsx", "ts", "tsx", "rb"] }],
  })

  if (selection.canceled || !selection.filePaths[0]) return { kind: "canceled" }

  const sourcePath = selection.filePaths[0]

  return {
    kind: "selected",
    source: {
      name: path.basename(sourcePath),
      graph: createSourceGraph(sourcePath),
    },
  }
}

app
  .whenReady()
  .then(async () => {
    ipcMain.handle("dimension:runtime", () => ({ platform: process.platform }))
    ipcMain.handle("dimension:open-workspace", () =>
      openWorkspace({ dialog, userDataPath: app.getPath("userData") }),
    )
    ipcMain.handle("dimension:open-source-file", openSourceFile)
    await createWindow()

    app.on("activate", () => {
      if (!BrowserWindow.getAllWindows().length) void createWindow()
    })
  })
  .catch((error) => {
    console.error(error)
    app.exit(1)
  })

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit()
})
