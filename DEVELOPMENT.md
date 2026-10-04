## Stacks

Frontend

- Vite
- React
- Tailwind
- Typescript

Backend

- Electron
- Node-IPC

## Setup development

Requirements:

- Node 22 (see `.nvmrc`)
- Bun 1.4.2 (see `packageManager` in `package.json`)

The repo is a Bun workspace (`vite`, `server`, `firestore-serializers`) with a single `bun.lock`. Install everything from the root:

```
bun install
```

## Start development

Run each in its own terminal, from the root.

### Start client

```
bun run dev:client
```

### Start server & electron

```
bun run dev:server
```

## Build app

### Build frontend and server

```
bun run build
```

This runs the Vite build, copies `vite/dist` into `server/build`, and compiles the server TypeScript.

### Package electron app

```
bun run --cwd server package
bun run --cwd server release
```
