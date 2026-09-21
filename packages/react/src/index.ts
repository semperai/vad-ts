import type { RealTimeVADOptions } from "@semperai/vad-web"
import {
  DEFAULT_MODEL,
  MicVAD,
  getDefaultRealTimeVADOptions,
} from "@semperai/vad-web"
import { useEffect, useState, useRef, useCallback } from "react"

export { utils } from "@semperai/vad-web"

interface ReactOptions {
  userSpeakingThreshold: number
}

export type ReactRealTimeVADOptions = RealTimeVADOptions & ReactOptions

const defaultReactOptions: ReactOptions = {
  userSpeakingThreshold: 0.6,
}

export const getDefaultReactRealTimeVADOptions = (
  model: "legacy" | "v5"
): ReactRealTimeVADOptions => {
  return {
    ...getDefaultRealTimeVADOptions(model),
    ...defaultReactOptions,
  }
}

const reactOptionKeys = Object.keys(defaultReactOptions)
const vadOptionKeys = Object.keys(getDefaultRealTimeVADOptions("v5"))

const _filter = (keys: string[], obj: any) => {
  return keys.reduce((acc, key) => {
    acc[key] = obj[key]
    return acc
  }, {} as { [key: string]: any })
}

/**
 * Split and normalize provided options into React-specific options and model-specific VAD options.
 *
 * Merges `options` with default settings for the selected `model` (falls back to `DEFAULT_MODEL` if unspecified),
 * then separates the merged result into React-only configuration and RealTimeVAD configuration.
 *
 * @param options - Partial user-supplied options; may include `model`. Values are merged with model defaults before splitting.
 * @returns A tuple where the first element is the extracted `ReactOptions` and the second element is the resulting `RealTimeVADOptions`.
 */
function useOptions(
  options: Partial<ReactRealTimeVADOptions>
): [ReactOptions, RealTimeVADOptions] {
  const model = options["model"] ?? DEFAULT_MODEL
  options = { ...getDefaultReactRealTimeVADOptions(model), ...options }
  const reactOptions = _filter(reactOptionKeys, options) as ReactOptions
  const vadOptions = _filter(vadOptionKeys, options) as RealTimeVADOptions
  return [reactOptions, vadOptions]
}

/**
 * Manage a microphone-based real-time VAD lifecycle and controls for React components.
 *
 * Creates and maintains a MicVAD instance, recreating it when critical options change
 * (notably `getStream` and `model`), and exposes current VAD state and control functions.
 *
 * @param options - Partial configuration for the VAD. Critical fields such as `getStream` and `model`
 *                  affect when the hook will reinitialize the underlying VAD instance.
 * @returns An object containing:
 *  - `listening` - `true` when the VAD is actively listening for audio.
 *  - `errored` - `false` when no error occurred, or a string error message when initialization failed.
 *  - `loading` - `true` while the VAD is being initialized.
 *  - `userSpeaking` - `true` when recent frame probabilities indicate the user is speaking (based on `userSpeakingThreshold`).
 *  - `pause` - function to pause the VAD.
 *  - `start` - function to start the VAD.
 *  - `toggle` - function to toggle between paused and started states.
 */
export function useMicVAD(options: Partial<ReactRealTimeVADOptions>) {
  const [reactOptions, vadOptions] = useOptions(options)
  const model = options["model"] ?? DEFAULT_MODEL
  const [userSpeaking, updateUserSpeaking] = useState(false)
  const [loading, setLoading] = useState(true)
  const [errored, setErrored] = useState<false | string>(false)
  const [listening, setListening] = useState(false)
  const [vad, setVAD] = useState<MicVAD | null>(null)

  // Use refs to store the latest callbacks so they can be called without recreating the VAD
  const onFrameProcessedRef = useRef(vadOptions.onFrameProcessed)
  const onSpeechEndRef = useRef(vadOptions.onSpeechEnd)
  const onSpeechStartRef = useRef(vadOptions.onSpeechStart)
  const onSpeechRealStartRef = useRef(vadOptions.onSpeechRealStart)
  const onVADMisfireRef = useRef(vadOptions.onVADMisfire)
  const getStreamRef = useRef(vadOptions.getStream)

  // Update refs when callbacks change
  useEffect(() => {
    onFrameProcessedRef.current = vadOptions.onFrameProcessed
    onSpeechEndRef.current = vadOptions.onSpeechEnd
    onSpeechStartRef.current = vadOptions.onSpeechStart
    onSpeechRealStartRef.current = vadOptions.onSpeechRealStart
    onVADMisfireRef.current = vadOptions.onVADMisfire
  }, [
    vadOptions.onFrameProcessed,
    vadOptions.onSpeechEnd,
    vadOptions.onSpeechStart,
    vadOptions.onSpeechRealStart,
    vadOptions.onVADMisfire,
  ])

  // Update getStream ref - this is the key fix!
  useEffect(() => {
    getStreamRef.current = vadOptions.getStream
  }, [vadOptions.getStream])

  // Serialize getStream function to detect changes
  // We use a simple approach: convert function to string
  const getStreamKey = vadOptions.getStream.toString()

  useEffect(() => {
    let myvad: MicVAD | null = null
    let canceled = false

    const setup = async (): Promise<void> => {
      try {
        setLoading(true)
        setErrored(false)

        // Create VAD options with stable callback wrappers
        const finalVadOptions: RealTimeVADOptions = {
          ...vadOptions,
          onFrameProcessed: (probs: any, frame: any) => {
            const isSpeaking = probs.isSpeech > reactOptions.userSpeakingThreshold
            updateUserSpeaking(isSpeaking)
            onFrameProcessedRef.current(probs, frame)
          },
          onSpeechEnd: (audio: any) => {
            onSpeechEndRef.current(audio)
          },
          onSpeechStart: () => {
            onSpeechStartRef.current()
          },
          onSpeechRealStart: () => {
            onSpeechRealStartRef.current()
          },
          onVADMisfire: () => {
            onVADMisfireRef.current()
          },
          getStream: () => {
            return getStreamRef.current()
          },
        }

        myvad = await MicVAD.new(finalVadOptions)

        if (canceled) {
          myvad.destroy()
          return
        }

        setVAD(myvad)
        setLoading(false)

        if (vadOptions.startOnLoad) {
          myvad.start()
          setListening(true)
        }
      } catch (e) {
        setLoading(false)
        if (e instanceof Error) {
          setErrored(e.message)
        } else {
          setErrored(String(e))
        }
      }
    }

    setup().catch(() => {
      // Error already handled in setup function
    })

    return function cleanUp() {
      canceled = true
      if (myvad) {
        myvad.destroy()
      }
      if (!loading && !errored) {
        setListening(false)
      }
    }
  }, [getStreamKey, model]) // Recreate when getStream changes or model changes

  const pause = useCallback(() => {
    if (!loading && !errored) {
      vad?.pause()
      setListening(false)
    }
  }, [loading, errored, vad])

  const start = useCallback(() => {
    if (!loading && !errored) {
      vad?.start()
      setListening(true)
    }
  }, [loading, errored, vad])

  const toggle = useCallback(() => {
    if (listening) {
      pause()
    } else {
      start()
    }
  }, [listening, pause, start])

  return {
    listening,
    errored,
    loading,
    userSpeaking,
    pause,
    start,
    toggle,
  }
}