import { test, expect } from '@playwright/test';

/**
 * Integration tests for utils.ts functions that require browser APIs
 */
test.describe('Utils - audioFileToArray', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page where we can load our VAD library
    await page.goto('http://127.0.0.1:8080');
  });

  test('should convert audio file to Float32Array', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create a minimal WAV file (440Hz sine wave, 1 second)
      const sampleRate = 44100;
      const duration = 1;
      const numSamples = sampleRate * duration;
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + numSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true); // fmt chunk size
      view.setUint16(20, 1, true); // PCM format
      view.setUint16(22, 1, true); // mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // byte rate
      view.setUint16(32, 2, true); // block align
      view.setUint16(34, 16, true); // bits per sample
      writeString(36, 'data');
      view.setUint32(40, numSamples * 2, true);

      // Generate sine wave
      for (let i = 0; i < numSamples; i++) {
        const sample = Math.sin(2 * Math.PI * 440 * i / sampleRate);
        view.setInt16(44 + i * 2, sample * 0x7fff, true);
      }

      const blob = new Blob([buffer], { type: 'audio/wav' });

      // Use the audioFileToArray function from vad-web
      const vad = (window as any).vad;
      if (!vad || !vad.utils || !vad.utils.audioFileToArray) {
        throw new Error('VAD utils not loaded');
      }

      const { audio, sampleRate: resultSampleRate } = await vad.utils.audioFileToArray(blob);

      return {
        audioLength: audio.length,
        audioType: audio.constructor.name,
        sampleRate: resultSampleRate,
        firstSample: audio[0],
        isFinite: Number.isFinite(audio[0]),
      };
    });

    expect(result.audioType).toBe('Float32Array');
    expect(result.audioLength).toBeGreaterThan(0);
    expect(result.sampleRate).toBe(44100);
    expect(result.isFinite).toBe(true);
  });

  test('should handle empty audio file', async ({ page }) => {
    const result = await page.evaluate(async () => {
      // Create minimal empty WAV file
      const buffer = new ArrayBuffer(44);
      const view = new DataView(buffer);

      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, 44100, true);
      view.setUint32(28, 88200, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, 0, true);

      const blob = new Blob([buffer], { type: 'audio/wav' });

      const vad = (window as any).vad;
      const { audio, sampleRate } = await vad.utils.audioFileToArray(blob);

      return {
        audioLength: audio.length,
        sampleRate,
      };
    });

    expect(result.audioLength).toBe(0);
    expect(result.sampleRate).toBe(44100);
  });

  test('should reject invalid audio data', async ({ page }) => {
    const error = await page.evaluate(async () => {
      const invalidBlob = new Blob(['not audio data'], { type: 'audio/wav' });

      const vad = (window as any).vad;
      try {
        await vad.utils.audioFileToArray(invalidBlob);
        return null;
      } catch (e: any) {
        return e.message;
      }
    });

    expect(error).toBeTruthy();
    expect(error).toContain('Failed to decode audio data');
  });
});

test.describe('Utils - encodeWAV', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8080');
  });

  test('should encode Float32Array to WAV format', async ({ page }) => {
    const result = await page.evaluate(() => {
      const samples = new Float32Array([0.5, -0.5, 0.25, -0.25, 0.0]);
      const vad = (window as any).vad;
      const wavBuffer = vad.utils.encodeWAV(samples, 3, 16000, 1, 32);

      return {
        bufferLength: wavBuffer.byteLength,
        hasRIFFHeader: new TextDecoder().decode(wavBuffer.slice(0, 4)) === 'RIFF',
        hasWAVEHeader: new TextDecoder().decode(wavBuffer.slice(8, 12)) === 'WAVE',
      };
    });

    expect(result.bufferLength).toBeGreaterThan(44); // Header + data
    expect(result.hasRIFFHeader).toBe(true);
    expect(result.hasWAVEHeader).toBe(true);
  });
});
