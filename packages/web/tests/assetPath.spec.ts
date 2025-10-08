import { describe, it, expect } from 'vitest'
import { baseAssetPath } from '../src/asset-path'

describe('asset-path', () => {
  describe('baseAssetPath', () => {
    it('should be defined', () => {
      expect(baseAssetPath).toBeDefined()
    })

    it('should be a string', () => {
      expect(typeof baseAssetPath).toBe('string')
    })

    it('should contain a valid path or URL pattern', () => {
      // Should be either a relative path or a URL
      const isRelativePath = !baseAssetPath.includes('://')
      const isURL = baseAssetPath.startsWith('http') || baseAssetPath.startsWith('//')

      expect(isRelativePath || isURL).toBe(true)
    })
  })
})
