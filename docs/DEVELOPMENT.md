# Development Setup Guide

This guide will help you set up a development environment for Likhi Lakeerain.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js) or **yarn**
- **Git** for version control
- **Code Editor** (VS Code recommended)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/likhi-lakeerain.git
cd likhi-lakeerain
```

### 2. Install Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

Or if you're using yarn:

```bash
cd frontend
yarn install
```

### 3. Start the Development Server

```bash
npm run dev
```

Or with yarn:

```bash
yarn dev
```

The application will be available at `http://localhost:5173` (or another port if 5173 is in use).

## Project Structure

```
frontend/
├── src/
│   ├── components/       # React components
│   │   ├── Canvas/       # Canvas rendering and interaction
│   │   ├── Compile/      # Compile drawer components
│   │   ├── Layout/       # Header, sidebar layout components
│   │   ├── Marker/       # Marker editing components
│   │   └── Settings/     # Configuration components
│   ├── context/          # React context providers
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── services/         # External service integrations
├── public/               # Static assets
├── docs/                 # Documentation files
└── ...
```

## Development Workflow

### Running Tests

```bash
npm run test
```

Or in watch mode:

```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
```

### Linting

Check for code style issues:

```bash
npm run lint
```

Fix auto-fixable issues:

```bash
npm run lint:fix
```

### Preview Production Build

```bash
npm run preview
```

## Code Organization

### Components

Components are organized by feature/domain:

- **Canvas Components**: Handle the main grid visualization and interaction
- **Layout Components**: Provide the overall application structure
- **Feature Components**: Implement specific functionality (Marker, Compile, Settings)

### State Management

The application uses React Context for state management:

- **EditorContext**: Central state management for the entire application
- Custom hooks encapsulate complex logic and state interactions

### TypeScript

The project uses TypeScript for type safety. All new code should be written in TypeScript.

### Styling

The project uses Tailwind CSS for styling. Utility classes should be preferred over custom CSS.

## Development Tools

### Recommended VS Code Extensions

- **ES7+ React/Redux/React-Native snippets**
- **ESLint**
- **Prettier - Code formatter**
- **Tailwind CSS IntelliSense**
- **TypeScript Importer**
- **GitLens**

### Debugging

1. Use browser developer tools for runtime debugging
2. Use console.log statements for quick debugging
3. Use React DevTools for component inspection
4. Use Redux DevTools if state management becomes complex

## Contributing

Please read our [CONTRIBUTING.md](../CONTRIBUTING.md) guide before making contributions.

### Git Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Commit your changes: `git commit -am 'Add some feature'`
5. Push to the branch: `git push origin feature/your-feature-name`
6. Create a new Pull Request

## Environment Variables

Create a `.env` file in the frontend directory for environment-specific configuration:

```env
# Development API endpoint (if applicable)
VITE_API_URL=http://localhost:3000

# Feature flags
VITE_ENABLE_EXPERIMENTAL_FEATURES=false
```

## Troubleshooting

### Common Issues

#### Dependency Installation Failures

If you encounter issues during `npm install`:

```bash
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Development Server Won't Start

1. Check if the port is already in use
2. Ensure all dependencies are installed
3. Check the terminal for error messages

#### Type Errors

1. Ensure you're using the correct TypeScript version
2. Check that all types are properly defined
3. Run `npm run lint` to see detailed error information

#### Styling Issues

1. Verify Tailwind CSS is properly configured
2. Check that class names are correctly spelled
3. Ensure Tailwind is processing your files

### Getting Help

If you're still having issues:

1. Check the project's issue tracker
2. Search Stack Overflow for similar issues
3. Contact the maintainers

## Architecture Notes

### Canvas Implementation

The canvas implementation uses:

- **HTML5 Canvas API** for rendering
- **requestAnimationFrame** for smooth updates
- **Custom hit testing** for precise interactions
- **Device pixel ratio handling** for sharp rendering

### Performance Considerations

- Use React.memo for components that render frequently
- Memoize expensive calculations with useMemo
- Use useCallback for event handlers passed to child components
- Clean up event listeners and animation frames in useEffect

### Testing Strategy

- Unit tests for utility functions and helpers
- Component tests for UI components
- Integration tests for complex workflows
- End-to-end tests for critical user paths

## Release Process

(For maintainers only)

1. Update version in package.json
2. Update CHANGELOG.md
3. Create a git tag
4. Build and deploy

## Additional Resources

- [React Documentation](https://reactjs.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Vite Documentation](https://vitejs.dev/)