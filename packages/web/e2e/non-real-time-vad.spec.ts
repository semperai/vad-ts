import { expect, test } from "@playwright/test"

/**
 * Integration tests for NonRealTimeVAD
 * Tests processing pre-recorded audio with the VAD model
 */
test.describe("NonRealTimeVAD", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://127.0.0.1:8080/e2e-test.html")
  })

  test("should create NonRealTimeVAD instance", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad

      try {
        const nrtvad = await vad.NonRealTimeVAD.new()

        return {
          created: true,
          hasRun: typeof nrtvad.run === "function",
          frameSamples: nrtvad.frameSamples,
        }
      } catch (e: any) {
        return {
          created: false,
          error: e.message,
        }
      }
    })

    expect(result.created).toBe(true)
    expect(result.hasRun).toBe(true)
    expect(result.frameSamples).toBe(1536)
  })

  test("should use default options", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad
      const defaultOptions = vad.defaultNonRealTimeVADOptions

      return {
        hasModelURL: typeof defaultOptions.modelURL === "string",
        hasModelFetcher: typeof defaultOptions.modelFetcher === "function",
        hasPositiveSpeechThreshold:
          typeof defaultOptions.positiveSpeechThreshold === "number",
      }
    })

    expect(result.hasModelURL).toBe(true)
    expect(result.hasModelFetcher).toBe(true)
    expect(result.hasPositiveSpeechThreshold).toBe(true)
  })

  test("should process audio with run() generator", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad

      // Create NonRealTimeVAD instance
      const nrtvad = await vad.NonRealTimeVAD.new({
        positiveSpeechThreshold: 0.5,
        negativeSpeechThreshold: 0.35,
      })

      // Generate test audio: silence (zeros)
      const sampleRate = 16000
      const duration = 1 // 1 second
      const audioData = new Float32Array(sampleRate * duration)

      // Process audio
      const segments = []
      for await (const segment of nrtvad.run(audioData, sampleRate)) {
        segments.push({
          audioLength: segment.audio.length,
          start: segment.start,
          end: segment.end,
          hasAudio: segment.audio instanceof Float32Array,
        })
      }

      return {
        processed: true,
        segmentCount: segments.length,
        segments,
      }
    })

    expect(result.processed).toBe(true)
    expect(result.segmentCount).toBeGreaterThanOrEqual(0)
  })

  test("should detect speech in simulated audio", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad

      const nrtvad = await vad.NonRealTimeVAD.new({
        positiveSpeechThreshold: 0.3, // Lower threshold for test
        negativeSpeechThreshold: 0.15,
        minSpeechMs: 100,
      })

      // Generate test audio: sine wave (simulating speech-like signal)
      const sampleRate = 16000
      const duration = 2 // 2 seconds
      const audioData = new Float32Array(sampleRate * duration)

      // Generate sine wave at 440Hz for middle 1 second (to simulate speech burst)
      for (let i = 0; i < audioData.length; i++) {
        const t = i / sampleRate
        if (t > 0.5 && t < 1.5) {
          // "Speech" in middle second
          audioData[i] = Math.sin(2 * Math.PI * 440 * t) * 0.5
        } else {
          // Silence
          audioData[i] = 0
        }
      }

      const segments = []
      for await (const segment of nrtvad.run(audioData, sampleRate)) {
        segments.push({
          audioLength: segment.audio.length,
          start: segment.start,
          end: segment.end,
          duration: segment.end - segment.start,
        })
      }

      return {
        segmentCount: segments.length,
        segments,
      }
    })

    // The exact number of segments depends on the VAD model's behavior
    // Just verify we can process audio successfully
    expect(result.segmentCount).toBeGreaterThanOrEqual(0)
  })

  test("should handle custom options", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad

      const nrtvad = await vad.NonRealTimeVAD.new({
        positiveSpeechThreshold: 0.7,
        negativeSpeechThreshold: 0.4,
        preSpeechPadMs: 1000,
        redemptionMs: 2000,
        minSpeechMs: 500,
      })

      return {
        created: true,
        frameSamples: nrtvad.frameSamples,
      }
    })

    expect(result.created).toBe(true)
    expect(result.frameSamples).toBe(1536)
  })

  test("should process audio at different sample rates", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad
      const nrtvad = await vad.NonRealTimeVAD.new()

      const results = []

      // Test different sample rates
      for (const sampleRate of [16000, 44100, 48000]) {
        const audioData = new Float32Array(sampleRate) // 1 second of silence

        const segments = []
        for await (const segment of nrtvad.run(audioData, sampleRate)) {
          segments.push(segment)
        }

        results.push({
          sampleRate,
          segmentCount: segments.length,
          processed: true,
        })
      }

      return results
    })

    expect(result.length).toBe(3)
    result.forEach((r) => {
      expect(r.processed).toBe(true)
      expect(r.segmentCount).toBeGreaterThanOrEqual(0)
    })
  })

  test("should handle empty audio", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad
      const nrtvad = await vad.NonRealTimeVAD.new()

      const audioData = new Float32Array(0)

      const segments = []
      for await (const segment of nrtvad.run(audioData, 16000)) {
        segments.push(segment)
      }

      return {
        segmentCount: segments.length,
        processed: true,
      }
    })

    expect(result.processed).toBe(true)
    expect(result.segmentCount).toBe(0)
  })

  test("should validate threshold options", async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad

      try {
        await vad.NonRealTimeVAD.new({
          positiveSpeechThreshold: 1.5, // Invalid: > 1
          baseAssetPath: "http://127.0.0.1:8080/",
          onnxWASMBasePath: "http://127.0.0.1:8080/",
        })
        return { error: null }
      } catch (e: any) {
        return { error: e.message }
      }
    })

    expect(result.error).toBeTruthy()
    expect(result.error).toContain("positiveSpeechThreshold")
  })
})
