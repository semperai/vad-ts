import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useMicVAD } from '../src/index'
import { MicVAD } from '@ricky0123/vad-web'

vi.mock('@ricky0123/vad-web', () => ({
  MicVAD: {
    new: vi.fn(),
  },
  getDefaultRealTimeVADOptions: vi.fn(() => ({
    positiveSpeechThreshold: 0.5,
    negativeSpeechThreshold: 0.35,
    redemptionMs: 1400,
    frameSamples: 1536,
    preSpeechPadMs: 800,
    minSpeechMs: 400,
    submitUserSpeechOnPause: false,
    baseAssetPath: '',
    onnxWASMBasePath: '',
    model: 'v5',
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
  DEFAULT_MODEL: 'v5',
  utils: {},
}))

describe('useMicVAD - Advanced Tests', () => {
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

  describe('Error handling', () => {
    it('should handle non-Error exceptions', async () => {
      ;(MicVAD.new as any).mockRejectedValueOnce('String error')

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.errored).toBe('String error')
    })

    it('should handle errors with specific error messages', async () => {
      const customError = new Error('Custom initialization error')
      ;(MicVAD.new as any).mockRejectedValueOnce(customError)

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.errored).toBe('Custom initialization error')
    })

    it('should not allow start when errored', async () => {
      ;(MicVAD.new as any).mockRejectedValueOnce(new Error('Init failed'))

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.errored).toBe('Init failed')
      })

      result.current.start()

      // Should not change state
      expect(result.current.listening).toBe(false)
      expect(mockVAD.start).not.toHaveBeenCalled()
    })

    it('should not allow pause when errored', async () => {
      ;(MicVAD.new as any).mockRejectedValueOnce(new Error('Init failed'))

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.errored).toBe('Init failed')
      })

      result.current.pause()

      expect(mockVAD.pause).not.toHaveBeenCalled()
    })

    it('should not allow toggle when errored', async () => {
      ;(MicVAD.new as any).mockRejectedValueOnce(new Error('Init failed'))

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.errored).toBe('Init failed')
      })

      result.current.toggle()

      expect(result.current.listening).toBe(false)
      expect(mockVAD.start).not.toHaveBeenCalled()
    })
  })

  describe('State management', () => {
    it('should not allow start when loading', async () => {
      let resolveVAD: any
      const vadPromise = new Promise((resolve) => {
        resolveVAD = resolve
      })
      ;(MicVAD.new as any).mockReturnValue(vadPromise)

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      expect(result.current.loading).toBe(true)

      result.current.start()

      // Should not change state while loading
      expect(mockVAD.start).not.toHaveBeenCalled()

      resolveVAD(mockVAD)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should not allow pause when loading', async () => {
      let resolveVAD: any
      const vadPromise = new Promise((resolve) => {
        resolveVAD = resolve
      })
      ;(MicVAD.new as any).mockReturnValue(vadPromise)

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      expect(result.current.loading).toBe(true)

      result.current.pause()

      expect(mockVAD.pause).not.toHaveBeenCalled()

      resolveVAD(mockVAD)

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })
    })

    it('should handle rapid toggle calls', async () => {
      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Rapid toggle
      result.current.toggle()
      result.current.toggle()
      result.current.toggle()

      await waitFor(() => {
        expect(result.current.listening).toBe(true)
      })
    })
  })

  describe('Callback updates', () => {
    it('should call updated onSpeechStart callback', async () => {
      const onSpeechStart1 = vi.fn()
      const onSpeechStart2 = vi.fn()

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result, rerender } = renderHook(
        ({ onSpeechStart }) => useMicVAD({ onSpeechEnd: () => {}, onSpeechStart }),
        { initialProps: { onSpeechStart: onSpeechStart1 } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Update callback
      rerender({ onSpeechStart: onSpeechStart2 })

      // Trigger callback
      capturedOptions.onSpeechStart()

      // Should call the updated callback
      expect(onSpeechStart1).not.toHaveBeenCalled()
      expect(onSpeechStart2).toHaveBeenCalled()
    })

    it('should call updated onSpeechRealStart callback', async () => {
      const onSpeechRealStart1 = vi.fn()
      const onSpeechRealStart2 = vi.fn()

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result, rerender } = renderHook(
        ({ onSpeechRealStart }) =>
          useMicVAD({ onSpeechEnd: () => {}, onSpeechRealStart }),
        { initialProps: { onSpeechRealStart: onSpeechRealStart1 } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      rerender({ onSpeechRealStart: onSpeechRealStart2 })

      capturedOptions.onSpeechRealStart()

      expect(onSpeechRealStart1).not.toHaveBeenCalled()
      expect(onSpeechRealStart2).toHaveBeenCalled()
    })

    it('should call updated onVADMisfire callback', async () => {
      const onVADMisfire1 = vi.fn()
      const onVADMisfire2 = vi.fn()

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result, rerender } = renderHook(
        ({ onVADMisfire }) => useMicVAD({ onSpeechEnd: () => {}, onVADMisfire }),
        { initialProps: { onVADMisfire: onVADMisfire1 } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      rerender({ onVADMisfire: onVADMisfire2 })

      capturedOptions.onVADMisfire()

      expect(onVADMisfire1).not.toHaveBeenCalled()
      expect(onVADMisfire2).toHaveBeenCalled()
    })
  })

  describe('Model switching', () => {
    it('should recreate VAD when model changes', async () => {
      const { result, rerender } = renderHook(
        ({ model }) => useMicVAD({ onSpeechEnd: () => {}, model }),
        { initialProps: { model: 'v5' as const } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(MicVAD.new).toHaveBeenCalledTimes(1)

      // Change model
      rerender({ model: 'legacy' as const })

      await waitFor(() => {
        expect(MicVAD.new).toHaveBeenCalledTimes(2)
      })

      // Should destroy old VAD
      expect(mockVAD.destroy).toHaveBeenCalled()
    })
  })

  describe('Cleanup', () => {
    it('should destroy VAD when component unmounts during loading', async () => {
      let resolveVAD: any
      const vadPromise = new Promise((resolve) => {
        resolveVAD = resolve
      })
      ;(MicVAD.new as any).mockReturnValue(vadPromise)

      const { unmount } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      // Unmount while still loading
      unmount()

      // Now resolve
      resolveVAD(mockVAD)

      // Give it time to process
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Should destroy because canceled flag was set
      expect(mockVAD.destroy).toHaveBeenCalled()
    })

    it('should not set listening to false on unmount if already errored', async () => {
      ;(MicVAD.new as any).mockRejectedValueOnce(new Error('Init failed'))

      const { result, unmount } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.errored).toBe('Init failed')
      })

      const listeningBefore = result.current.listening

      unmount()

      // Listening state should not change since we're errored
      expect(listeningBefore).toBe(false)
    })
  })

  describe('Options merging', () => {
    it('should merge user options with defaults', async () => {
      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const customThreshold = 0.8
      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
          userSpeakingThreshold: customThreshold,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Trigger frame processed
      capturedOptions.onFrameProcessed({ isSpeech: 0.75 }, new Float32Array(1536))

      // With threshold 0.8, speech at 0.75 should not be speaking
      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(false)
      })

      // Speech at 0.85 should be speaking
      capturedOptions.onFrameProcessed({ isSpeech: 0.85 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })
    })

    it('should use default userSpeakingThreshold when not provided', async () => {
      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Default threshold is 0.6
      // Speech at 0.65 should be speaking
      capturedOptions.onFrameProcessed({ isSpeech: 0.65 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })

      // Speech at 0.55 should not be speaking
      capturedOptions.onFrameProcessed({ isSpeech: 0.55 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(false)
      })
    })
  })

  describe('Multiple pause/start cycles', () => {
    it('should handle multiple pause/start cycles correctly', async () => {
      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Cycle 1
      result.current.start()
      await waitFor(() => expect(result.current.listening).toBe(true))
      expect(mockVAD.start).toHaveBeenCalledTimes(1)

      result.current.pause()
      await waitFor(() => expect(result.current.listening).toBe(false))
      expect(mockVAD.pause).toHaveBeenCalledTimes(1)

      // Cycle 2
      result.current.start()
      await waitFor(() => expect(result.current.listening).toBe(true))
      expect(mockVAD.start).toHaveBeenCalledTimes(2)

      result.current.pause()
      await waitFor(() => expect(result.current.listening).toBe(false))
      expect(mockVAD.pause).toHaveBeenCalledTimes(2)
    })
  })
})
