// server/api/analytics/[id]/daily-token-usage.get.ts

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

    // Caller role check — only superadmin can view other orgs
    const roleRes = await query(
        `SELECT role_id FROM users WHERE user_id = $1 LIMIT 1`,
        [userId]
    )
    const callerRole = Number(roleRes?.rows?.[0]?.role_id)
    if (callerRole !== 0 && decoded.org_id !== org_id) {
        throw new CustomError("Forbidden: You don't have access to this organization", 403)
    }

    // Organization check
    const orgCheck = await query(
        'SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1',
        [org_id]
    )
    if (orgCheck.rowCount === 0) {
        throw new CustomError('Organization not found', 404)
    }

    // -------------------------
    // VALIDATE DATES + LIMIT + TIMEZONE
    // -------------------------
    const { startDate, endDate, limit = 10, timezone } = getQuery(event)

    if (!startDate || !endDate) {
        throw new CustomError('Bad Request: startDate and endDate are required', 400)
    }

    if (!timezone) {
        throw new CustomError('Bad Request: timezone is required', 400)
    }

    if (!/^[A-Za-z_\/]+$/.test(timezone as string)) {
        throw new CustomError('Invalid timezone format', 400)
    }

    const topUserLimit = Number(limit) || 10

    // -------------------------
    // STEP 1 — Get TOP N Users
    // -------------------------
    const topUsersSQL = `
        SELECT user_id
        FROM token_cost_calculation
        WHERE org_id = $1
        AND ((created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        GROUP BY user_id
        ORDER BY SUM(total_tokens) DESC
        LIMIT $5;
    `

    const topUsersRes = await query(topUsersSQL, [
        org_id,
        startDate,
        endDate,
        timezone,
        topUserLimit
    ])

    const topUserIds = topUsersRes.rows.map((r) => r.user_id)

    if (topUserIds.length === 0) {
        return {
            statusCode: 200,
            data: [],
            message: 'No usage found for selected date range',
            meta: { startDate, endDate, org_id },
        }
    }

    // -------------------------
    // STEP 2 — DAILY USAGE FOR TOP N USERS
    // -------------------------
    const sql = `
        SELECT
            u.user_id,
            u.name,
            TO_CHAR(((t.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date, 'YYYY-MM-DD') AS date,
            SUM(t.total_tokens)::BIGINT AS total_tokens,
            SUM(t.total_cost)::FLOAT AS total_cost
        FROM token_cost_calculation t
        JOIN users u
        ON t.user_id = u.user_id
        AND t.org_id  = u.org_id
        WHERE t.org_id = $1
        AND t.user_id = ANY($5)
        AND ((t.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        GROUP BY u.user_id, u.name, ((t.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date
        ORDER BY u.user_id, date;
    `

    try {
        const { rows } = await query(sql, [
            org_id,
            startDate,
            endDate,
            timezone,
            topUserIds,
        ])

        // Group by user
        const grouped: Record<string, any> = {}

        rows.forEach((row) => {
            if (!grouped[row.user_id]) {
                grouped[row.user_id] = {
                    user_id: row.user_id,
                    name: row.name,
                    token_usage_details: [],
                    total_tokens_sum: 0,
                    total_cost_sum: 0,
                }
            }
            grouped[row.user_id].token_usage_details.push({
                date: row.date,
                total_tokens: Number(row.total_tokens),
                total_cost: Number(row.total_cost),
            })
            grouped[row.user_id].total_tokens_sum += Number(row.total_tokens)
            grouped[row.user_id].total_cost_sum += Number(row.total_cost)
        })

        return {
            statusCode: 200,
            data: Object.values(grouped),
            message: 'Daily user-wise token usage fetched successfully',
            meta: {
                startDate,
                endDate,
                org_id,
            },
        }
    } catch (error) {
        if (process.dev) console.error('SQL error:', error)
        throw new CustomError(
            'Internal Server Error: Failed to fetch daily token usage',
            500
        )
    }
})
