import { defineEventHandler, getHeaders, setResponseStatus } from 'h3';
import jwt from 'jsonwebtoken';
import { query } from '../../../utils/db';
import { CustomError } from '../../../utils/custom.error';

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig();
    const headers = getHeaders(event);

    const authHeader = headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new CustomError('Missing or invalid Authorization header', 401);
    }

    const token = authHeader.split(' ')[1];
    // Determine effective org: prefer query param for superadmin
    let orgId: string;
    let userId: any
    try {
        const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: number };
        userId = decoded.user_id;
    } catch {
        throw new CustomError('Invalid or expired token', 401);
    }

    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      throw new CustomError('User not found', 404);
    }
    const tokenUserOrg = userRow.rows[0].org_id
    const tokenUserRole = userRow.rows[0].role_id

    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || null
    orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg;

    // Check if a mapping exists before updating
    const checkMapping = await query(
        `SELECT status FROM teams_tenant_mappings WHERE org_id = $1 AND status = 'active'`,
        [orgId]
    );

    if (!checkMapping.rows.length) {
        throw new CustomError('No active Teams mapping found for this organization', 404);
    }

    try {
        await query(
            `DELETE FROM public.teams_tenant_mappings WHERE org_id = $1`,
            [orgId]
        );

        // Remove persistent notification suppression for teams so reconnect can notify again
        try {
            await query(
                `DELETE FROM channel_notifications WHERE org_id = $1 AND channel = $2`,
                [orgId, 'teams']
            );
        } catch (err2) {
            console.warn('Failed to remove channel_notifications entry for teams:', err2);
        }

        setResponseStatus(event, 200);
        return {
            statusCode: 200,
            message: 'Teams disconnected successfully',
        };
    } catch (err) {
        console.error('DB error (Teams disconnect):', err);
        throw new CustomError('Failed to disconnect Teams tenant.', 500);
    }
});
