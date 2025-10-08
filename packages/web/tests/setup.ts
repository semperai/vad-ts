// Mock ONNX Runtime
class MockTensor {
  constructor(public type: string, public data: any, public dims?: number[]) {}
}

class MockInferenceSession {
  async run(_inputs: any) {
    // Mock the inference results that the VAD models expect
    return {
      output: { data: [0.5] }, // Mock speech probability
      hn: new MockTensor("float32", Array(2 * 64).fill(0), [2, 1, 64]), // For legacy model
      cn: new MockTensor("float32", Array(2 * 64).fill(0), [2, 1, 64]), // For legacy model
      stateN: new MockTensor("float32", Array(2 * 128).fill(0), [2, 1, 128]), // For v5 model
    }
  }
}

const mockOrt = {
  Tensor: MockTensor,
  InferenceSession: {
    create: vi.fn(() => Promise.resolve(new MockInferenceSession())),
  },
  env: {
    wasm: {
      wasmPaths: "",
    },
  },
}

// Mock the onnxruntime-web module
vi.mock("onnxruntime-web", () => mockOrt)

// Mock Web Audio API
class MockAudioContext {
  state = "running"
  sampleRate = 16000
  currentTime = 0
  destination = {
    connect: vi.fn(),
    disconnect: vi.fn(),
  }

  // Add audioWorklet mock
  audioWorklet = {
    addModule: vi.fn(() => Promise.resolve()),
  }

  createMediaStreamSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
  }))

  createScriptProcessor = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    onaudioprocess: null,
  }))

  createAnalyser = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    frequencyBinCount: 1024,
    getFloatFrequencyData: vi.fn(),
    getFloatTimeDomainData: vi.fn(),
  }))

  createGain = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    gain: { value: 1 },
  }))

  createOscillator = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    frequency: { value: 440 },
  }))

  createBuffer = vi.fn(
    (channels: number, length: number, sampleRate: number) => ({
      numberOfChannels: channels,
      length,
      sampleRate,
      getChannelData: vi.fn(() => new Float32Array(length)),
    })
  )

  createBufferSource = vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    buffer: null,
  }))

  resume = vi.fn(() => Promise.resolve())
  suspend = vi.fn(() => Promise.resolve())
  close = vi.fn(() => Promise.resolve())
}

class MockAudioWorkletNode {
  port = {
    postMessage: vi.fn(),
    onmessage: null,
  }
  connect = vi.fn()
  disconnect = vi.fn()
  onprocessorerror = null

  constructor(_context: any, _name: string, _options?: any) {
    // Mock constructor behavior
  }
}

// Add MediaStreamAudioSourceNode mock
class MockMediaStreamAudioSourceNode {
  connect = vi.fn()
  disconnect = vi.fn()
  mediaStream: MediaStream

  constructor(_context: any, options: { mediaStream: MediaStream }) {
    this.mediaStream = options.mediaStream
  }
}

class MockMediaDevices {
  getUserMedia = vi.fn(() =>
    Promise.resolve({
      getTracks: vi.fn(() => []),
      getAudioTracks: vi.fn(() => []),
      getVideoTracks: vi.fn(() => []),
      addTrack: vi.fn(),
      removeTrack: vi.fn(),
      active: true, // Add active property for stream state checking
    })
  )
}

class MockMediaStream {
  getTracks = vi.fn(() => [])
  getAudioTracks = vi.fn(() => [])
  getVideoTracks = vi.fn(() => [])
  addTrack = vi.fn()
  removeTrack = vi.fn()
  active = true // Add active property for stream state checking
}

// Mock navigator.mediaDevices
Object.defineProperty(global, "navigator", {
  value: {
    mediaDevices: new MockMediaDevices(),
  },
  writable: true,
})

// Mock AudioContext
Object.defineProperty(global, "AudioContext", {
  value: MockAudioContext,
  writable: true,
})

Object.defineProperty(global, "webkitAudioContext", {
  value: MockAudioContext,
  writable: true,
})

// Mock AudioWorkletNode
Object.defineProperty(global, "AudioWorkletNode", {
  value: MockAudioWorkletNode,
  writable: true,
})

// Mock MediaStreamAudioSourceNode
Object.defineProperty(global, "MediaStreamAudioSourceNode", {
  value: MockMediaStreamAudioSourceNode,
  writable: true,
})

// Mock MediaStream
Object.defineProperty(global, "MediaStream", {
  value: MockMediaStream,
  writable: true,
})

// Mock URL.createObjectURL
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: vi.fn(() => "blob:mock-url"),
    revokeObjectURL: vi.fn(),
  },
  writable: true,
})

// Mock fetch for model loading
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
  })
) as vi.Mock

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock window.location for URL validation
Object.defineProperty(global, "window", {
  value: {
    location: {
      origin: "http://localhost",
      href: "http://localhost/",
      protocol: "http:",
      host: "localhost",
      hostname: "localhost",
      port: "",
      pathname: "/",
      search: "",
      hash: "",
    },
  },
  writable: true,
})
