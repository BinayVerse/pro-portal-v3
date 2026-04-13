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

  console.log('📨 Chargebee webhook received:', {
    eventId,
    eventType,
    timestamp: new Date().toISOString(),
  })

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
      console.log('⚠️  Webhook already processed:', eventId)
      return { success: true }
    }
  } catch (e: any) {
    console.error('Failed to persist webhook event', e?.message || e)
    // continue processing but be careful
  }

  // Process webhook events: hosted_page_success, subscription_created, subscription_renewed, invoice_generated
  try {
    // === EVENT 1: HOSTED PAGE SUCCESS ===
    const hostedPageId = payload?.content?.hosted_page?.id || payload?.hosted_page?.id || payload?.event?.content?.hosted_page?.id || null
    if (hostedPageId) {
      const ord = await query('SELECT * FROM public.chargebee_orders WHERE hosted_page_id = $1 LIMIT 1', [hostedPageId])
      const orderRow = ord?.rows?.[0]

      const hostedContent = payload?.content?.hosted_page || payload?.hosted_page || payload?.event?.content?.hosted_page || null
      const customerId = hostedContent?.content?.customer?.id || hostedContent?.content?.customer?.customer_id || hostedContent?.content?.customer?.id || null
      const subscriptionId = hostedContent?.content?.subscription?.id || hostedContent?.content?.subscription?.subscription_id || null

      if (orderRow) {
        await query('UPDATE public.chargebee_orders SET status=$1, updated_at=NOW() WHERE id=$2', ['completed', orderRow.id])
        await query(
          `UPDATE public.organizations SET chargebee_customer_id=$1, chargebee_subscription_id=$2, plan_start_date=NOW(), plan_id=$3 WHERE org_id=$4`,
          [customerId, subscriptionId, orderRow.plan_id, orderRow.org_id]
        )
      }

      return { success: true }
    }

    // === EVENT 2: SUBSCRIPTION CREATED ===
    const sub = payload?.content?.subscription || payload?.event?.content?.subscription || null
    if (sub) {
      const subscriptionId = sub.id || sub.subscription_id || null
      const customerId = sub.customer_id || sub.customer || (payload?.content?.customer?.id) || null
      const planChargebeeId = sub.plan_id || sub.plan_ids || null

      if (planChargebeeId) {
        const planRow = await query('SELECT id FROM public.plans WHERE chargebee_plan_id = $1 LIMIT 1', [planChargebeeId])
        const localPlan = planRow?.rows?.[0]
        if (localPlan) {
          const orgRow = await query('SELECT org_id FROM public.organizations WHERE chargebee_customer_id = $1 LIMIT 1', [customerId])
          const org = orgRow?.rows?.[0]
          if (org) {
            await query('UPDATE public.organizations SET plan_id=$1, plan_start_date=NOW(), chargebee_subscription_id=$2 WHERE org_id=$3', [localPlan.id, subscriptionId, org.org_id])
          }
        }
      }

      return { success: true }
    }

    // === EVENT 3: SUBSCRIPTION RENEWED ===
    // When renewal occurs, sync the subscription immediately to detect the renewal
    const renewalSub = payload?.content?.subscription || payload?.event?.content?.subscription || null
    if (renewalSub && (eventType === 'subscription_renewed' || eventType === 'subscription_updated')) {
      const subscriptionId = renewalSub.id || renewalSub.subscription_id || null
      const customerId = renewalSub.customer_id || renewalSub.customer || null

      if (subscriptionId && customerId) {
        try {
          // Find org by subscription ID
          const orgRes = await query(
            'SELECT org_id FROM public.organizations WHERE chargebee_subscription_id = $1 LIMIT 1',
            [subscriptionId]
          )

          if (orgRes?.rows?.[0]) {
            const orgId = orgRes.rows[0].org_id
            console.log('🔄 Renewal webhook: Syncing subscription for org:', orgId)

            // Import and call the sync function
            const { getSubscriptionDetails } = await import('~/server/utlis/chargebee')
            await getSubscriptionDetails(orgId)

            console.log('✅ Renewal webhook: Subscription synced successfully')
          }
        } catch (syncErr: any) {
          console.error('Renewal sync error:', syncErr?.message || syncErr)
          // Don't fail the webhook, just log the error
        }
      }

      return { success: true }
    }

    // === EVENT 4: INVOICE GENERATED/UPDATED ===
    // This ensures invoices are recorded even if subscription_renewed webhook doesn't fire
    const invoice = payload?.content?.invoice || payload?.event?.content?.invoice || null
    if (invoice && (eventType === 'invoice_generated' || eventType === 'invoice_updated')) {
      const invoiceId = invoice.id || invoice.invoice_id || null
      const customerId = invoice.customer_id || null
      const subscriptionId = invoice.subscription_id || null

      if (invoiceId && customerId) {
        try {
          // Find org by customer ID
          const orgRes = await query(
            'SELECT org_id FROM public.organizations WHERE chargebee_customer_id = $1 LIMIT 1',
            [customerId]
          )

          if (orgRes?.rows?.[0]) {
            const orgId = orgRes.rows[0].org_id
            console.log('📋 Invoice webhook: Processing invoice', invoiceId, 'for org:', orgId)

            // If we have a subscription ID, sync it to ensure all data is current
            if (subscriptionId) {
              const { getSubscriptionDetails } = await import('~/server/utlis/chargebee')
              await getSubscriptionDetails(orgId)
              console.log('✅ Invoice webhook: Subscription data synced')
            }
          }
        } catch (syncErr: any) {
          console.error('Invoice sync error:', syncErr?.message || syncErr)
          // Don't fail the webhook
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
