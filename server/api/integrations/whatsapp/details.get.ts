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
        const result = await query(
            `SELECT 
                meta_whatsapp_number AS business_whatsapp_number, 
                whatsapp_status, 
                access_token AS permanent_access_token, 
                app_id, 
                app_secret AS app_secret_key 
            FROM public.meta_app_details 
            WHERE org_id = $1 
            LIMIT 1`,
            [orgId]
        )

        const row = result.rows[0]

        if (
            !row ||
            !row.business_whatsapp_number?.trim()
        ) {
            setResponseStatus(event, 200)
            return {
                statusCode: 200,
                status: 'partial',
                message: 'Meta app details incomplete or WhatsApp number not configured.',
                data: null
            }
        }

        setResponseStatus(event, 200)
        return {
            statusCode: 200,
            status: 'success',
            data: row
        }
    } catch (error: any) {
        if (error instanceof CustomError) {
            setResponseStatus(event, error.statusCode)
            return {
                statusCode: error.statusCode,
                status: 'error',
                message: error.message,
            }
        }
        setResponseStatus(event, 500)
        throw new CustomError(error.message || 'Failed to fetch Meta Business WhatsApp Account', 500)
    }
})
