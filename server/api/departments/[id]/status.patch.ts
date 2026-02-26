import { defineEventHandler, readBody, getRouterParam, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const deptId = getRouterParam(event, 'id')
    const { status } = await readBody(event)
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

    // 🔑 VALIDATION: Prevent deactivation if department has active users or artifacts
    if (status === 'inactive') {
      // Check for active users mapped to this department
      const activeUsersResult = await query(
        `
          SELECT COUNT(*) as user_count FROM user_departments ud
          INNER JOIN users u ON ud.user_id = u.user_id
          WHERE ud.dept_id = $1 AND u.org_id = $2 AND u.is_active = true
        `,
        [deptId, orgId]
      )

      const activeUserCount = Number(activeUsersResult.rows[0].user_count)

      if (activeUserCount > 0) {
        setResponseStatus(event, 400)
        throw new CustomError(
          'Department cannot be deactivated as it is assigned to active users/artifact.',
          400
        )
      }

      // Check for artifacts mapped to this department
      const artifactsResult = await query(
        `
          SELECT COUNT(*) as artifact_count FROM document_departments dd
          INNER JOIN organization_documents od ON dd.document_id = od.id
          WHERE dd.dept_id = $1 AND od.org_id = $2
        `,
        [deptId, orgId]
      )

      const artifactCount = Number(artifactsResult.rows[0].artifact_count)

      if (artifactCount > 0) {
        setResponseStatus(event, 400)
        throw new CustomError(
          'Department cannot be deactivated as it is assigned to active users/artifact.',
          400
        )
      }
    }

    await query(
        `
            UPDATE organization_departments
            SET status = $1, updated_at = now(), updated_by = $4
            WHERE dept_id = $2 AND org_id = $3
        `,
        [status, deptId, orgId, userId],
    )

    setResponseStatus(event, 200)
    return {
        statusCode: 200,
        status: 'success',
        message: `Department ${status === 'active' ? 'activated' : 'deactivated'} successfully`,
    }
})
