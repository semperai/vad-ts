import * as ort from "onnxruntime-web"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SileroLegacy } from "../src/models/legacy"
import { SileroV5 } from "../src/models/v5"

describe("Models", () => {
  describe("SileroLegacy", () => {
    let mockSession: any
    let mockModelFetcher: any

    beforeEach(() => {
      mockSession = {
        run: vi.fn().mockResolvedValue({
          output: { data: [0.8] },
          hn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
          cn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
        }),
      }

      mockModelFetcher = vi.fn().mockResolvedValue(new ArrayBuffer(100))

      vi.spyOn(ort.InferenceSession, "create").mockResolvedValue(
        mockSession as any
      )
    })

    it("should create a new instance", async () => {
      const model = await SileroLegacy.new(ort, mockModelFetcher)

      expect(model).toBeInstanceOf(SileroLegacy)
      expect(mockModelFetcher).toHaveBeenCalled()
      expect(ort.InferenceSession.create).toHaveBeenCalled()
    })

    it("should process audio frame", async () => {
      const model = await SileroLegacy.new(ort, mockModelFetcher)
      const audioFrame = new Float32Array(1536)

      const result = await model.process(audioFrame)

      expect(result).toHaveProperty("isSpeech")
      expect(result).toHaveProperty("notSpeech")
      expect(result.isSpeech).toBeCloseTo(0.8)
      expect(result.notSpeech).toBeCloseTo(0.2)
      expect(mockSession.run).toHaveBeenCalled()
    })

    it("should reset state", async () => {
      const model = await SileroLegacy.new(ort, mockModelFetcher)

      // Process a frame
      await model.process(new Float32Array(1536))

      // Reset state
      model.reset_state()

      // Should be able to process again
      const result = await model.process(new Float32Array(1536))
      expect(result).toBeDefined()
    })

    it("should maintain state between processes", async () => {
      const model = await SileroLegacy.new(ort, mockModelFetcher)

      await model.process(new Float32Array(1536))
      await model.process(new Float32Array(1536))

      expect(mockSession.run).toHaveBeenCalledTimes(2)
    })

    it("should calculate correct probabilities", async () => {
      mockSession.run.mockResolvedValueOnce({
        output: { data: [0.65] },
        hn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
        cn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
      })

      const model = await SileroLegacy.new(ort, mockModelFetcher)
      const result = await model.process(new Float32Array(1536))

      expect(result.isSpeech).toBe(0.65)
      expect(result.notSpeech).toBe(0.35)
      expect(result.isSpeech + result.notSpeech).toBeCloseTo(1.0)
    })
  })

  describe("SileroV5", () => {
    let mockSession: any
    let mockModelFetcher: any

    beforeEach(() => {
      mockSession = {
        run: vi.fn().mockResolvedValue({
          output: { data: [0.75] },
          stateN: new ort.Tensor("float32", Array(256).fill(0), [2, 1, 128]),
        }),
      }

      mockModelFetcher = vi.fn().mockResolvedValue(new ArrayBuffer(100))

      vi.spyOn(ort.InferenceSession, "create").mockResolvedValue(
        mockSession as any
      )
    })

    it("should create a new instance", async () => {
      const model = await SileroV5.new(ort, mockModelFetcher)

      expect(model).toBeInstanceOf(SileroV5)
      expect(mockModelFetcher).toHaveBeenCalled()
      expect(ort.InferenceSession.create).toHaveBeenCalled()
    })

    it("should process audio frame", async () => {
      const model = await SileroV5.new(ort, mockModelFetcher)
      const audioFrame = new Float32Array(1536)

      const result = await model.process(audioFrame)

      expect(result).toHaveProperty("isSpeech")
      expect(result).toHaveProperty("notSpeech")
      expect(result.isSpeech).toBe(0.75)
      expect(result.notSpeech).toBe(0.25)
      expect(mockSession.run).toHaveBeenCalled()
    })

    it("should reset state", async () => {
      const model = await SileroV5.new(ort, mockModelFetcher)

      // Process a frame
      await model.process(new Float32Array(1536))

      // Reset state
      model.reset_state()

      // Should be able to process again
      const result = await model.process(new Float32Array(1536))
      expect(result).toBeDefined()
    })

    it("should maintain state between processes", async () => {
      const model = await SileroV5.new(ort, mockModelFetcher)

      await model.process(new Float32Array(1536))
      await model.process(new Float32Array(1536))

      expect(mockSession.run).toHaveBeenCalledTimes(2)
    })

    it("should calculate correct probabilities", async () => {
      mockSession.run.mockResolvedValueOnce({
        output: { data: [0.42] },
        stateN: new ort.Tensor("float32", Array(256).fill(0), [2, 1, 128]),
      })

      const model = await SileroV5.new(ort, mockModelFetcher)
      const result = await model.process(new Float32Array(1536))

      expect(result.isSpeech).toBeCloseTo(0.42)
      expect(result.notSpeech).toBeCloseTo(0.58)
      expect(result.isSpeech + result.notSpeech).toBeCloseTo(1.0)
    })

    it("should update state after processing", async () => {
      const newState = new ort.Tensor(
        "float32",
        Array(256).fill(1),
        [2, 1, 128]
      )

      mockSession.run.mockResolvedValueOnce({
        output: { data: [0.5] },
        stateN: newState,
      })

      const model = await SileroV5.new(ort, mockModelFetcher)
      await model.process(new Float32Array(1536))

      // Process again to ensure state was updated
      mockSession.run.mockResolvedValueOnce({
        output: { data: [0.6] },
        stateN: newState,
      })

      const result = await model.process(new Float32Array(1536))
      expect(result.isSpeech).toBe(0.6)
    })
  })

  describe("Model comparison", () => {
    let mockSession: any
    let mockModelFetcher: any

    beforeEach(() => {
      mockSession = {
        run: vi.fn().mockResolvedValue({
          output: { data: [0.5] },
          hn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
          cn: new ort.Tensor("float32", Array(128).fill(0), [2, 1, 64]),
          stateN: new ort.Tensor("float32", Array(256).fill(0), [2, 1, 128]),
        }),
      }

      mockModelFetcher = vi.fn().mockResolvedValue(new ArrayBuffer(100))
      vi.spyOn(ort.InferenceSession, "create").mockResolvedValue(
        mockSession as any
      )
    })

    it("both models should return same probability structure", async () => {
      const legacyModel = await SileroLegacy.new(ort, mockModelFetcher)
      const v5Model = await SileroV5.new(ort, mockModelFetcher)

      const audioFrame = new Float32Array(1536)

      const legacyResult = await legacyModel.process(audioFrame)
      const v5Result = await v5Model.process(audioFrame)

      expect(Object.keys(legacyResult)).toEqual(Object.keys(v5Result))
      expect(legacyResult).toHaveProperty("isSpeech")
      expect(legacyResult).toHaveProperty("notSpeech")
      expect(v5Result).toHaveProperty("isSpeech")
      expect(v5Result).toHaveProperty("notSpeech")
    })

    it("both models should have reset_state method", async () => {
      const legacyModel = await SileroLegacy.new(ort, mockModelFetcher)
      const v5Model = await SileroV5.new(ort, mockModelFetcher)

      expect(typeof legacyModel.reset_state).toBe("function")
      expect(typeof v5Model.reset_state).toBe("function")

      legacyModel.reset_state()
      v5Model.reset_state()

      // Should still be able to process after reset
      const legacyResult = await legacyModel.process(new Float32Array(1536))
      const v5Result = await v5Model.process(new Float32Array(1536))

      expect(legacyResult).toBeDefined()
      expect(v5Result).toBeDefined()
    })
  })
})
