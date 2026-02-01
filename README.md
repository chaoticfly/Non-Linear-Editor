# Likhi Lakeerain - Non-Linear Editor

A visual non-linear editor for organizing thoughts, ideas, and content using a grid-based timeline system.

## Overview

Likhi Lakeerain (which translates to "Written Lines" in Urdu) is a unique non-linear editor that allows users to create and organize content using a grid of horizontal and vertical timelines. Unlike traditional linear editors, this tool enables users to place markers anywhere on intersecting lines, making it ideal for mind mapping, storyboarding, project planning, and other non-linear content creation tasks.

## Features

- **Grid-based Timeline System**: Create customizable grids with horizontal and vertical lines
- **Interactive Canvas**: Click anywhere on a line to place markers
- **Rich Text Editing**: Edit marker content with a rich text editor
- **Visual Organization**: Color-code markers and organize them into categories
- **Tagging System**: Tag markers for easy filtering and organization
- **Compile Mode**: Arrange markers in a specific order for final output
- **Project Management**: Save and load projects
- **Responsive Design**: Adapts to different screen sizes

## Architecture

The application is built with a modern React/TypeScript frontend using:

- **React** with hooks for UI components
- **Canvas API** for high-performance rendering of the grid and markers
- **Context API** for state management
- **Tailwind CSS** for styling
- **Vite** for fast development and building

### Core Components

1. **TimelineCanvas**: The main canvas component that renders the grid and handles user interactions
2. **EditorContext**: Central state management for the entire application
3. **Marker System**: Interactive elements placed on the grid lines
4. **Compile Drawer**: Interface for organizing markers in a specific order

### Data Model

- **Markers**: Content elements placed on grid lines with rich text, tags, and metadata
- **Timelines**: Horizontal and vertical lines that form the grid structure
- **Projects**: Collections of markers, configuration, and compile slots

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Usage

1. **Create a Grid**: Configure the number of horizontal and vertical lines in the settings
2. **Add Markers**: Click on any line to place a marker
3. **Edit Content**: Click on a marker to open the editor and add content
4. **Organize**: Use tags, colors, and categories to organize your markers
5. **Compile**: Use the compile drawer to arrange markers in a specific order for output

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── Canvas/       # Canvas rendering and interaction
│   │   ├── Compile/      # Compile drawer components
│   │   ├── Layout/       # Header, sidebar layout components
│   │   ├── Marker/       # Marker editing components
│   │   └── Settings/     # Configuration components
│   ├── context/          # React context for state management
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── services/         # External service integrations
├── public/               # Static assets
└── ...
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.