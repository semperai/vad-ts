import { describe, it, expect } from 'vitest'
import { NonRealTimeVAD, defaultNonRealTimeVADOptions } from '../src/non-real-time-vad'

describe('NonRealTimeVAD', () => {

  describe('exports', () => {
    it('should export NonRealTimeVAD class', () => {
      expect(NonRealTimeVAD).toBeDefined()
      expect(typeof NonRealTimeVAD).toBe('function')
    })

    it('should be a constructor', () => {
      expect(NonRealTimeVAD.prototype).toBeDefined()
      expect(NonRealTimeVAD.prototype.constructor).toBe(NonRealTimeVAD)
    })

    it('should export defaultNonRealTimeVADOptions', () => {
      expect(defaultNonRealTimeVADOptions).toBeDefined()
      expect(defaultNonRealTimeVADOptions).toHaveProperty('modelURL')
      expect(defaultNonRealTimeVADOptions).toHaveProperty('modelFetcher')
    })
  })
})
