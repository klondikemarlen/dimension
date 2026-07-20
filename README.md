# Dimension

A project intelligence workspace for humans and AI agents.

Dimension maps source files and project folders into browsable structural layers so you can see what an AI built, judge whether the project is well organized, and ask for focused changes without reading every file by hand.

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
