/**
 * Client-side logger composable
 * Provides structured logging interface for Vue components and stores
 * Logs are sent to server as structured JSON for CloudWatch
 */

export const useLogger = () => {
  // Helper to send logs to server (optional - for future integration)
  const sendLogToServer = async (level: string, message: string, metadata?: Record<string, any>) => {
    try {
      // Optional: send to server for centralized logging
      // await $fetch('/api/logs', { method: 'POST', body: { level, message, metadata, timestamp: new Date().toISOString() } })
    } catch (err) {
      // Silently fail - don't let logging errors break the app
    }
  }

  const error = (message: string, error?: any, metadata?: Record<string, any>) => {
    const errorData = error instanceof Error ? { message: error.message, stack: error.stack } : error
    const logData = { level: 'error', message, error: errorData, ...metadata, timestamp: new Date().toISOString() }
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('[ERROR]', message, { error, ...metadata })
    } else {
      // In production, send structured log to server
      sendLogToServer('error', message, { error: errorData, ...metadata })
    }
  }

  const warn = (message: string, metadata?: Record<string, any>) => {
    const logData = { level: 'warn', message, ...metadata, timestamp: new Date().toISOString() }
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.warn('[WARN]', message, metadata)
    } else {
      sendLogToServer('warn', message, metadata)
    }
  }

  const info = (message: string, metadata?: Record<string, any>) => {
    const logData = { level: 'info', message, ...metadata, timestamp: new Date().toISOString() }
    
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('[INFO]', message, metadata)
    } else {
      sendLogToServer('info', message, metadata)
    }
  }

  const debug = (message: string, metadata?: Record<string, any>) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', message, metadata)
    }
  }

  return {
    error,
    warn,
    info,
    debug,
  }
}
