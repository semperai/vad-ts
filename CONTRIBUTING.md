# Contributing to Voice Activity Detection for Javascript

Thank you for your interest in contributing to this project! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/vad-ts.git`
3. Add upstream remote: `git remote add upstream https://github.com/semperai/vad-ts.git`
4. Create a new branch: `git checkout -b feature/your-feature-name`

## Development Setup

### Prerequisites

- Node.js 22.x or later
- npm (comes with Node.js)

### Installation

```bash
npm install
```

This will install all dependencies for the monorepo and both packages (web and react).

## Project Structure

This is a monorepo containing two packages:

```
vad-ts/
├── packages/
│   ├── web/          # Core VAD implementation for browsers
│   │   ├── src/      # Source code
│   │   ├── tests/    # Test files
│   │   └── dist/     # Build output
│   └── react/        # React hooks wrapper
│       ├── src/      # Source code
│       ├── tests/    # Test files
│       └── dist/     # Build output
├── test-site/        # Demo/test website
└── examples/         # Usage examples
```

## Development Workflow

### Building

Build all packages:
```bash
npm run build
```

Build a specific package:
```bash
npm run build -w @semperai/vad-web
npm run build -w @semperai/vad-react
```

### Running Tests

Run all tests:
```bash
npm test
```

Run tests for a specific package:
```bash
npm test -w @semperai/vad-web
npm test -w @semperai/vad-react
```

Run tests in watch mode:
```bash
npm run test:watch -w @semperai/vad-web
```

### Test Coverage

Generate coverage reports:
```bash
npm run test:coverage
```

Coverage reports are generated in the `coverage/` directory of each package.

### Code Formatting

Format code:
```bash
npm run format
```

Check formatting:
```bash
npm run format-check
```

### Linting

Lint code:
```bash
npm run lint
```

Auto-fix linting issues:
```bash
npm run lint:fix
```

### Type Checking

Run TypeScript type checking:
```bash
npm run typecheck
```

### Development Server

Start the development server with live reload:
```bash
npm run dev
```

## Testing

### Writing Tests

- Place test files in the `tests/` directory of the relevant package
- Use the `.spec.ts` extension for test files
- Follow the existing test structure and patterns
- Aim for high test coverage, especially for new features

Example test structure:
```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../src/your-module'

describe('yourFunction', () => {
  it('should do something specific', () => {
    const result = yourFunction(input)
    expect(result).toBe(expected)
  })
})
```

### Test Guidelines

- Write descriptive test names that explain what is being tested
- Test both success and error cases
- Mock external dependencies appropriately
- Keep tests focused and isolated

## Code Quality

### TypeScript

- This project uses strict TypeScript configuration
- All code must pass type checking without errors
- Avoid using `any` type unless absolutely necessary (use `unknown` instead)
- Use meaningful variable and function names

### Code Style

- Follow the existing code style
- Use Prettier for formatting (runs automatically)
- Use ESLint rules (configured in `.eslintrc.json`)
- Prefer functional programming patterns where appropriate
- Add JSDoc comments for public APIs

### Performance

- Consider performance implications of changes
- Avoid unnecessary re-renders in React components
- Profile performance-critical code paths

## Submitting Changes

### Before Submitting

1. Ensure all tests pass: `npm test`
2. Ensure code is formatted: `npm run format-check`
3. Ensure linting passes: `npm run lint`
4. Ensure type checking passes: `npm run typecheck`
5. Update documentation if needed
6. Add tests for new features

### Pull Request Process

1. Update your branch with the latest upstream changes:
   ```bash
   git fetch upstream
   git rebase upstream/master
   ```

2. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

3. Create a Pull Request on GitHub

4. Fill out the PR template with:
   - Clear description of changes
   - Motivation and context
   - Related issues (if any)
   - Screenshots (for UI changes)
   - Checklist completion

5. Wait for review and address feedback

### PR Guidelines

- Keep PRs focused on a single feature or fix
- Write clear, descriptive commit messages
- Reference related issues using `#issue-number`
- Ensure CI checks pass
- Be responsive to review feedback

## Release Process

Releases are managed by the project maintainers. The process involves:

1. Updating version numbers in `package.json` files
2. Updating CHANGELOG.md
3. Creating a git tag
4. Publishing to npm

Contributors do not need to worry about this process.

## Getting Help

- Check the [documentation](https://docs.vad.ricky0123.com/)
- Join the [Discord](https://discord.gg/4WPeGEaSpF)
- Open an issue for bugs or feature requests
- Reach out to maintainers if you need guidance

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help create a welcoming environment for all contributors

## License

By contributing, you agree that your contributions will be licensed under the ISC License.

## Questions?

If you have questions not covered here, feel free to:
- Open a discussion on GitHub
- Ask in the Discord server
- Reach out to the maintainers

Thank you for contributing! 🎉
