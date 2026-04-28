import pino from 'pino'

// Custom serializer for errors to ensure stack traces are properly JSON-escaped
const errorSerializer = (error: any) => {
  if (!error) return error

  if (error instanceof Error) {
    return {
      message: error.message,
      // Split stack trace into array to keep it as a single line in JSON
      stack: error.stack ? error.stack.split('\n').map((line: string) => line.trim()) : undefined,
      name: error.name,
      // Include any additional properties from the error object
      ...Object.getOwnPropertyNames(error).reduce(
        (acc, key) => {
          if (!['message', 'stack', 'name'].includes(key)) {
            acc[key] = (error as any)[key]
          }
          return acc
        },
        {} as Record<string, any>
      ),
    }
  }

  return error
}

// Create logger with environment-specific configuration
export const logger = pino(
  {
    level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
    // Add timestamp to all logs
    timestamp: pino.stdTimeFunctions.isoTime,
    // Apply custom serializers for errors
    serializers: {
      err: errorSerializer,
      error: errorSerializer,
    },
  },
  // Transport configuration: pino-pretty for development, default JSON for production
  process.env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          singleLine: true,
          ignore: 'pid,hostname',
        },
      })
    : undefined
)

// Export convenience functions for structured logging
export const logError = (message: string, error: any, metadata?: Record<string, any>) => {
  logger.error(
    {
      err: error instanceof Error ? { message: error.message, stack: error.stack } : error,
      ...metadata,
    },
    message
  )
}

export const logWarn = (message: string, metadata?: Record<string, any>) => {
  logger.warn(metadata, message)
}

export const logInfo = (message: string, metadata?: Record<string, any>) => {
  logger.info(metadata, message)
}

export const logDebug = (message: string, metadata?: Record<string, any>) => {
  logger.debug(metadata, message)
}

export default logger
