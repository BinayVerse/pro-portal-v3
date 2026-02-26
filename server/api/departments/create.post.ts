import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const { name, description } = await readBody(event)
    const config = useRuntimeConfig()
    const token = event.node.req.headers.authorization?.split(' ')[1]

    if (!token) {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized', 401)
    }

    let userId: string
    try {
        userId = (jwt.verify(token, config.jwtToken as string) as any).user_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Invalid token', 401)
    }

    const user = await query(
        'SELECT org_id FROM users WHERE user_id = $1',
        [userId],
    )

    if (!user.rows.length) {
        setResponseStatus(event, 404)
        throw new CustomError('User not found', 404)
    }

    const orgId = user.rows[0].org_id

    // Unique name per org
    const exists = await query(
        'SELECT 1 FROM organization_departments WHERE org_id = $1 AND lower(name) = lower($2)',
        [orgId, name],
    )

    if (exists.rows.length) {
        setResponseStatus(event, 409)
        throw new CustomError('Department name already exists', 409)
    }

    const result = await query(
        `
            INSERT INTO organization_departments (org_id, name, description, status, created_by)
            VALUES ($1, $2, $3, 'active', $4)
            RETURNING dept_id AS id, name, description, status
        `,
        [orgId, name, description, userId],
    )

    setResponseStatus(event, 201)
    return {
        statusCode: 201,
        status: 'success',
        data: result.rows[0],
    }
})
