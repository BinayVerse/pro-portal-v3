import { query, getClient } from '../../../server/utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const site = config.chargebeeSite
  const bodyRaw = await readBody(event, { asString: true }).catch(() => null)
  let payload: any = null
  try { payload = bodyRaw ? JSON.parse(bodyRaw as string) : await readBody(event) } catch (e) { payload = null }

  // Try to get event id/type
  const eventId = payload?.event_id || payload?.id || (payload?.event && payload.event.id) || null
  const eventType = payload?.event_type || payload?.type || payload?.event?.event_type || null

  // Insert to webhook_events (idempotent)
  try {
    const insertRes = await query(
      `INSERT INTO public.webhook_events (event_id, event_type, payload, processed)
       VALUES ($1,$2,$3,false)
       ON CONFLICT (event_id) DO NOTHING RETURNING id`,
      [eventId, eventType, JSON.stringify(payload || {})]
    )

    if (!insertRes || (Array.isArray(insertRes.rows) && insertRes.rows.length === 0)) {
      // already seen
      return { success: true }
    }
  } catch (e: any) {
    console.error('Failed to persist webhook event', e?.message || e)
    // continue processing but be careful
  }

  // Minimal processing: handle hosted_page_success and subscription_created
  try {
    // If hosted_page info available, map to order
    const hostedPageId = payload?.content?.hosted_page?.id || payload?.hosted_page?.id || payload?.event?.content?.hosted_page?.id || null
    if (hostedPageId) {
      // find order by hosted_page_id
      const ord = await query('SELECT * FROM public.chargebee_orders WHERE hosted_page_id = $1 LIMIT 1', [hostedPageId])
      const orderRow = ord?.rows?.[0]

      // extract customer/subscription from payload safely
      const hostedContent = payload?.content?.hosted_page || payload?.hosted_page || payload?.event?.content?.hosted_page || null
      const customerId = hostedContent?.content?.customer?.id || hostedContent?.content?.customer?.customer_id || hostedContent?.content?.customer?.id || null
      const subscriptionId = hostedContent?.content?.subscription?.id || hostedContent?.content?.subscription?.subscription_id || null

      if (orderRow) {
        // update order -> completed
        await query('UPDATE public.chargebee_orders SET status=$1, updated_at=NOW() WHERE id=$2', ['completed', orderRow.id])
        // update organization with chargebee ids and plan start
        await query(
          `UPDATE public.organizations SET chargebee_customer_id=$1, chargebee_subscription_id=$2, plan_start_date=NOW(), plan_id=$3 WHERE org_id=$4`,
          [customerId, subscriptionId, orderRow.plan_id, orderRow.org_id]
        )
      }

      return { success: true }
    }

    // subscription created events
    const sub = payload?.content?.subscription || payload?.event?.content?.subscription || null
    if (sub) {
      const subscriptionId = sub.id || sub.subscription_id || null
      const customerId = sub.customer_id || sub.customer || (payload?.content?.customer?.id) || null
      const planChargebeeId = sub.plan_id || sub.plan_ids || null

      // Map planChargebeeId to local plan
      if (planChargebeeId) {
        const planRow = await query('SELECT id FROM public.plans WHERE chargebee_plan_id = $1 LIMIT 1', [planChargebeeId])
        const localPlan = planRow?.rows?.[0]
        if (localPlan) {
          // find organization by customer id
          const orgRow = await query('SELECT org_id FROM public.organizations WHERE chargebee_customer_id = $1 LIMIT 1', [customerId])
          const org = orgRow?.rows?.[0]
          if (org) {
            await query('UPDATE public.organizations SET plan_id=$1, plan_start_date=NOW(), chargebee_subscription_id=$2 WHERE org_id=$3', [localPlan.id, subscriptionId, org.org_id])
          }
        }
      }

      return { success: true }
    }

    // Fallback: store event only
    return { success: true }
  } catch (err: any) {
    console.error('Webhook processing error:', err?.message || err)
    throw createError({ statusCode: 500, statusMessage: 'Failed to process webhook' })
  }
})
