import { defineEventHandler, getRouterParam, readBody } from 'h3';
import { CustomError } from '../../../utils/custom.error';
import { query } from '../../../utils/db';
import jwt from 'jsonwebtoken';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export default defineEventHandler(async (event) => {
    const orgId = getRouterParam(event, 'id');
    const config = useRuntimeConfig();

    const token = event.node.req.headers['authorization']?.split(' ')[1];
    if (!token) {
        throw new CustomError('Unauthorized: No token provided', 401);
    }

    let userId;
    let decodedToken;
    try {
        decodedToken = jwt.verify(token, config.jwtToken as string);
        userId = (decodedToken as { user_id: number }).user_id;
    } catch (error) {
        throw new CustomError('Unauthorized: Invalid token', 401);
    }

    // Check if organization exists
    const orgExists = await query(
        `SELECT 1 FROM organizations WHERE org_id = $1 LIMIT 1`,
        [orgId]
    );
    if (orgExists.rowCount === 0) {
        throw new CustomError('Organization not found', 404);
    }

    const { timezone: userTz } = await readBody(event);
    const userTimezone = userTz || 'UTC';

    try {
        const documentQuery = `
        SELECT 
            d.id::TEXT AS document_id,
            d.name,
            d.file_size,
            d.content_type,
            d.updated_at,
            COALESCE(dc.name, 'no-category') AS file_category
        FROM organization_documents d
        LEFT JOIN document_category dc 
            ON d.file_category IS NOT NULL 
            AND d.file_category ~ '^[0-9a-fA-F-]{36}$' 
            AND d.file_category = dc.id::TEXT
        WHERE d.org_id = $1
        ORDER BY d.updated_at DESC;
        `;

        const documentResult = await query(documentQuery, [orgId]);

        const documents = documentResult.rows.map((doc: any) => ({
            id: doc.document_id,
            name: doc.name,
            fileSize: doc.file_size,
            contentType: doc.content_type,
            updatedAt: doc.updated_at,
            formattedUpdatedAt: doc.updated_at
                ? dayjs(doc.updated_at).tz(userTimezone).format('DD/MM/YYYY hh:mm A')
                : 'Unknown',
            fileCategory: doc.file_category,
        }));

        return {
            statusCode: 200,
            data: documents,
            message: 'Documents fetched successfully',
        };
    } catch (err: any) {
        console.error('Error fetching documents:', err);
        throw new CustomError(err.message || 'Failed to fetch documents', 500);
    }
});
