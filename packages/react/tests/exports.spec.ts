import { describe, it, expect } from 'vitest'
import * as ReactVAD from '../src/index'

describe('Package exports', () => {
  describe('Main exports', () => {
    it('should export useMicVAD hook', () => {
      expect(ReactVAD.useMicVAD).toBeDefined()
      expect(typeof ReactVAD.useMicVAD).toBe('function')
    })

    it('should export getDefaultReactRealTimeVADOptions', () => {
      expect(ReactVAD.getDefaultReactRealTimeVADOptions).toBeDefined()
      expect(typeof ReactVAD.getDefaultReactRealTimeVADOptions).toBe('function')
    })

    it('should export utils', () => {
      expect(ReactVAD.utils).toBeDefined()
      expect(typeof ReactVAD.utils).toBe('object')
    })
  })

  describe('Type exports', () => {
    it('should be able to use ReactRealTimeVADOptions type', () => {
      // This test verifies the type is exported by attempting to use it
      // TypeScript will catch if the type is not exported
      const options: ReactVAD.ReactRealTimeVADOptions =
        ReactVAD.getDefaultReactRealTimeVADOptions('v5')

      expect(options).toBeDefined()
      expect(options.userSpeakingThreshold).toBeDefined()
    })
  })

  describe('Default options', () => {
    it('should return valid options for v5 model', () => {
      const options = ReactVAD.getDefaultReactRealTimeVADOptions('v5')

      expect(options.model).toBe('v5')
      expect(options.userSpeakingThreshold).toBe(0.6)
      expect(options.positiveSpeechThreshold).toBeDefined()
      expect(options.negativeSpeechThreshold).toBeDefined()
    })

    it('should return valid options for legacy model', () => {
      const options = ReactVAD.getDefaultReactRealTimeVADOptions('legacy')

      expect(options.model).toBe('legacy')
      expect(options.userSpeakingThreshold).toBe(0.6)
      expect(options.positiveSpeechThreshold).toBeDefined()
      expect(options.negativeSpeechThreshold).toBeDefined()
    })

    it('should include all required callbacks in default options', () => {
      const options = ReactVAD.getDefaultReactRealTimeVADOptions('v5')

      expect(typeof options.onFrameProcessed).toBe('function')
      expect(typeof options.onSpeechEnd).toBe('function')
      expect(typeof options.onSpeechStart).toBe('function')
      expect(typeof options.onSpeechRealStart).toBe('function')
      expect(typeof options.onVADMisfire).toBe('function')
    })

    it('should include stream management functions in default options', () => {
      const options = ReactVAD.getDefaultReactRealTimeVADOptions('v5')

      expect(typeof options.getStream).toBe('function')
      expect(typeof options.pauseStream).toBe('function')
      expect(typeof options.resumeStream).toBe('function')
    })
  })
})
