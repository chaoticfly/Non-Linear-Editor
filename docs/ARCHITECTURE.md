# Architecture Documentation

This document provides a detailed overview of the Likhi Lakeerain application architecture.

## System Overview

Likhi Lakeerain is a client-side React application that implements a non-linear content editor using a grid-based timeline system. The application is built with modern web technologies and follows a component-based architecture.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface Layer                     │
├─────────────────────────────────────────────────────────────┤
│                   Component Layer                           │
├─────────────────────────────────────────────────────────────┤
│                   State Management Layer                    │
├─────────────────────────────────────────────────────────────┤
│                   Business Logic Layer                      │
├─────────────────────────────────────────────────────────────┤
│                   Rendering Layer                           │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Core Components

1. **App Component**
   - Root component that provides the overall application structure
   - Manages global state through EditorProvider
   - Coordinates layout between header, canvas, sidebar, and compile drawer

2. **TimelineCanvas Component**
   - Main visualization area
   - Handles user interactions with the grid
   - Manages canvas rendering and updates
   - Coordinates with hooks for interaction and rendering

3. **EditorContext Provider**
   - Centralized state management
   - Provides API for all editor operations
   - Manages markers, timelines, configuration, and UI state

### Supporting Components

1. **Layout Components** (Header, Sidebar)
   - Provide application structure and navigation
   - Handle global UI state (open/closed states)

2. **Marker Components** (MarkerEditor)
   - Handle marker creation and editing
   - Integrate with rich text editor (React Quill)

3. **Compile Components** (CompileDrawer)
   - Manage the compilation workflow
   - Allow ordering of markers for final output

## State Management

### EditorContext

The application uses React's Context API for state management, implemented in `EditorProvider`. This provides:

- **Project State**: Name, configuration
- **Grid State**: Timeline configuration, line geometries
- **Marker State**: Collection of markers with CRUD operations
- **Selection State**: Currently selected marker
- **UI State**: Sidebar, compile drawer, editor popup states
- **Compile State**: Ordered collection of markers for output

### State Flow

```
User Interaction → Component Event Handler → Context Action → State Update → UI Re-render
```

## Rendering System

### Canvas Rendering

The application uses HTML5 Canvas for high-performance rendering:

1. **useCanvasRenderer Hook**
   - Manages canvas lifecycle
   - Coordinates rendering updates
   - Handles device pixel ratio for sharp rendering

2. **canvasUtils Module**
   - Contains drawing functions for all visual elements
   - Implements line, marker, and label rendering
   - Provides consistent styling and configuration

### Rendering Pipeline

```
1. Clear Canvas
2. Draw Grid Lines
3. Draw Line Labels
4. Draw Hover Indicators
5. Draw Markers (layered: normal, hovered, selected)
```

## Interaction System

### useCanvasInteraction Hook

Handles all user interactions with the canvas:

1. **Mouse Movement**
   - Detects hover states over markers and lines
   - Provides visual feedback
   - Calculates snap points for precise placement

2. **Click Handling**
   - Differentiates between marker clicks and line clicks
   - Triggers appropriate actions (edit marker, add marker)
   - Implements hit testing for accurate interaction detection

### Geometry System

The geometry system handles all spatial calculations:

1. **Line Geometry Calculation**
   - Distributes lines evenly across canvas
   - Handles padding and responsive sizing

2. **Hit Testing**
   - Detects proximity to lines and markers
   - Implements configurable snap thresholds
   - Calculates intersection points

3. **Positioning**
   - Converts between screen coordinates and normalized positions
   - Maintains consistent marker placement during resizing

## Data Model

### Core Entities

1. **Marker**
   - Content element placed on grid lines
   - Rich text content with HTML formatting
   - Metadata (tags, category, color)
   - Positioning information

2. **Timeline**
   - Grid line definition
   - Orientation and index information
   - Visual properties

3. **Project**
   - Container for all editor content
   - Configuration settings
   - Compile slot arrangements

### Relationships

```
Project 1 ↔ * Marker
Project 1 ↔ 1 Config
Project 1 ↔ * CompileSlot
Timeline 1 ↔ * Marker (through lineId)
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**
   - useMemo for expensive calculations (line geometries)
   - useCallback for event handlers
   - React.memo for components

2. **Canvas Optimization**
   - requestAnimationFrame for smooth rendering
   - Efficient drawing operations
   - Proper cleanup of resources

3. **Event Handling**
   - Throttled resize handling
   - Efficient hit testing algorithms
   - Proper event listener management

## Extensibility Points

### Plugin Architecture

The modular design allows for easy extension:

1. **New Component Types**
   - Custom marker types
   - Additional UI panels
   - New editing tools

2. **Rendering Extensions**
   - Custom drawing functions
   - Additional visual elements
   - Animation systems

3. **State Extensions**
   - Additional context providers
   - New state management slices
   - Enhanced business logic

## Technology Stack

### Frontend

- **React** (v18) - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Quill** - Rich text editing
- **Framer Motion** - Animations
- **UUID** - Unique ID generation

### Development Tools

- **ESLint** - Code quality
- **Prettier** - Code formatting
- **Jest** - Testing (planned)
- **Storybook** - Component development (planned)

## Deployment Architecture

### Build Process

1. **TypeScript Compilation**
2. **Bundle Optimization**
3. **Asset Minification**
4. **Static File Generation**

### Hosting

- Static file hosting (Netlify, Vercel, GitHub Pages)
- No server-side requirements
- Client-side routing

## Future Considerations

### Planned Enhancements

1. **Persistence Layer**
   - Local storage integration
   - File export/import
   - Cloud synchronization

2. **Advanced Features**
   - Collaboration support
   - Template system
   - Export formats (PDF, Markdown, etc.)

3. **Performance Improvements**
   - Virtualization for large projects
   - Web Workers for heavy computations
   - Progressive loading