import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import { businessWhatsAppAccount } from '~/server/utils/validations'
import jwt from 'jsonwebtoken'
import { generateQRCode } from '~/server/utils/generate_qr'

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

    // Fetch user's org and role from DB
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

    const {
        business_whatsapp_number,
        permanent_access_token,
        app_id,
        app_secret_key,
    } = await readBody(event)

    const validation = businessWhatsAppAccount.safeParse({
        business_whatsapp_number,
        permanent_access_token,
        app_id,
        app_secret_key,
    })

    if (!validation.success) {
        setResponseStatus(event, 400)
        throw new CustomError(validation.error.issues[0].message, 400)
    }

    try {
        const orgResult = await query(
            'SELECT org_name FROM public.organizations WHERE org_id = $1 LIMIT 1',
            [orgId]
        )

        if (orgResult.rows.length === 0) {
            setResponseStatus(event, 404)
            throw new CustomError("Organization not found.", 404)
        }

        const orgName = orgResult.rows[0].org_name

        const existingNumber = await query(
            'SELECT org_id FROM public.meta_app_details WHERE meta_whatsapp_number = $1 LIMIT 1',
            [business_whatsapp_number]
        )

        if (existingNumber.rows.length > 0) {
            setResponseStatus(event, 409)
            throw new CustomError('This WhatsApp number is already in use by another organization.', 409)
        }

        const qrCode = await generateQRCode(orgName, business_whatsapp_number)

        await query(
            `INSERT INTO public.organizations (org_id, org_name, org_whatsapp_number, qr_code, created_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (org_id)
                DO UPDATE SET
                    org_name = EXCLUDED.org_name,
                    org_whatsapp_number = EXCLUDED.org_whatsapp_number,
                    qr_code = EXCLUDED.qr_code,
                    updated_at = NOW();`,
            [orgId, orgName, business_whatsapp_number, qrCode]
        )

        await query(
            `INSERT INTO public.meta_app_details (
                org_id,
                meta_whatsapp_number,
                access_token,
                app_id,
                app_secret,
                verify_token,
                whatsapp_status,
                added_by,
                created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (org_id)
            DO UPDATE SET
                meta_whatsapp_number = EXCLUDED.meta_whatsapp_number,
                access_token = EXCLUDED.access_token,
                app_id = EXCLUDED.app_id,
                app_secret = EXCLUDED.app_secret,
                verify_token = EXCLUDED.verify_token,
                whatsapp_status = EXCLUDED.whatsapp_status,
                updated_by = EXCLUDED.added_by,
                updated_at = NOW();
            `,
            [
                orgId,
                business_whatsapp_number,
                permanent_access_token,
                app_id,
                app_secret_key,
                '',
                true,
                userId,
            ]
        )

        // Notify all 'user' role users about WhatsApp availability by sending QR invite
        try {
            const { shouldNotifyChannel, markChannelNotified, sendChannelAvailableMail } = await import('../../helper')
            const notifyAllowed = await shouldNotifyChannel(orgId, 'whatsapp', 24)
            if (notifyAllowed) {
                const users = await query('SELECT name, email FROM users WHERE org_id = $1 AND role_id IN (1,2)', [orgId])
                for (const u of users.rows) {
                    try {
                        await sendChannelAvailableMail(u.name, u.email, 'whatsapp', qrCode, orgId)
                    } catch (e) {
                        console.error('Failed to send WhatsApp available notification to', u.email, e?.message || e)
                    }
                }
                await markChannelNotified(orgId, 'whatsapp')
            }
        } catch (e) {
            console.error('Failed to fetch users for WhatsApp notification', e?.message || e)
        }

        setResponseStatus(event, 201)
        return {
            statusCode: 201,
            status: 'success',
            data: { business_whatsapp_number },
            message: 'Business WhatsApp Account added successfully',
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
        throw new CustomError(error.message || 'Failed to add Meta Business WhatsApp Account', 500)
    }
})
