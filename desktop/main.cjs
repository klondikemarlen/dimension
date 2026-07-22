const { app, BrowserWindow, ipcMain } = require("electron")
const path = require("node:path")

const rendererOrigin = process.env.DIMENSION_WEB_ORIGIN

if (!rendererOrigin) {
  throw new Error("DIMENSION_WEB_ORIGIN must point to the Dimension web renderer.")
}

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

  await window.loadURL(rendererOrigin)

  if (process.env.DIMENSION_DESKTOP_SMOKE_TEST) {
    const runtime = await window.webContents.executeJavaScript("window.dimensionDesktop.runtime()")

    if (runtime.platform !== process.platform) throw new Error("Desktop preload bridge is unavailable.")
    app.exit()
  }
}

app
  .whenReady()
  .then(async () => {
    ipcMain.handle("dimension:runtime", () => ({ platform: process.platform }))
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
