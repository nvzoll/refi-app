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

The repo is a Bun workspace (`vite`, `server`, `firestore-serializers`, `ipc`, `e2e`) with a single `bun.lock`. Install everything from the root:

```
bun install
```

`firestore-serializers` is a workspace package that `vite` and `server` consume from its built `dist/`. The root `dev`, `build`, `test`, `lint` and `typecheck` scripts build it first; after editing it during `dev`, run `bun run build:serializers`.

## Start development

Run from the root:

```
bun run dev
```

## Build app

### Build frontend and server

```
bun run build
```

This builds the main process, preloads, worker and renderer into `server/out`.

### Package electron app

```
bun run --cwd server package
bun run --cwd server release
```

## Lint, format and typecheck

Run from the root:

```
bun run lint
bun run format:check
bun run typecheck
```

`bun run format` rewrites the files in place. oxlint reports the findings that existed when it replaced ESLint as warnings, so only new correctness problems fail the lint script.
