# Dimension

A dream of a visual code editor.

## Project setup

```
npm install
```

### Compiles and hot-reloads for development

```
npm run serve
npm run electron:serve
```

### Compiles and minifies for production

```
npm run build
npm run electron:build
```

### Lints and fixes files

```
npm run lint
```

### Customize configuration

See [Configuration Reference](https://cli.vuejs.org/config/).

## Implementation

### Front-End

The front-end is running [Vue.js](https://vuejs.org/) with [Pug](https://pugjs.org/api/getting-started.html) via the [Vue CLI](https://cli.vuejs.org/).

### Back-End

The back-end is running [Node](https://nodejs.org/en/) in [Electron](https://electronjs.org/) via the [Vue CLI Electron Builder plugin](https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/).

### Pipeline

The serve/build pipeline work as described in Vue CLI Electron Builder plugin's [How it works](https://nklayman.github.io/vue-cli-plugin-electron-builder/guide/guide.html#how-it-works).

1. Render build: This phase calls `vue-cli-service build` with some custom configuration so it works properly with electron. (The render process is your standard app.)
2. Main build: This phase is where VCP-Electron-Builder bundles your background file for the main process (`src/background.js`).
3. Electron-builder build: This phase uses [electron-builder](https://www.electron.build/)
   (opens new window) to turn your web app code into an desktop app powered by [Electron](https://electronjs.org/) (opens new window).
