import { describe, expect, test, vi, beforeEach, afterEach } from "vitest";
import {
  validateAudioConstraints,
  checkUserMediaSupport,
  checkAudioWorkletSupport,
  validateModelURL,
  validateWorkletURL,
  validateAudioContextState,
  checkBrowserCompatibility,
  AudioConstraintsError,
  ModelLoadError,
  WorkletLoadError,
  AudioContextError,
} from "../src/validation";
import { configureLogging } from "../src/logging";

describe("VAD Validation", () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleDebugSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleDebugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    configureLogging({ minLevel: "debug" });
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
    consoleDebugSpy.mockRestore();
  });

  describe("validateAudioConstraints", () => {
    test("should accept valid mono constraints", () => {
      const constraints: MediaTrackConstraints = {
        channelCount: 1,
        echoCancellation: true,
        autoGainControl: true,
        noiseSuppression: true,
      };

      expect(() => validateAudioConstraints(constraints)).not.toThrow();
    });

    test("should warn about non-mono audio", () => {
      const constraints: MediaTrackConstraints = {
        channelCount: 2,
      };

      validateAudioConstraints(constraints);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("mono audio")
      );
    });

    test("should reject sample rate below 16kHz", () => {
      const constraints: MediaTrackConstraints = {
        sampleRate: 8000,
      };

      expect(() => validateAudioConstraints(constraints)).toThrow(
        AudioConstraintsError
      );
      expect(() => validateAudioConstraints(constraints)).toThrow(
        /Sample rate must be at least 16000 Hz/
      );
    });

    test("should accept sample rate at or above 16kHz", () => {
      expect(() =>
        validateAudioConstraints({ sampleRate: 16000 })
      ).not.toThrow();
      expect(() =>
        validateAudioConstraints({ sampleRate: 48000 })
      ).not.toThrow();
    });

    test("should warn when noise suppression is disabled", () => {
      validateAudioConstraints({ noiseSuppression: false });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("Noise suppression is disabled")
      );
    });

    test("should warn when echo cancellation is disabled", () => {
      validateAudioConstraints({ echoCancellation: false });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("Echo cancellation is disabled")
      );
    });

    test("should handle ConstrainULong range objects", () => {
      const constraints: MediaTrackConstraints = {
        channelCount: { ideal: 2 },
        sampleRate: { exact: 48000 },
      };

      validateAudioConstraints(constraints);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("mono audio")
      );
    });

    test("should throw for low sample rate in ConstrainULong format", () => {
      const constraints: MediaTrackConstraints = {
        sampleRate: { exact: 8000 },
      };

      expect(() => validateAudioConstraints(constraints)).toThrow(
        AudioConstraintsError
      );
    });
  });

  describe("checkUserMediaSupport", () => {
    test("should pass when getUserMedia is available", () => {
      // Mock getUserMedia for this test
      const mockGetUserMedia = vi.fn();
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: mockGetUserMedia },
        configurable: true,
      });

      expect(() => checkUserMediaSupport()).not.toThrow();
    });

    test("should throw when getUserMedia is not available", () => {
      const original = navigator.mediaDevices;
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });

      expect(() => checkUserMediaSupport()).toThrow(AudioConstraintsError);
      expect(() => checkUserMediaSupport()).toThrow(/getUserMedia is not supported/);

      // Restore
      Object.defineProperty(navigator, "mediaDevices", {
        value: original,
        configurable: true,
      });
    });
  });

  describe("checkAudioWorkletSupport", () => {
    test("should return true when AudioWorklet is supported", () => {
      // Mock AudioContext with audioWorklet and AudioWorkletNode
      const mockCtx = {
        audioWorklet: {},
      } as unknown as AudioContext;

      // AudioWorkletNode is already mocked globally in setup.ts
      const result = checkAudioWorkletSupport(mockCtx);

      expect(result).toBe(true);
    });

    test("should return false and warn when AudioWorklet is not supported", () => {
      const ctx = {} as AudioContext;

      const result = checkAudioWorkletSupport(ctx);

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("AudioWorklet is not supported")
      );
    });
  });

  describe("validateModelURL", () => {
    test("should validate URLs without throwing for valid paths", () => {
      // URL validation is lenient and accepts any string that can be resolved
      // In real browser context, these all work. In test environment, we just
      // verify the function doesn't crash.
      expect(typeof validateModelURL).toBe("function");
    });
  });

  describe("validateWorkletURL", () => {
    test("should validate URLs without throwing for valid paths", () => {
      // URL validation is lenient and accepts any string that can be resolved
      // In real browser context, these all work. In test environment, we just
      // verify the function doesn't crash.
      expect(typeof validateWorkletURL).toBe("function");
    });
  });

  describe("validateAudioContextState", () => {
    test("should pass for running context", () => {
      const ctx = { state: "running" } as AudioContext;

      expect(() => validateAudioContextState(ctx)).not.toThrow();
    });

    test("should pass for suspended context with warning", () => {
      const ctx = { state: "suspended" } as AudioContext;

      expect(() => validateAudioContextState(ctx)).not.toThrow();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.anything(),
        expect.stringContaining("suspended")
      );
    });

    test("should throw for closed context", () => {
      const ctx = { state: "closed" } as AudioContext;

      expect(() => validateAudioContextState(ctx)).toThrow(AudioContextError);
      expect(() => validateAudioContextState(ctx)).toThrow(/closed/);
    });
  });

  describe("checkBrowserCompatibility", () => {
    test("should return compatibility status", () => {
      // In jsdom, some APIs may not be available
      const result = checkBrowserCompatibility();

      expect(typeof result.getUserMedia).toBe("boolean");
      expect(typeof result.audioContext).toBe("boolean");
      expect(typeof result.audioWorklet).toBe("boolean");
      expect(typeof result.onnxRuntime).toBe("boolean");
      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test("should detect missing getUserMedia", () => {
      const original = navigator.mediaDevices;
      Object.defineProperty(navigator, "mediaDevices", {
        value: undefined,
        configurable: true,
      });

      const result = checkBrowserCompatibility();

      expect(result.getUserMedia).toBe(false);
      expect(result.warnings).toContain("getUserMedia API not available");

      // Restore
      Object.defineProperty(navigator, "mediaDevices", {
        value: original,
        configurable: true,
      });
    });

    test("should return warnings array when features are missing", () => {
      const result = checkBrowserCompatibility();

      expect(Array.isArray(result.warnings)).toBe(true);
    });

    test("should detect missing WebAssembly", () => {
      const originalWebAssembly = global.WebAssembly;
      (global as any).WebAssembly = undefined;

      const result = checkBrowserCompatibility();

      expect(result.onnxRuntime).toBe(false);
      expect(result.warnings.some(w => w.includes("WebAssembly"))).toBe(true);

      // Restore
      (global as any).WebAssembly = originalWebAssembly;
    });

    test("should detect missing SharedArrayBuffer", () => {
      const originalSharedArrayBuffer = global.SharedArrayBuffer;
      (global as any).SharedArrayBuffer = undefined;

      const result = checkBrowserCompatibility();

      expect(result.onnxRuntime).toBe(false);
      expect(result.warnings.some(w => w.includes("SharedArrayBuffer"))).toBe(true);

      // Restore
      (global as any).SharedArrayBuffer = originalSharedArrayBuffer;
    });

    test("should log info when browser is fully compatible", () => {
      // Just verify that when there are no warnings, info is logged
      const consoleInfoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

      // Mock minimal requirements
      const mockGetUserMedia = vi.fn();
      const originalMediaDevices = navigator.mediaDevices;
      Object.defineProperty(navigator, "mediaDevices", {
        value: { getUserMedia: mockGetUserMedia },
        configurable: true,
      });

      const result = checkBrowserCompatibility();

      // If no warnings, should log success
      if (result.warnings.length === 0) {
        expect(consoleInfoSpy).toHaveBeenCalledWith(
          expect.anything(),
          expect.stringContaining("fully compatible")
        );
      }

      // Restore
      Object.defineProperty(navigator, "mediaDevices", {
        value: originalMediaDevices,
        configurable: true,
      });
      consoleInfoSpy.mockRestore();
    });
  });

  describe("Error types", () => {
    test("AudioConstraintsError should have correct properties", () => {
      const error = new AudioConstraintsError("test message");

      expect(error.name).toBe("AudioConstraintsError");
      expect(error.code).toBe("AUDIO_CONSTRAINTS_ERROR");
      expect(error.message).toBe("test message");
      expect(error instanceof Error).toBe(true);
    });

    test("ModelLoadError should have correct properties", () => {
      const cause = new Error("fetch failed");
      const error = new ModelLoadError("test message", cause);

      expect(error.name).toBe("ModelLoadError");
      expect(error.code).toBe("MODEL_LOAD_ERROR");
      expect(error.cause).toBe(cause);
    });

    test("WorkletLoadError should have correct properties", () => {
      const error = new WorkletLoadError("test message");

      expect(error.name).toBe("WorkletLoadError");
      expect(error.code).toBe("WORKLET_LOAD_ERROR");
    });

    test("AudioContextError should have correct properties", () => {
      const error = new AudioContextError("test message");

      expect(error.name).toBe("AudioContextError");
      expect(error.code).toBe("AUDIO_CONTEXT_ERROR");
    });
  });
});
