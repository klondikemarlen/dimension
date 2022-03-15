window.addEventListener("DOMContentLoaded", () => {
  const logStuff = (selector, text) => {
    console.log(selector, text)
  }

  for (const dependency of ["chrome", "node", "electron"]) {
    logStuff(`${dependency}-version`, process.versions[dependency])
  }
})
