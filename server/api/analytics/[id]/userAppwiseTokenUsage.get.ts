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
    try {
        decoded = jwt.verify(token, config.jwtToken as string);
    } catch {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    if (decoded.org_id !== org_id && !decoded.isAdmin) {
        throw new CustomError("Forbidden: You don't have access to this organization", 403);
    }

    const { startDate, endDate, timezone } = getQuery(event);

    if (!startDate || !endDate || !timezone) {
        throw new CustomError('Bad Request: startDate, endDate, and timezone are required', 400);
    }

    if (!/^[A-Za-z_\/]+$/.test(timezone as string)) {
        throw new CustomError('Invalid timezone format', 400);
    }

    // validate org
    const orgCheck = await query('SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1', [org_id]);
    if (orgCheck.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

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
        LEFT JOIN token_cost_calculation t
          ON u.user_id = t.user_id
          AND t.org_id = $1
          AND (t.created_at AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        WHERE u.org_id = $1
        GROUP BY u.user_id, u.email, u.name, t.request_type
      )
      SELECT 
        p.user_id,
        p.email,
        p.name,
        COALESCE(SUM(p.total_tokens),0) AS total_tokens_sum,
        COALESCE(SUM(p.total_cost),0) AS total_cost_sum,
        COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'request_type', p.request_type,
              'total_tokens', COALESCE(p.total_tokens,0),
              'total_cost', COALESCE(p.total_cost,0)
            )
          ) FILTER (WHERE p.request_type IS NOT NULL),
          '[]'
        ) AS app_wise_usage
      FROM per_app p
      GROUP BY p.user_id, p.email, p.name
      ORDER BY total_tokens_sum DESC
      LIMIT 10;
    `;

    // active users count
    const activeUsersQuery = `
      SELECT COUNT(DISTINCT user_id) AS active_users_count
      FROM public.users
      WHERE org_id = $1
        AND (created_at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date;
    `;

    // total queries count (distinct id)
    const totalQueriesQuery = `
      SELECT COUNT(DISTINCT id) AS total_queries_count
      FROM public.token_cost_calculation
      WHERE org_id = $1
        AND (created_at AT TIME ZONE $2)::date BETWEEN $3::date AND $4::date;
    `;

    try {
        const { rows } = await query(usageQuery, [org_id, startDate, endDate, timezone]);
        const { rows: activeUsers } = await query(activeUsersQuery, [org_id, timezone, startDate, endDate]);
        const { rows: totalQueries } = await query(totalQueriesQuery, [org_id, timezone, startDate, endDate]);

        return {
            statusCode: 200,
            data: rows,
            message: rows.length > 0
                ? 'User-wise app-wise token usage data fetched successfully'
                : 'No users found for the specified organization',
            meta: { 
                startDate, 
                endDate, 
                timezone, 
                org_id,
                active_users_count: activeUsers[0]?.active_users_count ?? 0,
                total_queries_count: totalQueries[0]?.total_queries_count ?? 0
            },
        };
    } catch (error) {
        console.error('SQL execution error:', error);
        throw new CustomError('Internal Server Error: Failed to fetch token usage data', 500);
    }
});