# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive test suite for React package with 14 tests covering useMicVAD hook
- Additional test coverage for web package (messages, asset-path, model fetcher, real-time VAD)
- ESLint configuration with TypeScript support for code quality enforcement
- CONTRIBUTING.md with detailed development guidelines
- CHANGELOG.md for tracking project changes
- Coverage workflow for both web and react packages in CI
- Performance tracking utilities (VADPerformanceTracker, PerformanceTimer)
- Validation utilities for browser compatibility and audio constraints
- Configurable logging system with log levels
- Test infrastructure using vitest with coverage reporting

### Changed
- Updated test:coverage script to run for all workspaces
- Improved React hook to properly handle device changes
- Updated ESLint and TypeScript configurations for stricter type checking

### Removed
- Dead code and commented-out functions from React package
- Console.log statements from React package for cleaner production code

### Fixed
- Coverage workflow now properly tests both packages
- React package properly recreates VAD instance when getStream changes

## [0.0.28] - 2024-XX-XX

### Added
- Export new public APIs for validation, logging, and performance tracking
- TypeScript improvements with stricter type checking
- Exported `ort` from real-time-vad for advanced usage

### Fixed
- Start on load mic permissions handling

## [0.0.27] - Earlier

Previous versions tracked in git history. See [github.com/ricky0123/vad](https://github.com/ricky0123/vad) for details.

---

## Types of Changes

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities
