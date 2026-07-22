# Dimension

A desktop project intelligence workspace for humans and AI agents.

Dimension will open real local workspaces through a native desktop host, map their source files into browsable structural layers, and grow toward an IDE for understanding and changing AI-built projects.

## Product Direction

Dimension is an Electron desktop workspace:

- native folder selection and a durable local workspace root
- Vue renderer with narrowly scoped, typed desktop IPC
- Node/ts-morph graph analysis against local files
- future Git, terminal, and language-service integrations

Workspace metadata belongs outside the opened repository.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Development

The project uses the checked-in Docker Compose wrapper. `bin/dev up` writes random free host ports to `.dev-ports.env` and reuses them until the file is removed.

```sh
./bin/dev up
./bin/dev down
```

Run the desktop host in a second terminal after the web service is ready:

```sh
./bin/dev desktop
```

PlantUML is behind the `design` Compose profile:

```sh
COMPOSE_PROFILES=design ./bin/dev up
```

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```
