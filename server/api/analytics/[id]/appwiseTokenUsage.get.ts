import { defineEventHandler, getQuery, getRouterParam } from 'h3';
import { query } from '../../../utils/db';
import { CustomError } from '../../../utils/custom.error';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const org_id = getRouterParam(event, 'id');
    const token = event.node.req.headers['authorization']?.split(' ')[1];

    if (!token) {
        throw new CustomError('Unauthorized: No token provided', 401);
    }

    let decoded: any;
    let userId: string | undefined;
    try {
        decoded = jwt.verify(token, config.jwtToken as string);
        userId = (decoded as any).user_id
    } catch {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    const roleRes = await query(`SELECT role_id FROM users WHERE user_id = $1 LIMIT 1`, [userId]);
    const callerRole = Number.isFinite(Number(roleRes?.rows?.[0]?.role_id)) ? Number(roleRes.rows[0].role_id) : null
    if (callerRole !== 0) {
        if (decoded.org_id !== org_id) {
            throw new CustomError("Forbidden: You don't have access to this organization", 403);
        }
    }

    const { startDate, endDate, timezone } = getQuery(event);

    if (!startDate || !endDate || !timezone) {
        throw new CustomError(
            'Bad Request: startDate, endDate, and timezone are required',
            400
        );
    }

    if (!/^[A-Za-z_\/]+$/.test(timezone as string)) {
        throw new CustomError('Invalid timezone format', 400);
    }

    // Check if org_id exists in DB
    const orgExistsResult = await query(
        'SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1',
        [org_id]
    );
    if (orgExistsResult.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

    const queryText = `
        WITH request_types AS (
        SELECT UNNEST(ARRAY['whatsapp', 'slack', 'teams', 'admin']) AS request_type
        ),
        usage_data AS (
        SELECT
            t.request_type,
            SUM(t.total_tokens) AS total_tokens,
            SUM(t.total_cost) AS total_cost
        FROM
            token_cost_calculation t
        WHERE
            t.org_id = $1
            AND ((t.created_at AT TIME ZONE 'UTC') AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        GROUP BY
            t.request_type
        )
        SELECT
        INITCAP(rt.request_type) AS name,
        COALESCE(ud.total_tokens, 0) AS total_tokens,
        COALESCE(ud.total_cost, 0) AS total_cost
        FROM
        request_types rt
        LEFT JOIN
        usage_data ud ON rt.request_type = ud.request_type;
    `;

    try {
        const { rows } = await query(queryText, [
            org_id,
            startDate,
            endDate,
            timezone,
        ]);

        return {
            statusCode: 200,
            data: rows,
            message: 'Request-type token usage data fetched successfully',
            meta: {
                startDate,
                endDate,
                timezone,
                org_id,
            },
        };
    } catch (error) {
        if (process.dev) console.error(error);
        throw new CustomError(
            'Internal Server Error: Failed to fetch token usage data',
            500
        );
    }
});
