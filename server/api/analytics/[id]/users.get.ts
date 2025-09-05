import { defineEventHandler, getRouterParam } from 'h3';
import { query } from '../../../utils/db';
import { CustomError } from '../../../utils/custom.error';
import jwt from 'jsonwebtoken';

export default defineEventHandler(async (event) => {
    const orgId = getRouterParam(event, 'id');

    if (!orgId) {
        throw new CustomError('Bad Request: Missing organization ID', 400);
    }

    const token = event.node.req.headers['authorization']?.split(' ')[1];
    if (!token) {
        throw new CustomError('Unauthorized: No token provided', 401);
    }

    let userId;
    try {
        const decodedToken = jwt.verify(token, useRuntimeConfig().jwtToken as string);
        userId = (decodedToken as { user_id: number }).user_id;
    } catch (error) {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    // Access check
    const accessCheck = await query(
        'SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1',
        [orgId]
    );
    if (accessCheck.rowCount === 0) {
        throw new CustomError("Forbidden: You don't have access to this organization", 403);
    }

    // Org existence check
    const orgExists = await query('SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1', [orgId]);
    if (orgExists.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

    try {
        const users = await query(
            `SELECT 
                u.user_id, 
                u.name, 
                u.email,
                COALESCE(u.contact_number, '-') AS contact_number, 
                u.role_id, 
                u.added_by,
                u.primary_contact, 
                o.org_name, 
                COALESCE(r.role_name, '-') AS role,
                u.updated_at,
                CASE 
                    WHEN u.added_by = 'slack_auto_provision' THEN 'Slack' 
                    ELSE 'Whatsapp' 
                END AS source
            FROM users u
            LEFT JOIN organizations o ON u.org_id = o.org_id
            LEFT JOIN roles r ON u.role_id = r.role_id
            WHERE u.org_id = $1
            ORDER BY TRIM(LOWER(u.name)) NULLS LAST`,
            [orgId]
        );

        return {
            statusCode: 200,
            data: users.rows ?? [],
            message: users?.rows?.length
                ? 'Users fetched successfully'
                : 'No users found in the specified organization',
        };
    } catch (err) {
        console.error('Error fetching users:', err);
        throw new CustomError('Internal Server Error: Failed to fetch users', 500);
    }
});
