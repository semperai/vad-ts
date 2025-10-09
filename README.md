# Voice Activity Detection for TypeScript

[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue)](https://www.typescriptlang.org/)
[![Build Status](https://img.shields.io/github/actions/workflow/status/semperai/vad-ts/coverage.yml?branch=ts&label=tests)](https://github.com/semperai/vad-ts/actions)
[![Coverage Status](https://coveralls.io/repos/github/semperai/vad-ts/badge.svg?branch=ts)](https://coveralls.io/github/semperai/vad-ts?branch=ts)
[![npm vad-web](https://img.shields.io/npm/v/@semperai/vad-web?color=blue&label=%40semperai%2Fvad-web)](https://www.npmjs.com/package/@semperai/vad-web)
[![npm vad-react](https://img.shields.io/npm/v/@semperai/vad-react?color=blue&label=%40semperai%2Fvad-react)](https://www.npmjs.com/package/@semperai/vad-react)

> Run callbacks on segments of audio with user speech in a few lines of code - now with TypeScript!

This is a TypeScript fork of [@ricky0123/vad](https://github.com/ricky0123/vad), providing an accurate, user-friendly voice activity detector (VAD) that runs in the browser with enhanced type safety, improved developer experience, and comprehensive testing.

## Key Features

✨ **TypeScript-First**: Full type safety with strict TypeScript configuration
🧪 **Comprehensive Testing**: 98.67% coverage for React, 69.78% for web package
🔧 **Developer Experience**: ESLint, Prettier, and automated workflows
📦 **Monorepo Structure**: Clean separation of concerns with workspace support
🎯 **Production Ready**: Extensive validation, error handling, and logging utilities
⚡ **Performance Tracking**: Built-in performance metrics and monitoring

## About This Fork

This fork enhances the original [@ricky0123/vad](https://github.com/ricky0123/vad) project with:

- **TypeScript Migration**: Fully typed codebase with strict type checking
- **Testing Infrastructure**: Comprehensive test suites using Vitest
- **Quality Tools**: ESLint, Prettier, and automated CI/CD workflows
- **Enhanced APIs**: Exported validation, logging, and performance utilities
- **Developer Documentation**: CONTRIBUTING.md and detailed inline documentation

**Credit**: Original project by [@ricky0123](https://github.com/ricky0123). This fork maintains compatibility while adding TypeScript benefits.

## Quick Start

### Browser (Script Tag)

```html
<script src="https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/ort.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@semperai/vad-web@0.0.28/dist/bundle.min.js"></script>
<script>
  async function main() {
    const myvad = await vad.MicVAD.new({
      onSpeechStart: () => {
        console.log("Speech start detected")
      },
      onSpeechEnd: (audio) => {
        // audio is Float32Array of samples at 16kHz
        console.log("Speech ended", audio)
      },
      onnxWASMBasePath: "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.22.0/dist/",
      baseAssetPath: "https://cdn.jsdelivr.net/npm/@semperai/vad-web@0.0.28/dist/",
    })
    myvad.start()
  }
  main()
</script>
```

### React

```tsx
import { useMicVAD } from "@semperai/vad-react"

function MyComponent() {
  const { listening, loading, userSpeaking, start, pause, toggle } = useMicVAD({
    onSpeechStart: () => console.log("User started speaking"),
    onSpeechEnd: (audio) => {
      console.log("User stopped speaking", audio)
    },
    userSpeakingThreshold: 0.6,
  })

  return (
    <div>
      <button onClick={toggle}>
        {listening ? "Pause" : "Start"} VAD
      </button>
      {loading && <p>Loading...</p>}
      {userSpeaking && <p>🎤 Speaking...</p>}
    </div>
  )
}
```

### TypeScript (NPM)

```typescript
import { MicVAD } from "@semperai/vad-web"

async function setupVAD() {
  const vad = await MicVAD.new({
    onSpeechStart: () => {
      console.log("Speech detected")
    },
    onSpeechEnd: (audio: Float32Array) => {
      // Process audio segment
      sendToServer(audio)
    },
    positiveSpeechThreshold: 0.8,
    minSpeechFrames: 3,
    startOnLoad: true,
  })
}
```

## Installation

```bash
# Web package
npm install @semperai/vad-web

# React package
npm install @semperai/vad-react

# Development
git clone https://github.com/semperai/vad-ts
cd vad-ts
npm install
npm run build
npm test
```

## Package Overview

### @semperai/vad-web

Core VAD implementation for browsers:

- `MicVAD`: Real-time microphone input processing
- `AudioNodeVAD`: Process existing AudioNode streams
- `NonRealTimeVAD`: Process pre-recorded audio
- Utilities for audio processing and validation
- Performance tracking and logging

**TypeScript Features**:
- Full type definitions for all APIs
- Exported validation utilities (`validateAudioConstraints`, `checkBrowserCompatibility`)
- Configurable logging system (`configureLogging`, `LogConfig`)
- Performance tracking (`VADPerformanceTracker`, `PerformanceTimer`)

### @semperai/vad-react

React hooks for easy integration:

- `useMicVAD`: Complete React hook for VAD functionality
- `getDefaultReactRealTimeVADOptions`: Get default configuration
- Re-exports all `utils` from `@ricky0123/vad-web`

**React Features**:
- Proper device change handling (recreates VAD when needed)
- Callback refs for stable function references
- `userSpeaking` state based on configurable threshold
- Loading, error, and listening states
- Re-exports all `utils` from `@semperai/vad-web`

## Development

### Project Structure

```
vad-ts/
├── packages/
│   ├── web/           # Core VAD implementation
│   │   ├── src/       # TypeScript source
│   │   └── tests/     # Vitest test suites (170 tests)
│   └── react/         # React hooks
│       ├── src/       # TypeScript source
│       └── tests/     # Vitest test suites (49 tests)
├── test-site/         # Manual testing environment
└── examples/          # Usage examples
```

### Available Commands

```bash
npm run build          # Build all packages
npm test               # Run all tests
npm run test:coverage  # Generate coverage reports
npm run lint           # Lint code
npm run lint:fix       # Auto-fix linting issues
npm run format         # Format code with Prettier
npm run typecheck      # Type check all packages
```

### Testing

**Web Package**: 170 tests, 69.78% coverage
- Frame processor, resampler, utils, validation
- Performance tracking and logging
- Model tests (100% coverage)

**React Package**: 49 tests, 98.67% coverage
- Hook lifecycle and state management
- Error handling and edge cases
- Callback updates and device changes
- Integration and real-world scenarios

### Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:
- Development setup
- Testing requirements
- Code quality standards
- Pull request process

## Configuration Options

<details>
<summary>RealTimeVADOptions (click to expand)</summary>

```typescript
interface RealTimeVADOptions {
  // Speech detection thresholds
  positiveSpeechThreshold: number    // 0-1, default: 0.5
  negativeSpeechThreshold: number    // 0-1, default: 0.35

  // Timing parameters (in milliseconds)
  preSpeechPadMs: number             // Audio before speech, default: 800ms
  redemptionMs: number               // Grace period, default: 1400ms
  minSpeechMs: number                // Min speech length, default: 400ms

  // Callbacks
  onSpeechStart: () => void
  onSpeechEnd: (audio: Float32Array) => void
  onFrameProcessed: (probabilities, frame) => void
  onVADMisfire: () => void
  onSpeechRealStart: () => void

  // Model configuration
  model: "v5" | "legacy"             // VAD model version

  // Stream management
  getStream: () => Promise<MediaStream>
  pauseStream: (stream) => Promise<void>
  resumeStream: (stream) => Promise<MediaStream>

  // Behavior
  startOnLoad: boolean               // Auto-start, default: true
  submitUserSpeechOnPause: boolean   // Default: false

  // Advanced
  logConfig?: Partial<LogConfig>
  enablePerformanceTracking?: boolean
}
```
</details>

<details>
<summary>ReactRealTimeVADOptions (click to expand)</summary>

```typescript
interface ReactRealTimeVADOptions extends RealTimeVADOptions {
  // React-specific threshold for userSpeaking state
  userSpeakingThreshold: number      // 0-1, default: 0.6
}
```
</details>

## How It Works

Under the hood, this package runs [Silero VAD](https://github.com/snakers4/silero-vad) using [ONNX Runtime Web](https://github.com/microsoft/onnxruntime/tree/main/js/web). The package:

1. Captures audio from the microphone via Web Audio API
2. Processes audio in frames using an AudioWorklet
3. Runs the Silero VAD model on each frame to detect speech
4. Applies smoothing and validation logic
5. Triggers callbacks when speech segments are detected

## Browser Support

- Chrome/Edge 88+
- Firefox 89+
- Safari 14.1+

Requires support for:
- Web Audio API
- AudioWorklet
- WebAssembly
- getUserMedia

## Performance

- Lightweight: ~1-2MB total (model + runtime)
- Low latency: <100ms detection time
- Efficient: Runs in AudioWorklet for optimal performance

## Migration from JavaScript

If you're migrating from the original JavaScript version:

1. **Types**: All APIs now have TypeScript definitions
2. **Imports**: Same import paths, but with better autocomplete
3. **New APIs**: Additional exports for validation and logging
4. **React**: Enhanced `useMicVAD` with better device handling

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.

## Links

- **Original Project**: [@ricky0123/vad](https://github.com/ricky0123/vad)
- **Original Demo**: [vad.ricky0123.com](https://www.vad.ricky0123.com)
- **Original Docs**: [docs.vad.ricky0123.com](https://docs.vad.ricky0123.com/)
- **Discord**: [Join the community](https://discord.gg/4WPeGEaSpF)

## License

ISC License - Same as original project

## Credits

**Original Author**: [@ricky0123](https://github.com/ricky0123)
**TypeScript Fork**: Maintained by [@semperai](https://github.com/semperai)
**Silero VAD**: [snakers4/silero-vad](https://github.com/snakers4/silero-vad)
**ONNX Runtime**: [microsoft/onnxruntime](https://github.com/microsoft/onnxruntime)

## References

<a id="1">[1]</a>
Silero Team. (2021).
Silero VAD: pre-trained enterprise-grade Voice Activity Detector (VAD), Number Detector and Language Classifier.
GitHub, GitHub repository, https://github.com/snakers4/silero-vad, hello@silero.ai.
