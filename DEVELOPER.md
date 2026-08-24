# Developer Guide

This document covers building, running, and contributing to Likhi Lakeerain. For a user-facing overview of the app, see [README.md](README.md).

## Overview

Likhi Lakeerain is a [Wails v3](https://v3alpha.wails.io/) desktop application: a Go backend (project persistence, native window/tray) wrapping a React/TypeScript frontend rendered in a webview.

- **Backend**: Go (`app.go`, `main.go`, `odt.go`) — window management, system tray, project file I/O, ODT export
- **Frontend**: React + TypeScript, rendered with the HTML5 Canvas API, styled with Tailwind CSS, built with Vite

### Architecture patterns

- **Context API for state management** — `EditorContext` centralizes application state (project, config, markers, selection, compile slots, UI state) and avoids prop drilling while staying performant via memoization.
- **Canvas-based rendering** — the grid and markers are drawn on an HTML5 Canvas for performance with many visual elements, with a rendering pipeline of: clear → grid lines → line labels → hover indicators → markers (layered for hover/selection state).
- **Custom hooks** — complex logic is encapsulated in hooks like `useCanvasInteraction` (hit testing, marker/line click handling, snapping, hover feedback) and `useCanvasRenderer` (responsive sizing via `ResizeObserver`, `requestAnimationFrame` scheduling, device-pixel-ratio handling for sharp rendering).

### Data model

- **Marker** — a content unit with rich text, title, color, category, tags, and a normalized (0–1) position on a line
- **Timeline** — a horizontal or vertical grid line
- **Project** — a container for markers, config, and compile slots
- **Config** — grid appearance and interaction preferences (line counts, visibility, snap threshold, background color)

## Prerequisites

- **Go** 1.25+
- **Node.js** 20+ and npm
- **Wails v3 CLI**:
  ```bash
  go install github.com/wailsapp/wails/v3/cmd/wails3@v3.0.0-beta.12
  ```
- **Task** ([taskfile.dev](https://taskfile.dev)) — used to drive builds via `Taskfile.yml`

## Getting started

```bash
git clone <repo-url>
cd non-linear-editor
cd frontend && npm install && cd ..
```

### Run in development mode

```bash
wails3 dev -config ./build/config.yml
```

This launches the desktop shell with hot-reload for the frontend. Equivalent to `task dev`.

If you only want to iterate on frontend UI without the Go backend/window, you can also run the frontend alone with Vite:

```bash
cd frontend
npm run dev
```

Note that this skips the Wails runtime bridge, so anything that talks to the Go backend (save/open dialogs, native menus) won't work — use `wails3 dev` for full functionality.

### Build

```bash
task build          # build for the host OS
task build GOOS=windows
task build GOOS=darwin
```

### Package a release build

```bash
task package
```

Platform-specific packaging tasks live in `build/windows/Taskfile.yml`, `build/darwin/Taskfile.yml`, and `build/linux/Taskfile.yml`.

### Server / headless mode

The app can also run as an HTTP server with no GUI:

```bash
task build:server
task run:server
task build:docker
task run:docker
```

## Frontend workflow

All frontend commands run from `frontend/`:

```bash
npm run dev          # Vite dev server
npm run build         # tsc build + Vite production build
npm run build:dev     # development-mode build
npm run lint           # ESLint
npm run preview        # preview a production build
```

### Project structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Canvas/       # Canvas rendering and interaction
│   │   ├── Compile/      # Compile drawer components
│   │   ├── Layout/       # Header, sidebar layout components
│   │   ├── Marker/       # Marker editing components
│   │   └── Settings/     # Configuration components
│   ├── context/          # React context providers (EditorContext)
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── services/         # External service integrations
└── public/               # Static assets
```

Go backend files live at the repo root: `main.go` (app entry, window/tray setup), `app.go` (project persistence, service methods exposed to the frontend), `odt.go` (ODT document export).

### Code standards

- TypeScript for all new frontend code; follow the existing ESLint config
- Functional React components with hooks; prefer custom hooks for reusable logic
- `React.memo`, `useMemo`, `useCallback` where they meaningfully help canvas/render performance
- Tailwind utility classes over custom CSS
- Clean up event listeners and animation frames in `useEffect`

## CI / Releases

`.github/workflows/build.yml` builds Windows and macOS binaries on every tag push (`v*`) or manual dispatch, and attaches them to a GitHub Release. It uses the same `wails3` CLI and `Taskfile.yml` tasks described above, so a local `task build` / `wails3 build` should reproduce what CI does.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the fork/branch/PR workflow, commit message conventions, and issue/feature-request guidelines.

## Troubleshooting

**Frontend dependency issues**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

**`wails3` command not found** — make sure `$(go env GOPATH)/bin` is on your `PATH`.

**Dev window won't launch** — confirm Go and Node versions meet the prerequisites above, and that `frontend/dist` isn't stale from a previous production build conflicting with dev mode.

## Further reading

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DESIGN_PRINCIPLES.md](docs/DESIGN_PRINCIPLES.md)
- [CHANGELOG.md](CHANGELOG.md)
