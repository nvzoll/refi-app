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

Make sure you are using Node v14 or Node v16

### Install node module for client and server

Client

```
cd vite
yarn
```

Server

```
cd server
yarn
```

## Start development

### Start client

```
cd vite
yarn dev
```

### Start server & electron

```
cd server
yarn dev
```

## Build app

### Build frontend

```
cd vite
yarn build
```

### Build electron app

```
cd server
yarn build
yarn prepare
yarn package-{mac,linux,window}
yarn make-{mac,linux,window}
```
