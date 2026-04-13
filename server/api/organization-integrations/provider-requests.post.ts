import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import jwt from 'jsonwebtoken'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import { sendProviderRequestMail } from '../helper'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = event.node.req.headers['authorization']?.split(' ')[1]

    if (!token) {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: No token provided', 401)
    }

    let userId: string

    try {
        const decoded = jwt.verify(token, config.jwtToken as string)
        userId = (decoded as { user_id: string }).user_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized: Invalid token', 401)
    }

    try {
        // Get user details
        const userRes = `
            SELECT u.org_id, u.role_id, u.name, u.email, o.org_name
            FROM users u
            INNER JOIN organizations o ON u.org_id = o.org_id
            WHERE u.user_id = $1;
        `
        const userResult = await query(userRes, [userId])

        if (!userResult.rows.length) {
            setResponseStatus(event, 404)
            throw new CustomError('User not found', 404)
        }

        const user = userResult.rows[0]

        const body = await readBody(event)

        // ✅ Validation
        const requiredFields = ['provider_name', 'website_url']

        for (const field of requiredFields) {
            if (!body[field]) {
                setResponseStatus(event, 400)
                throw new CustomError(`Missing required field: ${field}`, 400)
            }
        }

        // Normalize modules
        let modulesRequired: string[] = []

        if (body.modules) {
            if (Array.isArray(body.modules)) {
                modulesRequired = body.modules
            } else if (typeof body.modules === 'string') {
                modulesRequired = body.modules
                    .split(',')
                    .map((m: string) => m.trim())
                    .filter((m: string) => m.length > 0)
            }
        }

        // ✅ Send Email
        await sendProviderRequestMail({
            provider_name: body.provider_name,
            website_url: body.website_url,
            notes: body.notes,
            contact_email: body.contact_email || user.email,
            requested_by: user.name,
            organization_name: user.org_name,
        })

        setResponseStatus(event, 201)

        return {
            statusCode: 201,
            status: 'success',
            message:
                'Your integration request has been submitted. Our team will contact you soon.',
        }
    } catch (error: any) {
        console.error('Provider Request Error:', error)

        if (error instanceof CustomError) {
            setResponseStatus(event, error.statusCode)
            return {
                statusCode: error.statusCode,
                status: 'error',
                message: error.message,
            }
        }

        setResponseStatus(event, 500)
        return {
            statusCode: 500,
            status: 'error',
            message: 'Failed to submit provider request',
        }
    }
})