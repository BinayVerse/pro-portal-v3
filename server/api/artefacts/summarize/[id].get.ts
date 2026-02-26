import { defineEventHandler, getRouterParam, setResponseStatus, getQuery } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'
import { summarizeDocument } from '~/server/utils/summarizeDocument'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const bucketName = config.awsBucketName
    const folderName = config.awsFolderName

    const token = event.node.req.headers['authorization']?.split(' ')[1]
    if (!token) {
        throw new CustomError('Unauthorized: No token provided', 401)
    }

    let userId
    try {
        const decodedToken = jwt.verify(token, config.jwtToken as string)
        userId = (decodedToken as { user_id: any }).user_id
    } catch {
        throw new CustomError('Unauthorized: Invalid token', 401)
    }

    const documentId = getRouterParam(event, 'id')
    if (!documentId) {
        throw new CustomError('Document ID is required', 400)
    }

    try {
        // Step 1: Validate org
        const userQuery = `
            SELECT u.org_id, u.role_id, o.org_name
            FROM users u
            INNER JOIN organizations o ON u.org_id = o.org_id
            WHERE u.user_id = $1;
        `
        const userResult = await query(userQuery, [userId])

        if (userResult.rows.length === 0) {
            throw new CustomError('User or organization not found', 404)
        }

        const tokenUserOrg = userResult.rows[0].org_id
        const tokenUserRole = userResult.rows[0].role_id

        // Allow org override via query param (for superadmin)
        const q = getQuery(event) as Record<string, any>
        const requestedOrg = q?.org || q?.org_id || null

        // Only allow superadmin to override org
        const effectiveOrg = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

        // Fetch org_name for effectiveOrg
        const orgRow = await query('SELECT org_name FROM organizations WHERE org_id = $1 LIMIT 1', [effectiveOrg])
        if (!orgRow?.rows?.length) throw new CustomError('Organization not found', 404)
        const org_name = orgRow.rows[0].org_name

        // Step 2: Fetch and verify document
        const documentQuery = `
            SELECT id, name, doc_type, document_link, status
            FROM organization_documents
            WHERE org_id = $1 AND id = $2;
        `
        const documentResult = await query(documentQuery, [effectiveOrg, documentId])

        if (documentResult.rows.length === 0) {
            throw new CustomError('Document not found for the organization', 404)
        }

        const doc = documentResult.rows[0]

        // Step 3: Check if document is processed
        if (doc.status !== 'processed') {
            throw new CustomError('Document must be processed before summarization', 400)
        }

        const documentData = [{
            id: doc.id,
            name: doc.name,
            type: 'document',
            link: doc.document_link,
        }]

        // Step 4: Process summarization
        await summarizeDocument(bucketName, folderName, org_name, effectiveOrg, userId, documentData, token)

        // Set 200 OK for successful summarization
        setResponseStatus(event, 200)
        return {
            statusCode: 200,
            status: 'success',
            message: 'Document summarized successfully',
        }
    } catch (err: any) {
        throw new CustomError(err.message || 'Failed to summarize document', 500)
    }
})
