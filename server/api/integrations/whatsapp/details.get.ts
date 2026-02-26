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
