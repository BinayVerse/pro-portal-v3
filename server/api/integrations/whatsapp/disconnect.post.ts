import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = event.node.req.headers['authorization']?.split(' ')[1]

    if (!token) {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: No token provided', 401)
    }

    // Determine effective org: prefer query param for superadmin
    let orgId: number
    let userId: any
    try {
        const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
        userId = decodedToken.user_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: Invalid token', 401)
    }

    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }
    const tokenUserOrg = userRow.rows[0].org_id
    const tokenUserRole = userRow.rows[0].role_id

    const q = getQuery(event) as Record<string, any>
    const requestedOrg = q?.org || q?.org_id || null
    orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

    try {
        await query('BEGIN')

        // Check if organization exists
        const orgExists = await query(
            'SELECT org_name FROM public.organizations WHERE org_id = $1 LIMIT 1',
            [orgId]
        )

        if (orgExists.rows.length === 0) {
            setResponseStatus(event, 404)
            throw new CustomError('Organization not found.', 404)
        }

        // Delete meta_app_details row for this organization (remove WhatsApp app record)
        await query(
            `DELETE FROM public.meta_app_details WHERE org_id = $1;`,
            [orgId]
        )

        // Clear WhatsApp number and QR code from organizations table
        await query(
            `UPDATE public.organizations
             SET org_whatsapp_number = NULL,
                 qr_code = NULL
             WHERE org_id = $1;`,
            [orgId]
        )

        // Remove persistent notification suppression for whatsapp so reconnect can notify again
        await query(
            `DELETE FROM channel_notifications WHERE org_id = $1 AND channel = $2`,
            [orgId, 'whatsapp']
        )

        await query('COMMIT')

        setResponseStatus(event, 200)
        return {
            statusCode: 200,
            status: 'success',
            message: 'WhatsApp integration disconnected successfully'
        }

    } catch (error: any) {
        await query('ROLLBACK')
        
        if (error instanceof CustomError) {
            setResponseStatus(event, error.statusCode)
            return {
                statusCode: error.statusCode,
                status: 'error',
                message: error.message,
            }
        }
        setResponseStatus(event, 500)
        throw new CustomError(error.message || 'Failed to disconnect WhatsApp integration', 500)
    }
})
