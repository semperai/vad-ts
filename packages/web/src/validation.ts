import { log } from "./logging"

/**
 * Error types that can occur during VAD initialization or operation
 */
export class VADError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = "VADError"
  }
}

export class AudioConstraintsError extends VADError {
  constructor(message: string, cause?: Error) {
    super(message, "AUDIO_CONSTRAINTS_ERROR", cause)
    this.name = "AudioConstraintsError"
  }
}

export class ModelLoadError extends VADError {
  constructor(message: string, cause?: Error) {
    super(message, "MODEL_LOAD_ERROR", cause)
    this.name = "ModelLoadError"
  }
}

export class WorkletLoadError extends VADError {
  constructor(message: string, cause?: Error) {
    super(message, "WORKLET_LOAD_ERROR", cause)
    this.name = "WorkletLoadError"
  }
}

export class AudioContextError extends VADError {
  constructor(message: string, cause?: Error) {
    super(message, "AUDIO_CONTEXT_ERROR", cause)
    this.name = "AudioContextError"
  }
}

/**
 * Validate audio capture constraints and surface warnings or errors for settings that affect VAD quality.
 *
 * Inspects the provided MediaTrackConstraints for channelCount, sampleRate, noiseSuppression, and echoCancellation:
 * - Warns if channelCount exists and is not 1 (mono preferred).
 * - Throws an AudioConstraintsError if sampleRate is present and less than 16000 Hz.
 * - Warns if noiseSuppression or echoCancellation are explicitly set to `false`.
 *
 * @param constraints - MediaTrackConstraints to validate (examines `channelCount`, `sampleRate`, `noiseSuppression`, and `echoCancellation`)
 * @throws AudioConstraintsError - If `sampleRate` is provided and is less than 16000 Hz
 */
export function validateAudioConstraints(
  constraints: MediaTrackConstraints
): void {
  log.debug("Validating audio constraints:", constraints)

  // Check channel count
  if (constraints.channelCount) {
    const channelCount =
      typeof constraints.channelCount === "number"
        ? constraints.channelCount
        : (constraints.channelCount as ConstrainULongRange).ideal ??
          (constraints.channelCount as ConstrainULongRange).exact

    if (channelCount && channelCount !== 1) {
      log.warn(
        `VAD works best with mono audio (channelCount: 1), got ${channelCount}`
      )
    }
  }

  // Check sample rate
  if (constraints.sampleRate) {
    const sampleRate =
      typeof constraints.sampleRate === "number"
        ? constraints.sampleRate
        : (constraints.sampleRate as ConstrainULongRange).ideal ??
          (constraints.sampleRate as ConstrainULongRange).exact

    if (sampleRate && sampleRate < 16000) {
      throw new AudioConstraintsError(
        `Sample rate must be at least 16000 Hz, got ${sampleRate} Hz`
      )
    }
  }

  // Warn about audio processing flags that might interfere with VAD
  if (constraints.noiseSuppression === false) {
    log.warn(
      "Noise suppression is disabled. This may reduce VAD accuracy in noisy environments."
    )
  }

  if (constraints.echoCancellation === false) {
    log.warn(
      "Echo cancellation is disabled. This may cause false positives if system audio is playing."
    )
  }

  log.debug("Audio constraints validation passed")
}

/**
 * Ensures the browser exposes navigator.mediaDevices.getUserMedia for microphone access.
 *
 * @throws AudioConstraintsError if `getUserMedia` is not available in the current environment
 */
export function checkUserMediaSupport(): void {
  if (!navigator?.mediaDevices?.getUserMedia) {
    throw new AudioConstraintsError(
      "getUserMedia is not supported in this browser. VAD requires microphone access."
    )
  }

  log.debug("getUserMedia support confirmed")
}

/**
 * Determine whether AudioWorklet is available on the given AudioContext.
 *
 * @param ctx - The AudioContext to check for AudioWorklet support
 * @returns `true` if AudioWorklet is available on `ctx`, `false` otherwise
 */
