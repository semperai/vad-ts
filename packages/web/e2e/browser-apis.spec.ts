import { test, expect } from '@playwright/test';

/**
 * Integration tests for browser API availability
 * These tests verify that the required browser APIs are available in a real browser environment
 */
test.describe('Browser API Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://127.0.0.1:8080/e2e-test.html');
  });

  test('should have AudioContext available', async ({ page }) => {
    const hasAudioContext = await page.evaluate(() => {
      return typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined';
    });

    expect(hasAudioContext).toBe(true);
  });

  test('should have AudioWorklet support', async ({ page }) => {
    const hasAudioWorklet = await page.evaluate(() => {
      try {
        const ctx = new AudioContext();
        const hasWorklet = 'audioWorklet' in ctx && typeof AudioWorkletNode !== 'undefined';
        ctx.close();
        return hasWorklet;
      } catch (e) {
        return false;
      }
    });

    expect(hasAudioWorklet).toBe(true);
  });

  test('should have getUserMedia support', async ({ page, context }) => {
    // Grant microphone permissions
    await context.grantPermissions(['microphone']);

    const hasGetUserMedia = await page.evaluate(() => {
      return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    });

    expect(hasGetUserMedia).toBe(true);
  });

  test('should have WebAssembly support', async ({ page }) => {
    const hasWebAssembly = await page.evaluate(() => {
      return typeof WebAssembly !== 'undefined';
    });

    expect(hasWebAssembly).toBe(true);
  });

  test('should have SharedArrayBuffer support', async ({ page }) => {
    const hasSharedArrayBuffer = await page.evaluate(() => {
      return typeof SharedArrayBuffer !== 'undefined';
    });

    expect(hasSharedArrayBuffer).toBe(true);
  });

  test('should have OfflineAudioContext support', async ({ page }) => {
    const hasOfflineAudioContext = await page.evaluate(() => {
      return typeof OfflineAudioContext !== 'undefined';
    });

    expect(hasOfflineAudioContext).toBe(true);
  });

  test('should have FileReader support', async ({ page }) => {
    const hasFileReader = await page.evaluate(() => {
      return typeof FileReader !== 'undefined';
    });

    expect(hasFileReader).toBe(true);
  });
});
