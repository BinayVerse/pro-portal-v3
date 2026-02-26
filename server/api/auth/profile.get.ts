import jwt from 'jsonwebtoken'
import { defineEventHandler } from 'h3'

import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import { getSubscriptionDetails } from '~/server/utlis/chargebee'

// Mapping entitlement → internal plan title
const ENTITLEMENT_PLAN_MAP: Record<string, string> = {
  BasicTier: 'Starter',
  ProfessionalTier: 'Professional',
  CustomTier: 'Enterprise',
}

/**
 * Lightweight expiry check
 * Used ONLY to decide whether to call Chargebee
 */
function isPlanStillActive(
  planStart: Date | null,
  duration: string | null,
): boolean {
  if (!planStart || !duration) return false

  const expiry = new Date(planStart)
  if (duration.toLowerCase() === 'yearly') {
    expiry.setFullYear(expiry.getFullYear() + 1)
  } else {
    expiry.setMonth(expiry.getMonth() + 1)
  }

  return expiry > new Date()
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  /* -----------------------------------
   * TOKEN PARSING & VALIDATION
   * ----------------------------------- */
  let token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    const cookies = String(event.node.req.headers['cookie'] || '')
    token = cookies
      .split(';')
      .map((c) => c.trim().split('='))
      .filter(([key]) => key === 'auth-token' || key === 'authToken')
      .map(([, value]) => decodeURIComponent(value))
      .shift()
  }

  if (!token) throw new CustomError('Unauthorized: No token provided', 401)

  let userId: string
  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as {
      user_id: string
    }
    userId = decoded.user_id
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  /* -----------------------------------
   * FETCH USER + ORG
   * ----------------------------------- */
  const userQuery = `
    SELECT
      u.user_id,
      u.name,
      u.email,
      u.contact_number,
      u.primary_contact,
      u.org_id,
      u.role_id,

      o.plan_id,
      o.plan_start_date,
      COALESCE(o.org_name, '') AS company,

      o.org_country,
      o.org_tax_id,

      o.org_users,
      o.org_limit_requests,
      o.org_storage_limit_gb,
      o.org_artefacts,
      o.org_unlimited_requests,
      o.source
    FROM users u
    LEFT JOIN organizations o ON u.org_id = o.org_id
    WHERE u.user_id = $1
  `

  try {
    const { rows } = await query(userQuery, [userId])
    if (!rows.length) throw new CustomError('User not found', 404)

    const user = rows[0]

    /* -----------------------------------
     * FETCH PLAN DURATION EARLY (CHEAP)
     * ----------------------------------- */
    let planDuration: string | null = null

    if (user.plan_id) {
      const durationRes = await query(
        `SELECT duration FROM plans WHERE id = $1 LIMIT 1`,
        [user.plan_id],
      )
      planDuration = durationRes.rows[0]?.duration || null
    }

    let finalPlanId = user.plan_id || null
    let finalPlanName: string | null = null
    let subscriptionStatus: any = null

    /* -----------------------------------
     * AWS MARKETPLACE SYNC (SHORT-CIRCUITED)
     * ----------------------------------- */
    if (user.org_id && user.source === 'aws') {
      const subscriptionRes = await query(
        `SELECT customer_id FROM aws_marketplace_subscriptions WHERE org_id = $1 LIMIT 1`,
        [user.org_id],
      )

      const customerId = subscriptionRes.rows[0]?.customer_id
      if (customerId) {
        const entitlementRes = await query(
          `
            SELECT dimension, updated_at, expiry_date, plan_type
            FROM aws_marketplace_entitlements
            WHERE customer_id = $1
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [customerId],
        )

        const entitlement = entitlementRes.rows[0]
        if (entitlement?.dimension) {
          const mappedPlanTitle =
            ENTITLEMENT_PLAN_MAP[entitlement.dimension]

          // 🔒 Skip AWS sync if entitlement is older than plan_start_date
          const shouldSync =
            !user.plan_start_date ||
            new Date(entitlement.updated_at) >
            new Date(user.plan_start_date)

          if (!shouldSync) {
            finalPlanId = user.plan_id
            finalPlanName = mappedPlanTitle || null
          } else if (mappedPlanTitle) {
            const planRes = await query(
              `
                SELECT id, users, limit_requests, storage_limit_gb, artefacts
                FROM plans
                WHERE title = $1
                  AND LOWER(duration) = LOWER($2)
                  AND active = TRUE
                LIMIT 1
              `,
              [mappedPlanTitle, entitlement.plan_type],
            )

            const plan = planRes.rows[0]
            if (plan?.id) {
              await query(
                `
                  UPDATE organizations
                  SET plan_id = $1,
                      plan_start_date = (
                        $2::timestamp -
                        CASE
                          WHEN LOWER($8) = 'yearly' THEN INTERVAL '1 year'
                          ELSE INTERVAL '1 month'
                        END
                      ),
                      org_users = $4,
                      org_limit_requests = $5,
                      org_storage_limit_gb = $6,
                      org_artefacts = $7,
                      updated_at = CURRENT_TIMESTAMP
                  WHERE org_id = $3
                `,
                [
                  plan.id,
                  entitlement.expiry_date,
                  user.org_id,
                  plan.users,
                  plan.limit_requests,
                  plan.storage_limit_gb,
                  plan.artefacts,
                  entitlement.plan_type,
                ],
              )

              finalPlanId = plan.id
              finalPlanName = mappedPlanTitle
            }
          }
        }
      }
    }

    /* -----------------------------------
     * CHARGEBEE CALL (ONLY IF EXPIRED)
     * ----------------------------------- */
    if (user.org_id && user.source === 'website') {
      const isActive = isPlanStillActive(
        user.plan_start_date,
        planDuration,
      )

      subscriptionStatus = isActive
        ? { status: 'active', source: 'cached' }
        : await getSubscriptionDetails(user.org_id)
    }

    /* -----------------------------------
     * FALLBACK PLAN NAME
     * ----------------------------------- */
    if (!finalPlanName && finalPlanId) {
      const res = await query(
        `SELECT title FROM plans WHERE id = $1 LIMIT 1`,
        [finalPlanId],
      )
      finalPlanName = res.rows[0]?.title || null
    }

    /* -----------------------------------
     * FULL PLAN DETAILS (LAST)
     * ----------------------------------- */
    let planDetails: any = null

    if (finalPlanId) {
      const planRes = await query(
        `
          SELECT
            id, title, price_currency, price_amount, duration,
            users, limit_requests, features, trial_period_days,
            storage_limit_gb, support_level, artefacts, metadata
          FROM plans
          WHERE id = $1
          LIMIT 1
        `,
        [finalPlanId],
      )

      const plan = planRes.rows[0]
      if (plan) {
        let unlimited = false
        try {
          const meta =
            typeof plan.metadata === 'string'
              ? JSON.parse(plan.metadata)
              : plan.metadata
          unlimited = meta?.unlimited === true
        } catch { }

        planDetails = {
          ...plan,
          users: unlimited ? -1 : user.org_users ?? plan.users,
          limit_requests: unlimited
            ? -1
            : user.org_limit_requests ?? plan.limit_requests,
          storage_limit_gb: unlimited
            ? -1
            : user.org_storage_limit_gb ?? plan.storage_limit_gb,
          artefacts: unlimited ? -1 : user.org_artefacts ?? plan.artefacts,
          unlimited,
        }
      }
    }

    /* -----------------------------------
     * PARALLEL READ-ONLY QUERIES
     * ----------------------------------- */
    const [billingRes, freeRes, paidRes] = await Promise.all([
      user.org_id
        ? query(
          `SELECT * FROM billing_address WHERE org_id=$1 LIMIT 1`,
          [user.org_id],
        )
        : Promise.resolve({ rows: [] }),

      user.org_id
        ? query(
          `
            SELECT EXISTS (
              SELECT 1 FROM subscription_details
              WHERE org_id=$1
                AND (metadata->>'free'='true'
                    OR metadata->'flags'->>'free'='true')
            ) AS value
          `,
          [user.org_id],
        )
        : Promise.resolve({ rows: [{ value: false }] }),

      user.org_id
        ? query(
          `
            SELECT EXISTS (
              SELECT 1 FROM subscription_details
              WHERE org_id=$1
                AND (metadata->>'source'='aws'
                    OR metadata->>'free' IS DISTINCT FROM 'true')
            ) AS value
          `,
          [user.org_id],
        )
        : Promise.resolve({ rows: [{ value: false }] }),
    ])

    /* -----------------------------------
     * PLAN EXPIRY (FINAL)
     * ----------------------------------- */
    let planExpiry: string | null = null
    if (user.plan_start_date && planDetails?.duration) {
      const d = new Date(user.plan_start_date)
      planDetails.duration.toLowerCase() === 'yearly'
        ? d.setFullYear(d.getFullYear() + 1)
        : d.setMonth(d.getMonth() + 1)
      planExpiry = d.toISOString()
    }

    /* -----------------------------------
     * RESPONSE
     * ----------------------------------- */
    return {
      statusCode: 200,
      status: 'success',
      message: 'User profile fetched successfully',
      data: {
        ...user,
        plan_id: finalPlanId,
        plan_name: finalPlanName,
        plan_expiry: planExpiry,
        plan_details: planDetails,
        subscription_status: subscriptionStatus,
        billing_address: billingRes.rows[0] || null,
        has_availed_free_plan: freeRes.rows[0]?.value === true,
        has_availed_paid_plan: paidRes.rows[0]?.value === true,
      },
    }
  } catch (err) {
    console.error(err)
    throw new CustomError('Failed to fetch user profile', 500)
  }
})
