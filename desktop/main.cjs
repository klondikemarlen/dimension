const { app, BrowserWindow, dialog, ipcMain } = require("electron")
const path = require("node:path")

const { openWorkspace } = require("./workspace.cjs")

const rendererUrl = new URL(process.env.DIMENSION_WEB_ORIGIN)
const rendererOrigin = rendererUrl.origin

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
    if (new URL(url).origin !== rendererOrigin) event.preventDefault()
  })

  await window.loadURL(rendererUrl.href)

  if (process.env.DIMENSION_DESKTOP_SMOKE_TEST) {
    const [runtime, hasWorkspacePicker] = await window.webContents.executeJavaScript(
      "Promise.all([window.dimensionDesktop.runtime(), typeof window.dimensionDesktop.openWorkspace === 'function'])",
    )

    if (runtime.platform !== process.platform || !hasWorkspacePicker) {
      throw new Error("Desktop preload bridge is unavailable.")
    }
    app.exit()
  }
}

app
  .whenReady()
  .then(async () => {
    ipcMain.handle("dimension:runtime", () => ({ platform: process.platform }))
    ipcMain.handle("dimension:open-workspace", () =>
      openWorkspace({ dialog, userDataPath: app.getPath("userData") }),
    )
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
