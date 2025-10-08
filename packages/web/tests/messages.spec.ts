import { describe, it, expect } from 'vitest'
import { Message } from '../src/messages'

describe('Message', () => {
  describe('Message enum', () => {
    it('should have AudioFrame message type', () => {
      expect(Message.AudioFrame).toBeDefined()
      expect(typeof Message.AudioFrame).toBe('string')
    })

    it('should have SpeechEnd message type', () => {
      expect(Message.SpeechEnd).toBeDefined()
      expect(typeof Message.SpeechEnd).toBe('string')
    })

    it('should have SpeechStart message type', () => {
      expect(Message.SpeechStart).toBeDefined()
      expect(typeof Message.SpeechStart).toBe('string')
    })

    it('should have VADMisfire message type', () => {
      expect(Message.VADMisfire).toBeDefined()
      expect(typeof Message.VADMisfire).toBe('string')
    })

    it('should have unique values for each message type', () => {
      const values = Object.values(Message).filter(v => typeof v === 'string')
      const uniqueValues = new Set(values)
      expect(uniqueValues.size).toBe(values.length)
    })

    it('should have string values', () => {
      const stringValues = Object.values(Message).filter(v => typeof v === 'string')
      expect(stringValues.length).toBeGreaterThan(0)
      stringValues.forEach((value) => {
        expect(typeof value).toBe('string')
      })
    })
  })
})
