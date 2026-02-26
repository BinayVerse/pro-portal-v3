import { defineEventHandler, readBody, createError } from 'h3'
import { query } from '~/server/utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as any
  const { transaction, plan_id, billing } = body || {}
  try {
    const hostedPageId = null
    const hostedPageUrl = null
    const status = transaction && transaction.success ? 'completed' : 'pending'

    // Determine org_id: prefer explicit body.org_id, otherwise try to derive from authenticated user token
    let orgId: string | null = (body && body.org_id) || null

    if (!orgId) {
      const token = event.node?.req?.headers?.['authorization']?.split?.(' ')[1]
      if (token) {
        try {
          const config = useRuntimeConfig()
          const decoded = jwt.verify(token, config.jwtToken as string) as any
          const userId = decoded?.user_id
          if (userId) {
            const userRow = await query('SELECT org_id FROM users WHERE user_id = $1 LIMIT 1', [userId])
            orgId = userRow?.rows?.[0]?.org_id || null
          }
        } catch (e) {
          // ignore token decode errors; we'll handle missing orgId below
          console.warn('complete-order: failed to decode token for org lookup', e)
        }
      }
    }

    if (!orgId) {
      // org_id is required by DB schema
      throw createError({ statusCode: 400, statusMessage: 'Missing org_id: include org_id in request or authenticate with a user that belongs to an organization' })
    }

    // Normalize amount to cents and store on metadata for consistency with Chargebee (expects cents)
    const metadata: any = { transaction, billing }
    try {
      const amtFromTxn = transaction && (transaction.amount ?? transaction.total ?? transaction.value)
      const amtFromBilling = billing && (billing.amount ?? billing.total ?? null)
      let rawAmount: number | null = null
      if (amtFromTxn !== undefined && amtFromTxn !== null) rawAmount = Number(amtFromTxn)
      else if (amtFromBilling !== undefined && amtFromBilling !== null) rawAmount = Number(amtFromBilling)

      if (!Number.isNaN(rawAmount) && rawAmount !== null) {
        // Heuristic: if value appears large (>1000) assume it's already cents, otherwise treat as major unit and convert
        const amountInCents = Math.abs(rawAmount) > 1000 ? Math.round(rawAmount) : Math.round(rawAmount * 100)
        metadata.amount_in_cents = amountInCents
        metadata.amount = amountInCents / 100
      }
    } catch (e) {
      // ignore conversion errors
      console.warn('complete-order: failed to normalize amount', e)
    }

    // Hosted page flow removed: record order in external system if needed.
    // For now, just acknowledge the completed order without persisting hosted_page details.
    // If you want to persist orders, implement a dedicated orders table and insert here.
    return { success: true }
  } catch (err: any) {
    console.error('complete-order failed', err)
    return { success: false, error: err?.message || 'Failed to record order' }
  }
})
