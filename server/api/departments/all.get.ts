import { defineEventHandler, setResponseStatus, getQuery } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
    const config = useRuntimeConfig()
    const token = event.node.req.headers.authorization?.split(' ')[1]

    if (!token) {
        setResponseStatus(event, 401)
        throw new CustomError('Unauthorized', 401)
    }

    let callerUserId: string
    try {
        const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: string }
        callerUserId = decoded.user_id
    } catch {
        setResponseStatus(event, 401)
        throw new CustomError('Invalid token', 401)
    }

    const caller = await query(
        'SELECT org_id, role_id FROM users WHERE user_id = $1',
        [callerUserId],
    )

    if (!caller.rows.length) {
        setResponseStatus(event, 404)
        throw new CustomError('Caller not found', 404)
    }

    const { org_id: callerOrg, role_id } = caller.rows[0]

    const q = getQuery(event)
    const orgId =
        role_id === 0 && (q.org || q.org_id)
            ? String(q.org || q.org_id)
            : callerOrg

    /* -----------------------------------------
     * Department-wise counts
     * ---------------------------------------*/
    const departments = await query(
        `
    SELECT
      d.dept_id AS id,
      d.name,
      d.description,
      d.status,
      COUNT(DISTINCT ud.user_id)::int AS users,
      COUNT(DISTINCT dd.document_id)::int AS artifacts
    FROM organization_departments d
    LEFT JOIN user_departments ud ON ud.dept_id = d.dept_id
    LEFT JOIN document_departments dd ON dd.dept_id = d.dept_id
    WHERE d.org_id = $1
    GROUP BY d.dept_id
    ORDER BY d.created_at DESC
    `,
        [orgId],
    )

    /* -----------------------------------------
     * "ALL" = users/docs assigned to ANY department
     * ---------------------------------------*/
    const allStats = await query(
        `
    SELECT
      (SELECT COUNT(DISTINCT ud.user_id)::int
       FROM user_departments ud
       WHERE ud.org_id = $1) AS users,
      (SELECT COUNT(DISTINCT dd.document_id)::int
       FROM document_departments dd
       WHERE dd.org_id = $1) AS artifacts
    `,
        [orgId],
    )

    setResponseStatus(event, 200)
    return {
        statusCode: 200,
        status: 'success',
        data: [
            {
                id: 'ALL',
                name: 'All',
                description: 'All departments',
                status: 'active',
                users: allStats.rows[0].users,
                artifacts: allStats.rows[0].artifacts,
            },
            ...departments.rows,
        ],
        message: 'Departments fetched successfully',
    }
})
