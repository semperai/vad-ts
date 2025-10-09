import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
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

describe('useMicVAD - Integration Tests', () => {
  let mockVAD: any

  beforeEach(() => {
    mockVAD = {
      start: vi.fn(),
      pause: vi.fn(),
      destroy: vi.fn(),
    }
    ;(MicVAD.new as any).mockResolvedValue(mockVAD)
  })

  describe('Complete speech detection flow', () => {
    it('should handle full speech detection lifecycle', async () => {
      const onSpeechStart = vi.fn()
      const onSpeechEnd = vi.fn()
      const onFrameProcessed = vi.fn()

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechStart,
          onSpeechEnd,
          onFrameProcessed,
          startOnLoad: true,
        })
      )

      // Wait for initialization
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should start automatically
      expect(result.current.listening).toBe(true)
      expect(mockVAD.start).toHaveBeenCalled()

      // Simulate speech detection
      const mockFrame = new Float32Array(1536)

      // Frame with high speech probability
      capturedOptions.onFrameProcessed({ isSpeech: 0.8 }, mockFrame)
      expect(onFrameProcessed).toHaveBeenCalledWith({ isSpeech: 0.8 }, mockFrame)

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })

      // Speech start callback
      capturedOptions.onSpeechStart()
      expect(onSpeechStart).toHaveBeenCalled()

      // Speech end callback
      const mockAudio = new Float32Array(16000)
      capturedOptions.onSpeechEnd(mockAudio)
      expect(onSpeechEnd).toHaveBeenCalledWith(mockAudio)

      // Frame with low speech probability
      capturedOptions.onFrameProcessed({ isSpeech: 0.3 }, mockFrame)

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(false)
      })
    })

    it('should handle VAD misfire', async () => {
      const onVADMisfire = vi.fn()

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
          onVADMisfire,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      capturedOptions.onVADMisfire()

      expect(onVADMisfire).toHaveBeenCalled()
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle user starting, speaking, and stopping', async () => {
      const onSpeechStart = vi.fn()
      const onSpeechEnd = vi.fn()
      const speechSegments: Float32Array[] = []

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechStart,
          onSpeechEnd: (audio) => {
            speechSegments.push(audio)
            onSpeechEnd(audio)
          },
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // User starts recording
      result.current.start()
      await waitFor(() => expect(result.current.listening).toBe(true))

      // User speaks (multiple frames)
      const mockFrame = new Float32Array(1536)
      for (let i = 0; i < 10; i++) {
        capturedOptions.onFrameProcessed({ isSpeech: 0.85 }, mockFrame)
      }

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })

      capturedOptions.onSpeechStart()
      expect(onSpeechStart).toHaveBeenCalledTimes(1)

      // Speech ends
      const audio1 = new Float32Array(16000)
      capturedOptions.onSpeechEnd(audio1)

      // User speaks again
      for (let i = 0; i < 10; i++) {
        capturedOptions.onFrameProcessed({ isSpeech: 0.9 }, mockFrame)
      }

      capturedOptions.onSpeechStart()
      expect(onSpeechStart).toHaveBeenCalledTimes(2)

      const audio2 = new Float32Array(16000)
      capturedOptions.onSpeechEnd(audio2)

      // User stops recording
      result.current.pause()
      await waitFor(() => expect(result.current.listening).toBe(false))

      // Should have collected 2 speech segments
      expect(speechSegments).toHaveLength(2)
      expect(onSpeechEnd).toHaveBeenCalledTimes(2)
    })

    it('should handle continuous operation with callback updates', async () => {
      const callbacks = {
        onSpeechEnd: vi.fn(),
      }

      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result, rerender } = renderHook(
        ({ onSpeechEnd }) => useMicVAD({ onSpeechEnd }),
        { initialProps: { onSpeechEnd: callbacks.onSpeechEnd } }
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      result.current.start()
      await waitFor(() => expect(result.current.listening).toBe(true))

      // First callback
      const audio1 = new Float32Array(16000)
      capturedOptions.onSpeechEnd(audio1)
      expect(callbacks.onSpeechEnd).toHaveBeenCalledTimes(1)
      expect(callbacks.onSpeechEnd).toHaveBeenCalledWith(audio1)

      // Update callback
      const newOnSpeechEnd = vi.fn()
      rerender({ onSpeechEnd: newOnSpeechEnd })

      // New callback should be used
      const audio2 = new Float32Array(16000)
      capturedOptions.onSpeechEnd(audio2)
      expect(newOnSpeechEnd).toHaveBeenCalledTimes(1)
      expect(newOnSpeechEnd).toHaveBeenCalledWith(audio2)
      expect(callbacks.onSpeechEnd).toHaveBeenCalledTimes(1) // Still 1, not called again
    })
  })

  describe('Edge cases', () => {
    it('should handle extremely high userSpeakingThreshold', async () => {
      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
          userSpeakingThreshold: 0.99,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Even high probability shouldn't trigger
      capturedOptions.onFrameProcessed({ isSpeech: 0.95 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(false)
      })

      // Only very high values should trigger
      capturedOptions.onFrameProcessed({ isSpeech: 0.995 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })
    })

    it('should handle extremely low userSpeakingThreshold', async () => {
      let capturedOptions: any

      ;(MicVAD.new as any).mockImplementation((options: any) => {
        capturedOptions = options
        return Promise.resolve(mockVAD)
      })

      const { result } = renderHook(() =>
        useMicVAD({
          onSpeechEnd: () => {},
          userSpeakingThreshold: 0.1,
        })
      )

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Even low probability should trigger
      capturedOptions.onFrameProcessed({ isSpeech: 0.15 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })
    })

    it('should handle boundary value at exact threshold', async () => {
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

      // Exactly at threshold should not trigger (needs to be greater)
      capturedOptions.onFrameProcessed({ isSpeech: 0.6 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(false)
      })

      // Just above threshold should trigger
      capturedOptions.onFrameProcessed({ isSpeech: 0.601 }, new Float32Array(1536))

      await waitFor(() => {
        expect(result.current.userSpeaking).toBe(true)
      })
    })
  })
})
