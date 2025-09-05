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

    let userId;
    try {
        const decodedToken = jwt.verify(token, config.jwtToken as string);
        userId = (decodedToken as { user_id: number }).user_id;
    } catch {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    // Check if user has access to this organization
    const accessResult = await query(
        'SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1',
        [org_id]
    );
    if (accessResult.rowCount === 0) {
        console.log("accessResult",accessResult)
        throw new CustomError("Forbidden: You don't have access to this organization", 403);
    }

    // Check if org exists
    const orgCheck = await query('SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1', [org_id]);
    if (orgCheck.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

    const { startDate, endDate, timezone } = getQuery(event);

    if (!startDate || !endDate || !timezone) {
        throw new CustomError('Bad Request: startDate, endDate, and timezone are required', 400);
    }

    if (!/^[A-Za-z_\/]+$/.test(timezone as string)) {
        throw new CustomError('Invalid timezone format', 400);
    }

    const queryText = `
        SELECT 
            u.user_id,
            u.email,
            u.name,
            COALESCE(SUM(t.total_tokens), 0) AS total_tokens_sum,
            COALESCE(jsonb_agg(
                CASE 
                WHEN t.created_at IS NOT NULL THEN
                    jsonb_build_object(
                    'date', (t.created_at AT TIME ZONE $4)::date,
                    'total_tokens', t.total_tokens,
                    'total_cost', t.total_cost
                    )
                ELSE NULL
                END
            ) FILTER (WHERE t.created_at IS NOT NULL), '[]') AS token_usage_details
        FROM 
            users u
        LEFT JOIN token_cost_calculation t 
            ON u.user_id = t.user_id
            AND t.org_id = $1
            AND (t.created_at AT TIME ZONE $4)::date BETWEEN $2::date AND $3::date
        WHERE 
            u.org_id = $1
        GROUP BY 
            u.user_id
        ORDER BY 
            total_tokens_sum DESC
        LIMIT 10;
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
            message: rows.length > 0
                ? 'User-wise token usage data fetched successfully'
                : 'No users found for the specified organization',
            meta: {
                startDate,
                endDate,
                timezone,
                org_id,
            },
        };
    } catch (error) {
        console.error(error);
        throw new CustomError(
            'Internal Server Error: Failed to fetch token usage data',
            500
        );
    }
});
