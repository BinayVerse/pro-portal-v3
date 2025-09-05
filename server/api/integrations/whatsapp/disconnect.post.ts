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

    let orgId: number
    try {
        const decodedToken = jwt.verify(token, config.jwtToken as string) as { org_id: number }
        orgId = decodedToken.org_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: Invalid token', 401)
    }

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
