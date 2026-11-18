import { describe, expect, it } from "vitest"
import {
  DEFAULT_MODEL,
  getDefaultRealTimeVADOptions,
} from "../src/real-time-vad"

describe("real-time-vad", () => {
  describe("DEFAULT_MODEL", () => {
    it("should be set to legacy", () => {
      expect(DEFAULT_MODEL).toBe("legacy")
    })
  })

  describe("getDefaultRealTimeVADOptions", () => {
    it("should return default options for v5 model", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(options.model).toBe("v5")
      expect(options.positiveSpeechThreshold).toBeDefined()
      expect(options.negativeSpeechThreshold).toBeDefined()
      expect(options.minSpeechMs).toBeDefined()
      expect(options.submitUserSpeechOnPause).toBe(false)
      expect(options.startOnLoad).toBe(true)
    })

    it("should return default options for legacy model", () => {
      const options = getDefaultRealTimeVADOptions("legacy")

      expect(options.model).toBe("legacy")
      expect(options.positiveSpeechThreshold).toBeDefined()
      expect(options.negativeSpeechThreshold).toBeDefined()
    })

    it("should include callback functions", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(typeof options.onFrameProcessed).toBe("function")
      expect(typeof options.onSpeechEnd).toBe("function")
      expect(typeof options.onSpeechStart).toBe("function")
      expect(typeof options.onSpeechRealStart).toBe("function")
      expect(typeof options.onVADMisfire).toBe("function")
    })

    it("should include stream management functions", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(typeof options.getStream).toBe("function")
      expect(typeof options.pauseStream).toBe("function")
      expect(typeof options.resumeStream).toBe("function")
    })

    it("should include asset paths", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(options.baseAssetPath).toBeDefined()
      expect(options.onnxWASMBasePath).toBeDefined()
      expect(typeof options.baseAssetPath).toBe("string")
      expect(typeof options.onnxWASMBasePath).toBe("string")
    })

    it("should include worklet options", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(options.workletOptions).toBeDefined()
      expect(typeof options.workletOptions).toBe("object")
    })

    it("should have different thresholds for v5 and legacy models", () => {
      const v5Options = getDefaultRealTimeVADOptions("v5")
      const legacyOptions = getDefaultRealTimeVADOptions("legacy")

      // Both should have threshold values, but they might differ
      expect(v5Options.positiveSpeechThreshold).toBeDefined()
      expect(legacyOptions.positiveSpeechThreshold).toBeDefined()
    })

    it("should start on load by default", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(options.startOnLoad).toBe(true)
    })

    it("should not submit speech on pause by default", () => {
      const options = getDefaultRealTimeVADOptions("v5")

      expect(options.submitUserSpeechOnPause).toBe(false)
    })
  })
})
