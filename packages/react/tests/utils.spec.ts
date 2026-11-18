import { describe, expect, it } from "vitest"
import { utils } from "../src/index"

describe("utils export", () => {
  it("should export utils from vad-web", () => {
    expect(utils).toBeDefined()
    expect(typeof utils).toBe("object")
  })

  it("should have the expected utility functions", () => {
    // These are re-exported from @semperai/vad-web
    expect(utils).toHaveProperty("audioFileToArray")
    expect(utils).toHaveProperty("minFramesForTargetMS")
    expect(utils).toHaveProperty("arrayBufferToBase64")
    expect(utils).toHaveProperty("encodeWAV")
  })

  it("should export functions that are callable", () => {
    expect(typeof utils.audioFileToArray).toBe("function")
    expect(typeof utils.minFramesForTargetMS).toBe("function")
    expect(typeof utils.arrayBufferToBase64).toBe("function")
    expect(typeof utils.encodeWAV).toBe("function")
  })
})
