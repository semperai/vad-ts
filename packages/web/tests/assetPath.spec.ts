import { afterEach, beforeEach, describe, expect, it } from "vitest"

describe("asset-path", () => {
  let originalWindow: any
  let originalDocument: any

  beforeEach(() => {
    // Save original values
    originalWindow = global.window
    originalDocument = global.document
  })

  afterEach(() => {
    // Restore original values
    global.window = originalWindow
    global.document = originalDocument

    // Clear module cache to get fresh imports
    vi.resetModules()
  })

  describe("baseAssetPath", () => {
    it('should use "/" when not in browser environment', async () => {
      // Remove window to simulate non-browser
      delete (global as any).window

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("/")
    })

    it('should use "/" when window.document is undefined', async () => {
      // @ts-ignore
      global.window = {}

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("/")
    })

    it('should use "/" when currentScript is null', async () => {
      // @ts-ignore
      global.window = { document: { currentScript: null } }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("/")
    })

    it("should extract path from currentScript.src", async () => {
      const mockSrc = "https://example.com/path/to/script.js"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("https://example.com/path/to/")
    })

    it("should remove hash from currentScript.src", async () => {
      const mockSrc = "https://example.com/path/script.js#hash"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("https://example.com/path/")
    })

    it("should remove query string from currentScript.src", async () => {
      const mockSrc = "https://example.com/path/script.js?v=1.0.0"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("https://example.com/path/")
    })

    it("should handle both hash and query string", async () => {
      const mockSrc = "https://example.com/dist/bundle.min.js?v=1.0.0#section"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("https://example.com/dist/")
    })

    it("should handle CDN URLs", async () => {
      const mockSrc =
        "https://cdn.jsdelivr.net/npm/@semperai/vad-web@0.0.27/dist/bundle.min.js"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe(
        "https://cdn.jsdelivr.net/npm/@semperai/vad-web@0.0.27/dist/"
      )
    })

    it("should handle relative paths", async () => {
      const mockSrc = "/assets/js/vad.js"
      // @ts-ignore
      global.window = {
        document: {
          currentScript: { src: mockSrc } as any,
        } as any,
      }

      const { baseAssetPath } = await import("../src/asset-path")
      expect(baseAssetPath).toBe("/assets/js/")
    })
  })
})
