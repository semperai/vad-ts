export const LOG_PREFIX = "[VAD]"

const levels = ["error", "warn", "info", "debug"] as const
type Level = (typeof levels)[number]
type LogFn = (...args: unknown[]) => void
type Logger = Record<Level, LogFn>

/**
 * Log level priority (higher = more important)
 */
const LEVEL_PRIORITY: Record<Level, number> = {
  error: 3,
  warn: 2,
  info: 1,
  debug: 0,
}

/**
 * Configuration for VAD logging
 */
export interface LogConfig {
  /** Minimum log level to display. Messages below this level will be suppressed. */
  minLevel: Level
  /** Whether to include timestamps in log messages */
  timestamps: boolean
  /** Custom prefix for log messages */
  prefix?: string
}

let currentConfig: LogConfig = {
  minLevel: "warn",
  timestamps: false,
  prefix: LOG_PREFIX,
}

/**
 * Update the global logging configuration with the provided settings.
 *
 * Merges the supplied partial configuration into the active logging configuration, overriding any specified fields.
 *
 * @param config - Partial configuration object that may include `minLevel`, `timestamps`, and `prefix` to override the current settings
 */
export function configureLogging(config: Partial<LogConfig>): void {
  currentConfig = { ...currentConfig, ...config }
}

/**
 * Retrieves a read-only snapshot of the current logging configuration.
 *
 * @returns A shallow copy of the active `LogConfig`. Mutating the returned object does not change the internal configuration.
 */
export function getLoggingConfig(): Readonly<LogConfig> {
  return { ...currentConfig }
}

/**
 * Determine whether a message at the specified log level should be emitted given the current logging configuration.
 *
 * @param level - The log level to evaluate
 * @returns `true` if messages at `level` meet or exceed the configured minimum level, `false` otherwise.
 */
function shouldLog(level: Level): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentConfig.minLevel]
}

/**
 * Create a logging function for the given level that writes messages to the console when that level is enabled.
 *
 * @param level - The log level for which to produce a logger.
 * @returns A function that accepts any values and, if the configured minimum level allows it, writes them to the console prefixed by the configured prefix and an optional ISO timestamp; does nothing if the level is below the configured minimum.
 */
function getLog(level: Level): LogFn {
  return (...args: unknown[]) => {
    if (!shouldLog(level)) {
      return
    }

    const prefix = currentConfig.prefix ?? LOG_PREFIX
    const timestamp = currentConfig.timestamps ? `[${new Date().toISOString()}]` : ""

    const logArgs = timestamp ? [prefix, timestamp, ...args] : [prefix, ...args]

    // Map 'info' to 'log' since console.info might not exist in all environments
    const consoleMethod = level === "info" ? "log" : level
    console[consoleMethod](...logArgs)
  }
}

const _log = levels.reduce<Partial<Logger>>((acc, level) => {
  acc[level] = getLog(level)
  return acc
}, {})

export const log = _log as Logger