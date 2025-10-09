import { test, expect } from '@playwright/test';

/**
 * Integration tests for real-time VAD functionality
 * Tests MicVAD and AudioNodeVAD with actual browser AudioContext
 */
test.describe('RealTimeVAD - MicVAD', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);
    await page.goto('http://127.0.0.1:8080/e2e-test.html');
  });

  test('should create MicVAD instance', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      try {
        const myvad = await vad.MicVAD.new({
          onSpeechStart: () => {},
          onSpeechEnd: () => {},
          startOnLoad: false,
          baseAssetPath: 'http://127.0.0.1:8080/',
          onnxWASMBasePath: 'http://127.0.0.1:8080/',
        });

        return {
          created: true,
          hasStart: typeof myvad.start === 'function',
          hasPause: typeof myvad.pause === 'function',
          hasDestroy: typeof myvad.destroy === 'function',
          listening: myvad.listening,
        };
      } catch (e: any) {
        return {
          created: false,
          error: e.message,
        };
      }
    });

    expect(result.created).toBe(true);
    expect(result.hasStart).toBe(true);
    expect(result.hasPause).toBe(true);
    expect(result.hasDestroy).toBe(true);
    expect(result.listening).toBe(false);
  });

  test('should use default options when not specified', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;
      const defaultOptions = vad.getDefaultRealTimeVADOptions();

      return {
        hasPositiveSpeechThreshold: typeof defaultOptions.positiveSpeechThreshold === 'number',
        hasNegativeSpeechThreshold: typeof defaultOptions.negativeSpeechThreshold === 'number',
        hasModel: typeof defaultOptions.model === 'string',
        model: defaultOptions.model,
      };
    });

    expect(result.hasPositiveSpeechThreshold).toBe(true);
    expect(result.hasNegativeSpeechThreshold).toBe(true);
    expect(result.hasModel).toBe(true);
    expect(result.model).toBe('v5');
  });

  test('should support model switching', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      // Test with v5 model
      const vadV5 = await vad.MicVAD.new({
        model: 'v5',
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      // Test with legacy model
      const vadLegacy = await vad.MicVAD.new({
        model: 'legacy',
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      return {
        v5Created: !!vadV5,
        legacyCreated: !!vadLegacy,
      };
    });

    expect(result.v5Created).toBe(true);
    expect(result.legacyCreated).toBe(true);
  });

  test('should handle custom speech thresholds', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      const myvad = await vad.MicVAD.new({
        positiveSpeechThreshold: 0.8,
        negativeSpeechThreshold: 0.3,
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      return {
        created: !!myvad,
      };
    });

    expect(result.created).toBe(true);
  });

  test('should handle start and pause', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      const myvad = await vad.MicVAD.new({
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      const initialListening = myvad.listening;

      myvad.start();
      const listeningAfterStart = myvad.listening;

      myvad.pause();
      const listeningAfterPause = myvad.listening;

      await myvad.destroy();

      return {
        initialListening,
        listeningAfterStart,
        listeningAfterPause,
      };
    });

    expect(result.initialListening).toBe(false);
    expect(result.listeningAfterStart).toBe(true);
    expect(result.listeningAfterPause).toBe(false);
  });

  test('should destroy properly', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      const myvad = await vad.MicVAD.new({
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      myvad.start();
      await myvad.destroy();

      return {
        destroyed: true,
        listening: myvad.listening,
      };
    });

    expect(result.destroyed).toBe(true);
    expect(result.listening).toBe(false);
  });
});

test.describe('RealTimeVAD - Callbacks', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.grantPermissions(['microphone']);
    await page.goto('http://127.0.0.1:8080/e2e-test.html');
  });

  test('should call onFrameProcessed callback', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;
      let frameCount = 0;

      const myvad = await vad.MicVAD.new({
        onFrameProcessed: () => {
          frameCount++;
        },
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
      });

      myvad.start();

      // Wait for some frames to be processed
      await new Promise(resolve => setTimeout(resolve, 500));

      myvad.pause();
      await myvad.destroy();

      return {
        frameCount,
        framesProcessed: frameCount > 0,
      };
    });

    expect(result.framesProcessed).toBe(true);
  });

  test('should support custom worklet options', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      const myvad = await vad.MicVAD.new({
        onSpeechEnd: () => {},
        startOnLoad: false,
        baseAssetPath: 'http://127.0.0.1:8080/',
        onnxWASMBasePath: 'http://127.0.0.1:8080/',
        workletOptions: {
          additionalAudioConstraints: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        },
      });

      return {
        created: !!myvad,
      };
    });

    expect(result.created).toBe(true);
  });
});

test.describe('RealTimeVAD - Error Handling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/e2e-test.html');
  });

  test('should validate options', async ({ page }) => {
    const result = await page.evaluate(async () => {
      const vad = (window as any).vad;

      try {
        // Invalid threshold values
        await vad.MicVAD.new({
          positiveSpeechThreshold: 1.5, // Invalid: > 1
          onSpeechEnd: () => {},
          baseAssetPath: 'http://127.0.0.1:8080/',
          onnxWASMBasePath: 'http://127.0.0.1:8080/',
        });
        return { error: null };
      } catch (e: any) {
        return { error: e.message };
      }
    });

    expect(result.error).toBeTruthy();
    expect(result.error).toContain('positiveSpeechThreshold');
  });
});
