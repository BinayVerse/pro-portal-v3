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

    try {
        const result = await query(
            `SELECT tenant_id, app_id, status, service_url, created_at, updated_at
            FROM teams_tenant_mappings
            WHERE org_id = $1 ORDER BY updated_at DESC LIMIT 1`,
            [orgId]
        );

        setResponseStatus(event, 200);

        if (result.rows.length === 0) {
            return {
                statusCode: 200,
                message: 'No Teams tenant mapping found for this organization',
                data: {
                    tenant_id: '',
                    app_id: '',
                    status: '',
                    service_url: '',
                },
            };
        }

        const row = result.rows[0];

        // If the mapping is active and was updated recently, notify all User-role users once
        try {
            const status = row.status || '';
            const updatedAt = row.updated_at ? new Date(row.updated_at) : null;
            const now = new Date();
            const secondsSinceUpdate = updatedAt ? (now.getTime() - updatedAt.getTime()) / 1000 : Infinity;

            if (status === 'active' && secondsSinceUpdate <= 120) {
                try {
                    const { shouldNotifyChannel, markChannelNotified, sendChannelAvailableMail } = await import('../../helper')
                    const notifyAllowed = await shouldNotifyChannel(orgId, 'teams', 24)
                    if (notifyAllowed) {
                        const users = await query('SELECT name, email FROM users WHERE org_id = $1 AND role_id IN (1,2)', [orgId]);
                        for (const u of users.rows) {
                            try {
                                await sendChannelAvailableMail(u.name, u.email, 'teams', undefined, orgId);
                            } catch (e) {
                                console.error('Failed to send Teams availability email to', u.email, e?.message || e);
                            }
                        }
                        await markChannelNotified(orgId, 'teams')
                    }
                } catch (e) {
                    console.error('Failed to notify users about Teams availability', e?.message || e);
                }
            }
        } catch (e) {
            console.error('Teams notification check failed:', e?.message || e);
        }

        return {
            statusCode: 200,
            message: 'Teams tenant details fetched successfully',
            data: row,
        };
    } catch (err) {
        console.error('DB error (Teams details):', err);
        throw new CustomError('Failed to fetch Teams tenant details.', 500);
    }
});
