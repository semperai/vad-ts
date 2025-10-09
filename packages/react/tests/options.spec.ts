import { describe, expect, it } from "vitest"
import { getDefaultReactRealTimeVADOptions } from "../src/index"

describe("getDefaultReactRealTimeVADOptions", () => {
  it("should return default options for v5 model", () => {
    const options = getDefaultReactRealTimeVADOptions("v5")

    expect(options).toHaveProperty("model", "v5")
    expect(options).toHaveProperty("userSpeakingThreshold", 0.6)
    expect(options).toHaveProperty("positiveSpeechThreshold")
    expect(options).toHaveProperty("negativeSpeechThreshold")
    expect(options).toHaveProperty("onFrameProcessed")
    expect(options).toHaveProperty("onSpeechEnd")
  })

  it("should return default options for legacy model", () => {
    const options = getDefaultReactRealTimeVADOptions("legacy")

    expect(options).toHaveProperty("model", "legacy")
    expect(options).toHaveProperty("userSpeakingThreshold", 0.6)
  })

  it("should include React-specific options", () => {
    const options = getDefaultReactRealTimeVADOptions("v5")

    expect(options.userSpeakingThreshold).toBe(0.6)
  })

  it("should include all required callback functions", () => {
    const options = getDefaultReactRealTimeVADOptions("v5")

    expect(typeof options.onFrameProcessed).toBe("function")
    expect(typeof options.onSpeechEnd).toBe("function")
    expect(typeof options.onSpeechStart).toBe("function")
    expect(typeof options.onSpeechRealStart).toBe("function")
    expect(typeof options.onVADMisfire).toBe("function")
  })
})
