import { MicVAD } from "@semperai/vad-web"
import { renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useMicVAD } from "../src/index"

// Mock the MicVAD class
vi.mock("@semperai/vad-web", () => ({
  MicVAD: {
    new: vi.fn(),
  },
  getDefaultRealTimeVADOptions: vi.fn(() => ({
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    redemptionFrames: 8,
    frameSamples: 1536,
    preSpeechPadFrames: 1,
    minSpeechFrames: 3,
    submitUserSpeechOnPause: false,
    baseAssetPath: "",
    onnxWASMBasePath: "",
    model: "v5",
    ortConfig: undefined,
    startOnLoad: false,
    onFrameProcessed: () => {},
    onSpeechEnd: () => {},
    onSpeechStart: () => {},
    onSpeechRealStart: () => {},
    onVADMisfire: () => {},
    getStream: async () => new MediaStream(),
    pauseStream: async () => {},
    resumeStream: async (stream: MediaStream) => stream,
    workletOptions: {},
  })),
  DEFAULT_MODEL: "v5",
  utils: {},
}))

describe("useMicVAD", () => {
  let mockVAD: any

  beforeEach(() => {
    mockVAD = {
      start: vi.fn(),
      pause: vi.fn(),
      destroy: vi.fn(),
    }
    ;(MicVAD.new as any).mockResolvedValue(mockVAD)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it("should initialize with loading state", () => {
    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    expect(result.current.loading).toBe(true)
    expect(result.current.listening).toBe(false)
    expect(result.current.userSpeaking).toBe(false)
    expect(result.current.errored).toBe(false)
  })

  it("should initialize VAD and set loading to false", async () => {
    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(MicVAD.new).toHaveBeenCalled()
  })

  it("should start listening when startOnLoad is true", async () => {
    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
        startOnLoad: true,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockVAD.start).toHaveBeenCalled()
    expect(result.current.listening).toBe(true)
  })

  it("should handle start and pause", async () => {
    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Start listening
    result.current.start()
    await waitFor(() => {
      expect(result.current.listening).toBe(true)
    })
    expect(mockVAD.start).toHaveBeenCalled()

    // Pause listening
    result.current.pause()
    await waitFor(() => {
      expect(result.current.listening).toBe(false)
    })
    expect(mockVAD.pause).toHaveBeenCalled()
  })

  it("should toggle listening state", async () => {
    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Toggle on
    result.current.toggle()
    await waitFor(() => {
      expect(result.current.listening).toBe(true)
    })

    // Toggle off
    result.current.toggle()
    await waitFor(() => {
      expect(result.current.listening).toBe(false)
    })
  })

  it("should handle errors during initialization", async () => {
    const error = new Error("Failed to initialize")
    ;(MicVAD.new as any).mockRejectedValueOnce(error)

    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.errored).toBe("Failed to initialize")
  })

  it("should destroy VAD on unmount", async () => {
    const { result, unmount } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    unmount()

    expect(mockVAD.destroy).toHaveBeenCalled()
  })

  it("should call callbacks through refs", async () => {
    const onSpeechEnd = vi.fn()
    const onSpeechStart = vi.fn()
    const onFrameProcessed = vi.fn()

    let capturedOptions: any
    ;(MicVAD.new as any).mockImplementation((options: any) => {
      capturedOptions = options
      return Promise.resolve(mockVAD)
    })

    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd,
        onSpeechStart,
        onFrameProcessed,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Simulate callbacks being called
    const mockProbs = { isSpeech: 0.7 }
    const mockFrame = new Float32Array(1536)
    capturedOptions.onFrameProcessed(mockProbs, mockFrame)
    expect(onFrameProcessed).toHaveBeenCalledWith(mockProbs, mockFrame)

    capturedOptions.onSpeechStart()
    expect(onSpeechStart).toHaveBeenCalled()

    const mockAudio = new Float32Array(16000)
    capturedOptions.onSpeechEnd(mockAudio)
    expect(onSpeechEnd).toHaveBeenCalledWith(mockAudio)
  })

  it("should update userSpeaking based on speech probability threshold", async () => {
    let capturedOptions: any
    ;(MicVAD.new as any).mockImplementation((options: any) => {
      capturedOptions = options
      return Promise.resolve(mockVAD)
    })

    const { result } = renderHook(() =>
      useMicVAD({
        onSpeechEnd: () => {},
        userSpeakingThreshold: 0.6,
      })
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Speech above threshold
    const mockFrame = new Float32Array(1536)
    capturedOptions.onFrameProcessed({ isSpeech: 0.7 }, mockFrame)

    await waitFor(() => {
      expect(result.current.userSpeaking).toBe(true)
    })

    // Speech below threshold
    capturedOptions.onFrameProcessed({ isSpeech: 0.5 }, mockFrame)

    await waitFor(() => {
      expect(result.current.userSpeaking).toBe(false)
    })
  })

  it("should recreate VAD when getStream changes", async () => {
    // Use named functions so they have different toString() values
    const getStream1 = async function getStream1() {
      return new MediaStream()
    }
    const getStream2 = async function getStream2() {
      return new MediaStream()
    }

    const { result, rerender } = renderHook(
      ({ getStream }) => useMicVAD({ onSpeechEnd: () => {}, getStream }),
      { initialProps: { getStream: getStream1 } }
    )

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(MicVAD.new).toHaveBeenCalledTimes(1)
    expect(mockVAD.destroy).toHaveBeenCalledTimes(0)

    // Reset mock to track new calls
    const firstCallCount = (MicVAD.new as any).mock.calls.length

    // Change getStream
    rerender({ getStream: getStream2 })

    await waitFor(
      () => {
        expect((MicVAD.new as any).mock.calls.length).toBeGreaterThan(
          firstCallCount
        )
      },
      { timeout: 3000 }
    )

    // Should destroy old VAD
    await waitFor(() => {
      expect(mockVAD.destroy).toHaveBeenCalled()
    })
  })
})
