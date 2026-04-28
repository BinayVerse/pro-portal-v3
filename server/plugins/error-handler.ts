import { setResponseStatus } from 'h3'
import { CustomError } from '../utils/custom.error'
import { logger } from '../utils/logger'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('error', (error: any, { event }) => {
    // Log with structured JSON format for CloudWatch
    try {
      const errorContext = {
        statusCode: error?.statusCode || 500,
        message: error?.message || 'Unknown error',
        url: event?.node?.req?.url,
        method: event?.node?.req?.method,
        timestamp: new Date().toISOString(),
      }

      if (error instanceof CustomError) {
        logger.error(errorContext, `CustomError: ${error.message}`)
      } else {
        logger.error(
          {
            ...errorContext,
            stack: error?.stack,
          },
          `Unhandled Error: ${error?.message || 'Unknown'}`
        )
      }
    } catch {}

    // If no event or response already sent, do nothing
    if (!event || !event.node || !event.node.res || event.node.res.writableEnded) {
      return
    }

    // Prepare payload
    let statusCode = (error as any)?.statusCode || 500
    let message = (error as any)?.message || 'Internal Server Error'

    if (error instanceof CustomError) {
      statusCode = error.statusCode
      message = error.message
    }

    // Write structured JSON response so clients can read _data.message
    try {
      setResponseStatus(event, statusCode)
      if (!event.node.res.headersSent) {
        event.node.res.setHeader('content-type', 'application/json; charset=utf-8')
      }
      const payload = {
        statusCode,
        status: 'error',
        message,
        timestamp: new Date().toISOString(),
      }
      event.node.res.end(JSON.stringify(payload))
    } catch {
      // Fallback minimal body
      try {
        event.node.res.statusCode = statusCode
        event.node.res.end(
          JSON.stringify({ statusCode, status: 'error', message: 'Internal Server Error' })
        )
      } catch {}
    }
  })

  // Log render errors
  nitroApp.hooks.hook('render:response', (response, { event }) => {
    if (response.statusCode >= 400) {
      logger.error(
        {
          statusCode: response.statusCode,
          url: event.node.req.url,
          method: event.node.req.method,
        },
        `Render Error: ${response.statusCode}`
      )
    }
  })
})
