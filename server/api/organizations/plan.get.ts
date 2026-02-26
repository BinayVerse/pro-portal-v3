import jwt from 'jsonwebtoken'
import { defineEventHandler, getQuery } from 'h3'

import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  /* --------------------------------
   * TOKEN RESOLUTION
   * -------------------------------- */
  let token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    const cookieHeader = String(event.node.req.headers['cookie'] || '')
    for (const part of cookieHeader.split(';')) {
      const [k, ...v] = part.split('=')
      if (!k) continue
      const key = k.trim()
      const val = decodeURIComponent((v || []).join('=').trim())
      if (key === 'auth-token' || key === 'authToken') {
        token = val
        break
      }
    }
  }

  if (!token) throw new CustomError('Unauthorized: No token provided', 401)

  let userId: string
  try {
    const decoded = jwt.verify(token, config.jwtToken as string)
    userId = (decoded as any).user_id
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  try {
    /* --------------------------------
     * USER + ORG ACCESS CHECK
     * -------------------------------- */
    const userRes = await query(
      `SELECT org_id, role_id FROM users WHERE user_id = $1`,
      [userId],
    )
    if (!userRes.rows.length) throw new CustomError('User not found', 404)

    const tokenOrgId = userRes.rows[0].org_id
    const roleId = userRes.rows[0].role_id

    const q = getQuery(event) as any
    const requestedOrg = q?.org || q?.org_id || null
    const orgId = roleId === 0 && requestedOrg ? String(requestedOrg) : tokenOrgId

    if (!orgId) throw new CustomError('Organization not found', 404)

    /* --------------------------------
     * BASE PLAN (ORG + PLAN)
     * -------------------------------- */
    const orgPlanSql = `
      SELECT 
        o.org_id,
        o.org_name,
        o.source,
        o.plan_id,
        o.plan_start_date,

        -- ORG OVERRIDES
        o.org_limit_requests,
        o.org_storage_limit_gb,
        o.org_users,
        o.org_artefacts,
        o.org_unlimited_requests,

        -- PLAN TEMPLATE
        p.title,
        p.price_amount,
        p.price_currency,
        p.duration,
        p.users,
        p.limit_requests,
        p.storage_limit_gb,
        p.support_level,
        p.artefacts,
        p.metadata,
        p.features
      FROM organizations o
      LEFT JOIN plans p ON o.plan_id = p.id
      WHERE o.org_id = $1
      LIMIT 1
    `

    const orgRes = await query(orgPlanSql, [orgId])
    const row = orgRes.rows[0]

    if (!row) {
      return { success: true, data: null }
    }

    /* --------------------------------
     * AWS AUTO-RENEWAL STATUS (IF APPLICABLE)
     * -------------------------------- */

    let awsAutoRenewalStatus: boolean | null = null

    if (row.source === 'aws') {
      const awsRes = await query(
        `
      SELECT auto_renewal_status
      FROM aws_marketplace_subscriptions
      WHERE org_id = $1
      AND active = true
      LIMIT 1
    `,
        [orgId]
      )

      const rawAwsRenewal = awsRes.rows[0]?.auto_renewal_status ?? null
      awsAutoRenewalStatus =
        rawAwsRenewal === true
    }


    /* --------------------------------
     * BASE PLAN DATE WINDOW
     * -------------------------------- */
    let basePlanStart: Date | null = null
    let basePlanEnd: Date | null = null
    let hasActiveBasePlan = false

    if (row.plan_id && row.plan_start_date) {
      basePlanStart = new Date(row.plan_start_date)

      // If duration is NULL, plan never expires (always active)
      if (!row.duration) {
        hasActiveBasePlan = true
        basePlanEnd = null // No expiry date
      } else {
        basePlanEnd = new Date(basePlanStart)
        const dur = String(row.duration).toLowerCase()
        if (dur.includes('year')) {
          basePlanEnd.setFullYear(basePlanEnd.getFullYear() + 1)
        } else {
          basePlanEnd.setMonth(basePlanEnd.getMonth() + 1)
        }

        hasActiveBasePlan = basePlanEnd.getTime() > Date.now()
      }
    }

    /* --------------------------------
     * NORMALIZE FEATURES
     * -------------------------------- */
    let features: string[] = []
    try {
      if (Array.isArray(row.features)) features = row.features
      else if (typeof row.features === 'string') features = JSON.parse(row.features)
    } catch { }

    const metadata = row.metadata || {}

    const interval = String(row.duration || '').toLowerCase().includes('year')
      ? 'year'
      : 'month'

    // Check if plan has unlimited flag in metadata
    const isUnlimited = metadata?.unlimited === true

    const basePlan = hasActiveBasePlan
      ? {
        id: row.plan_id,
        title: row.title,
        price_amount: row.price_amount,
        price_currency: row.price_currency,
        duration: row.duration,
        interval,

        users: isUnlimited ? -1 : (row.org_users ?? row.users ?? null),
        limit_requests: isUnlimited ? -1 : (row.org_limit_requests ?? row.limit_requests ?? null),
        storage_limit_gb: isUnlimited ? -1 : (row.org_storage_limit_gb ?? row.storage_limit_gb ?? null),
        artefacts: isUnlimited ? -1 : (row.org_artefacts ?? row.artefacts ?? null),
        unlimited_requests: row.org_unlimited_requests ?? false,
        unlimited: isUnlimited,

        support_level: row.support_level ?? null,
        metadata,
        features,
      }
      : null

    /* --------------------------------
     * ACTIVE ADD-ONS (BOUND TO BASE PLAN)
     * -------------------------------- */
    let addons: any[] = []

    if (hasActiveBasePlan && basePlanStart && basePlanEnd) {
      const addonsRes = await query(
        `
          SELECT
            sd.plan_id,

            -- ONLY aggregate quantity
            SUM(COALESCE(sd.addon_quantity, 1)) AS total_quantity,

            -- take latest timestamp only
            MAX(sd.created_at) AS last_purchased_at,

            -- plan info
            p.title,
            p.price_amount,
            p.price_currency,
            p.duration
          FROM subscription_details sd
          LEFT JOIN plans p
            ON sd.plan_id::uuid = p.id
          WHERE sd.org_id = $1
            AND sd.subscription_kind = 'addon'
            AND sd.status IN ('active', 'cancelled')
            AND sd.created_at >= $2
            AND sd.created_at <= $3
          GROUP BY
            sd.plan_id,
            p.title,
            p.price_amount,
            p.price_currency,
            p.duration
          ORDER BY last_purchased_at DESC;
        `,
        [orgId, basePlanStart, basePlanEnd],
      )

      addons = addonsRes.rows.map((a: any) => ({
        subscription_id: a.id,
        plan_id: a.plan_id,
        title: a.title,
        price_amount: a.price_amount,
        price_currency: a.price_currency,
        duration: a.duration,
        status: a.status,
        // aggregated quantity
        quantity: Number(a.total_quantity) || 1,
        limits: a.addon_limits ?? {},
        metadata: a.metadata ?? {},
        purchased_at: a.created_at,
      }))
    }

    /* --------------------------------
     * SUBSCRIPTION DETAILS
     * -------------------------------- */

    const subscriptionRes = await query(
      `
        SELECT
          status,
          metadata
        FROM subscription_details
        WHERE org_id = $1
          AND subscription_kind = 'subscription'
        ORDER BY created_at DESC
        LIMIT 1
    `,
      [orgId]
    )

    const subscriptionDetails = subscriptionRes.rows[0] || null


    /* --------------------------------
     * FINAL RESPONSE
     * -------------------------------- */
    return {
      success: true,
      data: {
        org_id: row.org_id,
        org_name: row.org_name,
        plan: basePlan,
        source: row.source,
        aws_auto_renewal_status: awsAutoRenewalStatus,
        plan_start_date: hasActiveBasePlan ? row.plan_start_date : null,
        addons,
        subscription_details: subscriptionDetails
          ? {
            status: subscriptionDetails.status,
            cancellation_details:
              subscriptionDetails.metadata?.cancellation_details || null,
          }
          : null,
      },
    }
  } catch (err) {
    console.error('Org plan lookup error:', err)
    throw new CustomError('Failed to fetch organization plan', 500)
  }
})
