# AI Coding Agent Instructions for Likhi Lakeerain

## Project Overview
**Likhi Lakeerain** (लिखी लकीरें - "Written Lines") is a Wails-based cross-platform desktop application for creating timeline-based projects with markers. The architecture separates Go (backend) from React+TypeScript (frontend) with bindings handled by Wails runtime.

## Architecture

### Backend (Go)
- **Entry**: `main.go` - Wails application setup with embedded frontend assets
- **Core Logic**: `app.go` - Defines data models and file I/O operations
  - `App` struct holds context and current file path
  - `Project` struct contains markers, configuration, and compile slots
  - `Marker` struct represents timeline items with position, label, content, tags, category, and color
  - `Config` struct manages grid lines, display settings, and snap behavior
- **Export**: `odt.go` - Generates ODT (OpenDocument) files with XML structure
  
### Frontend (React + TypeScript)
- **Entry**: `frontend/src/main.tsx` - React app mount point
- **App Layout**: `frontend/src/App.tsx` - Main component orchestrating Header, Sidebar, TimelineCanvas, and MarkerEditor
- **State Management**: `frontend/src/context/EditorContext.tsx` - Global context providing:
  - Config updates (grid lines, visibility)
  - Marker operations (add, update, delete, select)
  - Timeline generation from config
  - Compile slot management (ordering markers for export)
  - Editor popup state
- **Styling**: Tailwind CSS with custom `editor-bg` color (rgb(15, 23, 42))

### Frontend Components
- **Canvas**: `TimelineCanvas.tsx` (renders grid/markers), `canvasUtils.ts` (geometry), `useCanvasRenderer.ts` (rendering logic)
- **Marker**: `MarkerEditor.tsx` (edit popup), `MarkerPreview.tsx` (preview)
- **Layout**: `Header.tsx`, `Sidebar.tsx` (UI structure)
- **Compile**: `CompileDrawer.tsx` (export interface)
- **UI**: Reusable Button, ColorPicker, Modal components
- **Services**: `wails.ts` - Wails runtime bindings for Go function calls
- **Types**: `types/index.ts` defines Marker, Timeline, EditorConfig interfaces
- **Utils**: `geometry.ts` handles position calculations

## Key Patterns

### Wails Bindings
Go methods on `App` struct are automatically exposed to frontend. Call via `wails.ts`:
```typescript
// Frontend calling Go
const filePath = await SaveProject(projectObject);
```

### Context Pattern
Frontend components use `useEditor()` hook from `EditorContext` to access state:
```tsx
const { markers, addMarker, updateMarker } = useEditor();
```

### File Format
Projects save as `.nle` files (JSON format) with markers, config, and compile slots. Timestamps use ISO format (stored as `time.Time` in Go).

### State Synchronization
Frontend maintains UI state (sidebar open, compile drawer open, selected marker). Markers and config are stored in context and persisted via Wails calls to backend.

## Developer Workflows

### Build & Run
```bash
# Frontend: Install, dev server, or production build
cd frontend
npm install
npm run dev      # Starts Vite dev server
npm run build    # TypeScript compile + Vite bundle

# Full app (requires Go):
wails dev        # Builds and runs with hot reload
wails build      # Creates executable
```

### Type Safety
- Frontend uses TypeScript (`tsconfig.json` configured)
- Backend uses Go struct tags for JSON serialization
- Ensure Go struct tags match TypeScript interfaces in `types/index.ts`

### Canvas Rendering
- Timeline canvas uses renderer pattern (`useCanvasRenderer.ts`)
- Geometry calculations in `geometry.ts` handle snap-to-grid and positioning
- Canvas interaction via `useCanvasInteraction.ts` hook

## Critical Integration Points

### Marker Lifecycle
1. **Create**: `addMarker(lineId, position)` in context → generates UUID, timestamp
2. **Edit**: `updateMarker(id, updates)` → partial updates via context
3. **Persist**: Context auto-saves via MarkerEditor component calling backend `SaveProject()`
4. **Export**: Selected markers added to `compileSlots[]` array → compiled to ODT

### Project Persistence
- Save dialog triggered via `SaveProjectAs()` → calls Wails `runtime.SaveFileDialog`
- Load dialog triggered via `LoadProject()` → calls Wails `runtime.OpenFileDialog`
- Current file path stored in `App.currentFilePath` to enable "Save" without re-prompting

### ODT Export
- `createODT()` generates ZIP archive with XML structure
- Sections compiled from selected markers (`compileSlots`)
- Output preserves marker colors, content (with HTML cleanup), and order

## Common Development Tasks

### Adding a New Marker Property
1. Update `Marker` struct in `app.go` with JSON tag
2. Update `Marker` interface in `types/index.ts`
3. Update `MarkerEditor.tsx` to render new field
4. Update `MarkerPreview.tsx` if visible in preview

### Modifying Grid/Canvas
1. Edit `Config` struct in `app.go` if new config option needed
2. Update `EditorConfig` interface in `types/index.ts`
3. Modify `generateTimelines()` in `EditorContext.tsx` if logic changes
4. Update `useCanvasRenderer.ts` for rendering changes

### Adding Export Format
1. Create new export function in Go (e.g., `createPDF()`)
2. Add export type to `CompiledSection` handling
3. Add button in `CompileDrawer.tsx` calling new export function via `wails.ts`

## Dependencies to Know
- **Wails v2**: Desktop framework binding Go to web frontend
- **React 18.3**: UI component framework
- **TypeScript 5.6**: Type safety for frontend
- **Vite 6**: Frontend bundler with HMR
- **Tailwind CSS 3.4**: Utility CSS framework
- **Framer Motion**: Animation library for smooth transitions
- **React Quill**: Rich text editor for marker content
- **uuid**: ID generation for markers and timelines

## File I/O & Timestamps
- Project files use JSON with human-readable indentation (`json.MarshalIndent`)
- Timestamps stored as RFC3339 (Go's time.Time JSON default)
- File permissions: `0644` (readable by all, writable by owner only)
