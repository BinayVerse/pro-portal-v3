// /server/api/billing/invoices/[id]/download.get.ts
import {
  defineEventHandler,
  getRouterParam,
  setResponseHeaders,
  send,
} from 'h3'
import jwt from 'jsonwebtoken'
import { downloadInvoicePDF } from '~/server/utlis/chargebee'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const authHeader = event.node.req.headers['authorization']
  const token = authHeader?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    return { success: false, error: 'Unauthorized' }
  }

  try {
    jwt.verify(token, config.jwtToken as string)
  } catch {
    setResponseStatus(event, 401)
    return { success: false, error: 'Invalid token' }
  }

  const invoiceId = getRouterParam(event, 'id')
  if (!invoiceId) {
    setResponseStatus(event, 400)
    return { success: false, error: 'Invoice ID required' }
  }

  const result = await downloadInvoicePDF(invoiceId)

  if (result.status !== 'Success' || !result.data) {
    setResponseStatus(event, result.statusCode || 500)
    return { success: false, error: result.error }
  }

  setResponseHeaders(event, {
    'Content-Type': 'application/pdf',
    'Content-Disposition': `attachment; filename="${
      result.filename || `invoice-${invoiceId}.pdf`
    }"`,
    'Content-Length': String(result.data.length),
  })

  // THIS IS THE KEY LINE
  return send(event, result.data)
})
