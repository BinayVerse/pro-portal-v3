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

    let orgId: number
    try {
        const decodedToken = jwt.verify(token, config.jwtToken) as { org_id: number }
        orgId = decodedToken.org_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: Invalid token', 401)
    }

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
            `INSERT INTO public.organizations (org_id, org_name, org_whatsapp_number, qr_code) 
                VALUES ($1, $2, $3, $4)
                ON CONFLICT (org_id) 
                DO UPDATE SET 
                    org_name = EXCLUDED.org_name, 
                    org_whatsapp_number = EXCLUDED.org_whatsapp_number, 
                    qr_code = EXCLUDED.qr_code;`,
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
                whatsapp_status
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (org_id) 
            DO UPDATE SET 
                meta_whatsapp_number = EXCLUDED.meta_whatsapp_number,
                access_token = EXCLUDED.access_token,
                app_id = EXCLUDED.app_id,
                app_secret = EXCLUDED.app_secret,
                verify_token = EXCLUDED.verify_token,
                whatsapp_status = EXCLUDED.whatsapp_status;
            `,
            [
                orgId,
                business_whatsapp_number,
                permanent_access_token,
                app_id,
                app_secret_key,
                '',
                true,
            ]
        )

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
