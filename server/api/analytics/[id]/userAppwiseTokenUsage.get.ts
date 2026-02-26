// server/api/analytics/[id]/user-app-wise.get.ts

import { defineEventHandler, getQuery, getRouterParam } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const org_id = getRouterParam(event, 'id')

  // -------------------------
  // AUTH CHECK
  // -------------------------
  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) throw new CustomError('Unauthorized: No token provided', 401)

  let decoded: any
  try {
    decoded = jwt.verify(token, config.jwtToken as string)
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userId = decoded.user_id
  const { startDate, endDate, timezone } = getQuery(event) as {
    startDate: string
    endDate: string
    timezone: string
  }

  if (!startDate || !endDate) {
    throw new CustomError('Bad Request: startDate and endDate are required', 400)
  }

  if (!timezone) {
    throw new CustomError('Bad Request: timezone is required', 400)
  }

  if (!/^[A-Za-z_\/]+$/.test(timezone)) {
    throw new CustomError('Invalid timezone format', 400)
  }

  // Caller role check
  const roleRes = await query(
    `SELECT role_id FROM users WHERE user_id = $1 LIMIT 1`,
    [userId]
  )
  const callerRole = Number(roleRes?.rows?.[0]?.role_id)

  // Only superadmin can view other orgs
  if (callerRole !== 0 && decoded.org_id !== org_id) {
    throw new CustomError("Forbidden: You don't have access to this organization", 403)
  }

  // Validate org exists
  const orgCheck = await query(
    `SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1`,
    [org_id]
  )
  if (orgCheck.rowCount === 0) {
    throw new CustomError('Organization not found', 404)
  }

  // -------------------------
  // MAIN USAGE QUERY (FIXED)
  // -------------------------
  const usageQuery = `
    WITH per_app AS (
        SELECT
            u.user_id,
            u.email,
            u.name,
            t.request_type,
            SUM(t.total_tokens) AS total_tokens,
            SUM(t.total_cost) AS total_cost
        FROM users u
        JOIN token_cost_calculation t
          ON u.user_id = t.user_id
         AND u.org_id  = t.org_id
        WHERE t.org_id = $1
          AND ((t.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        GROUP BY u.user_id, u.email, u.name, t.request_type
    ),
    ordered AS (
        SELECT *
        FROM per_app
        ORDER BY user_id, total_tokens DESC
    )
    SELECT
        o.user_id,
        o.email,
        o.name,
        SUM(o.total_tokens) AS total_tokens_sum,
        SUM(o.total_cost) AS total_cost_sum,
        jsonb_agg(
            jsonb_build_object(
                'request_type', o.request_type,
                'total_tokens', o.total_tokens,
                'total_cost', o.total_cost
            )
        ) AS app_wise_usage
    FROM ordered o
    GROUP BY o.user_id, o.email, o.name
    ORDER BY total_tokens_sum DESC;
  `

  // -------------------------
  // ACTIVE USERS QUERY (FIXED)
  // -------------------------
  const activeUsersQuery = `
    SELECT COUNT(*) AS active_users_count
    FROM users
    WHERE org_id = $1
      AND ((created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date;
  `

  // -------------------------
  // TOTAL QUERIES QUERY (FIXED)
  // -------------------------
  const totalQueriesQuery = `
    SELECT COUNT(*) AS total_queries_count
    FROM token_cost_calculation
    WHERE org_id = $1
      AND ((created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
      AND (question_text IS NULL OR question_text NOT ILIKE 'Document summarization:%');
  `

  try {
    // ALL QUERIES NOW USE EXACTLY 4 PARAMS (including timezone)
    const { rows } = await query(usageQuery, [org_id, startDate, endDate, timezone])
    const { rows: activeUsers } = await query(activeUsersQuery, [
      org_id,
      startDate,
      endDate,
      timezone,
    ])
    const { rows: totalQueries } = await query(totalQueriesQuery, [
      org_id,
      startDate,
      endDate,
      timezone,
    ])

    return {
      statusCode: 200,
      data: rows,
      message:
        rows.length > 0
          ? 'User-wise app-wise token usage data fetched successfully'
          : 'No analytics available for this date range',
      meta: {
        org_id,
        startDate,
        endDate,
        timezone,
        active_users_count: Number(activeUsers[0]?.active_users_count || 0),
        total_queries_count: Number(totalQueries[0]?.total_queries_count || 0),
      },
    }
  } catch (err) {
    if (process.dev) console.error('SQL execution error:', err)
    throw new CustomError(
      'Internal Server Error: Failed to fetch token usage data',
      500
    )
  }
})
