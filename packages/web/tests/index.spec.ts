import { describe, it, expect } from 'vitest'
import * as vadWeb from '../src/index'

describe('Package exports', () => {
  describe('Core VAD exports', () => {
    it('should export MicVAD', () => {
      expect(vadWeb.MicVAD).toBeDefined()
    })

    it('should export AudioNodeVAD', () => {
      expect(vadWeb.AudioNodeVAD).toBeDefined()
    })

    it('should export NonRealTimeVAD', () => {
      expect(vadWeb.NonRealTimeVAD).toBeDefined()
      expect(typeof vadWeb.NonRealTimeVAD).toBe('function')
    })

    it('should export getDefaultRealTimeVADOptions', () => {
      expect(vadWeb.getDefaultRealTimeVADOptions).toBeDefined()
      expect(typeof vadWeb.getDefaultRealTimeVADOptions).toBe('function')
    })

    it('should export DEFAULT_MODEL', () => {
      expect(vadWeb.DEFAULT_MODEL).toBeDefined()
      expect(typeof vadWeb.DEFAULT_MODEL).toBe('string')
    })

    it('should export ort', () => {
      expect(vadWeb.ort).toBeDefined()
    })
  })

  describe('Utility exports', () => {
    it('should export utils object', () => {
      expect(vadWeb.utils).toBeDefined()
      expect(typeof vadWeb.utils).toBe('object')
    })

    it('should export utils.minFramesForTargetMS', () => {
      expect(vadWeb.utils.minFramesForTargetMS).toBeDefined()
      expect(typeof vadWeb.utils.minFramesForTargetMS).toBe('function')
    })

    it('should export utils.arrayBufferToBase64', () => {
      expect(vadWeb.utils.arrayBufferToBase64).toBeDefined()
      expect(typeof vadWeb.utils.arrayBufferToBase64).toBe('function')
    })

    it('should export utils.encodeWAV', () => {
      expect(vadWeb.utils.encodeWAV).toBeDefined()
      expect(typeof vadWeb.utils.encodeWAV).toBe('function')
    })

    it('should export utils.audioFileToArray', () => {
      expect(vadWeb.utils.audioFileToArray).toBeDefined()
      expect(typeof vadWeb.utils.audioFileToArray).toBe('function')
    })

    it('should export baseAssetPath', () => {
      expect(vadWeb.baseAssetPath).toBeDefined()
      expect(typeof vadWeb.baseAssetPath).toBe('string')
    })

    it('should export defaultModelFetcher', () => {
      expect(vadWeb.defaultModelFetcher).toBeDefined()
      expect(typeof vadWeb.defaultModelFetcher).toBe('function')
    })

    it('should export FrameProcessor', () => {
      expect(vadWeb.FrameProcessor).toBeDefined()
      expect(typeof vadWeb.FrameProcessor).toBe('function')
    })

    it('should export Message enum', () => {
      expect(vadWeb.Message).toBeDefined()
      expect(typeof vadWeb.Message).toBe('object')
    })
  })

  describe('Validation exports', () => {
    it('should export validateAudioConstraints', () => {
      expect(vadWeb.validateAudioConstraints).toBeDefined()
      expect(typeof vadWeb.validateAudioConstraints).toBe('function')
    })

    it('should export checkUserMediaSupport', () => {
      expect(vadWeb.checkUserMediaSupport).toBeDefined()
      expect(typeof vadWeb.checkUserMediaSupport).toBe('function')
    })

    it('should export checkBrowserCompatibility', () => {
      expect(vadWeb.checkBrowserCompatibility).toBeDefined()
      expect(typeof vadWeb.checkBrowserCompatibility).toBe('function')
    })

    it('should export error classes', () => {
      expect(vadWeb.VADError).toBeDefined()
      expect(vadWeb.AudioConstraintsError).toBeDefined()
      expect(vadWeb.ModelLoadError).toBeDefined()
      expect(vadWeb.WorkletLoadError).toBeDefined()
      expect(vadWeb.AudioContextError).toBeDefined()
    })
  })

  describe('Logging exports', () => {
    it('should export configureLogging', () => {
      expect(vadWeb.configureLogging).toBeDefined()
      expect(typeof vadWeb.configureLogging).toBe('function')
    })

    it('should export getLoggingConfig', () => {
      expect(vadWeb.getLoggingConfig).toBeDefined()
      expect(typeof vadWeb.getLoggingConfig).toBe('function')
    })
  })

  describe('Performance exports', () => {
    it('should export VADPerformanceTracker', () => {
      expect(vadWeb.VADPerformanceTracker).toBeDefined()
      expect(typeof vadWeb.VADPerformanceTracker).toBe('function')
    })

    it('should export PerformanceTimer', () => {
      expect(vadWeb.PerformanceTimer).toBeDefined()
      expect(typeof vadWeb.PerformanceTimer).toBe('function')
    })
  })
})
