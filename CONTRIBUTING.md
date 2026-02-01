# Contributing to Likhi Lakeerain

Thank you for your interest in contributing to Likhi Lakeerain! This document provides guidelines and information to help make the contribution process smooth and effective.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report any unacceptable behavior to the project maintainers.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/likhi-lakeerain.git`
3. Create a branch for your feature or bug fix: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Commit your changes following our commit message conventions
6. Push to your fork: `git push origin feature/your-feature-name`
7. Create a Pull Request

## Development Setup

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
cd frontend
npm install
```

### Running Development Server

```bash
npm run dev
```

## Code Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Follow the existing code style (enforced by ESLint)
- Write clear, self-documenting code
- Use meaningful variable and function names
- Keep functions small and focused
- Avoid complex nested logic

### React Components

- Use functional components with hooks
- Prefer custom hooks for reusable logic
- Use React.memo for performance optimization when appropriate
- Follow the existing component structure and patterns
- Keep components focused on a single responsibility

### CSS/Tailwind

- Use Tailwind CSS classes for styling
- Follow the existing design system
- Use consistent spacing and color palette
- Prefer utility classes over custom CSS when possible

## Testing

- Write unit tests for new functionality
- Ensure all tests pass before submitting a PR
- Update existing tests when modifying functionality
- Test UI changes across different screen sizes

## Commit Messages

Follow conventional commit format:

```
type(scope): brief description

Detailed description of the changes (optional)

Fixes #123
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, missing semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

## Pull Request Process

1. Ensure your code follows the project standards
2. Update documentation if you've changed functionality
3. Add tests for new features
4. Describe your changes clearly in the PR description
5. Link any related issues
6. Request review from maintainers

## Reporting Issues

When reporting bugs or requesting features:

1. Check if the issue already exists
2. Use a clear and descriptive title
3. Include steps to reproduce for bugs
4. Provide expected vs actual behavior
5. Include screenshots or recordings when relevant
6. Specify your environment (OS, browser, etc.)

## Feature Requests

We welcome feature requests! Please:

1. Explain the problem you're trying to solve
2. Describe your proposed solution
3. Consider alternative approaches
4. Provide use cases and examples

## Questions?

If you have any questions about contributing, feel free to:

- Open an issue for discussion
- Contact the maintainers directly

Thank you for contributing to Likhi Lakeerain!