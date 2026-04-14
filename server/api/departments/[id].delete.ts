import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const deptId = getRouterParam(event, 'id')
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

    // Check if the department exists and get its details
    const deptCheck = await query(
        'SELECT dept_id, is_system, name FROM organization_departments WHERE dept_id = $1 AND org_id = $2',
        [deptId, orgId],
    )

    if (!deptCheck.rows.length) {
        setResponseStatus(event, 404)
        throw new CustomError('Department not found', 404)
    }

    const { is_system, name } = deptCheck.rows[0]

    // Prevent deletion of system departments (like "Common")
    if (is_system) {
        setResponseStatus(event, 403)
        throw new CustomError(`Cannot delete system department "${name}"`, 403)
    }

    // Delete the department
    // Foreign key constraints with ON DELETE CASCADE will handle cleanup
    await query(
        'DELETE FROM organization_departments WHERE dept_id = $1 AND org_id = $2',
        [deptId, orgId],
    )

    setResponseStatus(event, 200)
    return {
        statusCode: 200,
        status: 'success',
        message: `Department "${name}" deleted successfully`,
    }
})