export function checkAudioWorkletSupport(ctx: AudioContext): boolean {
  const hasWorklet =
    "audioWorklet" in ctx && typeof AudioWorkletNode === "function"

  if (!hasWorklet) {
    log.warn(
      "AudioWorklet is not supported. Falling back to ScriptProcessorNode (deprecated)."
    )
  } else {
    log.debug("AudioWorklet support confirmed")
  }

  return hasWorklet
}

/**
 * Validates that the provided model URL can be resolved against the current origin.
 *
 * @param url - The model URL or path to validate; may be absolute or relative to the page origin.
 * @throws ModelLoadError if the URL cannot be parsed (the original error is attached as the `cause`).
 */
export function validateModelURL(url: string): void {
  try {
    new URL(url, window.location.origin)
  } catch (e) {
    throw new ModelLoadError(`Invalid model URL: ${url}`, e as Error)
  }
}

/**
 * Validates a worklet script URL by resolving it against the current origin.
 *
 * @param url - The worklet script URL (absolute or relative); resolved relative to window.location.origin.
 * @throws WorkletLoadError - If the URL cannot be parsed as a valid URL (the original parsing error is attached as the cause).
 */
export function validateWorkletURL(url: string): void {
  try {
    new URL(url, window.location.origin)
  } catch (e) {
    throw new WorkletLoadError(`Invalid worklet URL: ${url}`, e as Error)
  }
}

/**
 * Ensures the provided AudioContext is usable for VAD operations.
 *
 * Throws an AudioContextError if the context is closed. Logs a warning if the context is suspended and will be resumed when VAD starts.
 *
 * @param ctx - The AudioContext to validate
 * @throws AudioContextError when `ctx.state` is "closed"
 */
export function validateAudioContextState(ctx: AudioContext): void {
  if (ctx.state === "closed") {
    throw new AudioContextError(
      "AudioContext is closed. Cannot initialize VAD."
    )
  }

  if (ctx.state === "suspended") {
    log.warn(
      "AudioContext is suspended. It will be resumed when VAD starts."
    )
  }

  log.debug("AudioContext state validated:", ctx.state)
}

/**
 * Check browser compatibility for VAD features
 */
export interface BrowserCompatibility {
  getUserMedia: boolean
  audioWorklet: boolean
  audioContext: boolean
  onnxRuntime: boolean
  warnings: string[]
}

/**
 * Evaluates the runtime availability of browser APIs and dependencies required for VAD.
 *
 * @returns An object with boolean flags for `getUserMedia`, `audioWorklet`, `audioContext`, and `onnxRuntime`, plus a `warnings` array detailing any missing features or potential compatibility issues.
 */
export function checkBrowserCompatibility(): BrowserCompatibility {
  const warnings: string[] = []

  const getUserMedia = !!navigator?.mediaDevices?.getUserMedia
  if (!getUserMedia) {
    warnings.push("getUserMedia API not available")
  }

  const audioContext = typeof AudioContext !== "undefined"
  if (!audioContext) {
    warnings.push("AudioContext API not available")
  }

  const audioWorklet =
    audioContext &&
    "audioWorklet" in AudioContext.prototype &&
    typeof AudioWorkletNode === "function"
  if (!audioWorklet) {
    warnings.push("AudioWorklet API not available (will use fallback)")
  }

  // Check for ONNX Runtime dependencies
  const onnxRuntime =
    typeof WebAssembly !== "undefined" &&
    typeof SharedArrayBuffer !== "undefined"
  if (!onnxRuntime) {
    warnings.push(
      "WebAssembly or SharedArrayBuffer not available. ONNX Runtime may not work."
    )
  }

  const result: BrowserCompatibility = {
    getUserMedia,
    audioWorklet,
    audioContext,
    onnxRuntime,
    warnings,
  }

  if (warnings.length > 0) {
    log.warn("Browser compatibility warnings:", warnings)
  } else {
    log.info("Browser is fully compatible with VAD")
  }

  return result
}