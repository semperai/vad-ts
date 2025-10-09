import { describe, expect, it, vi } from "vitest"
import { defaultModelFetcher } from "../src/default-model-fetcher"

describe("defaultModelFetcher", () => {
  it("should be a function", () => {
    expect(typeof defaultModelFetcher).toBe("function")
  })

  it("should fetch a model from a URL", async () => {
    const mockArrayBuffer = new ArrayBuffer(8)
    const mockResponse = {
      arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
    }

    global.fetch = vi.fn().mockResolvedValue(mockResponse)

    const result = await defaultModelFetcher("https://example.com/model.onnx")

    expect(global.fetch).toHaveBeenCalledWith("https://example.com/model.onnx")
    expect(mockResponse.arrayBuffer).toHaveBeenCalled()
    expect(result).toBe(mockArrayBuffer)
  })

  it("should throw an error if fetch fails", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"))

    await expect(
      defaultModelFetcher("https://example.com/model.onnx")
    ).rejects.toThrow("Network error")
  })
})
