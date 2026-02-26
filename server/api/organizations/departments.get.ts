import { defineEventHandler, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId: string
  let userRole: number
  let userOrgId: string

  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    userId = String(decodedToken.user_id)
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userResult = await query(
    'SELECT org_id, role_id FROM users WHERE user_id = $1',
    [userId],
  )

  if (!userResult?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found', 404)
  }

  userOrgId = userResult.rows[0].org_id
  userRole = Number(userResult.rows[0].role_id)

  // Superadmin org override
  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  const orgId = userRole === 0 && requestedOrg ? String(requestedOrg) : userOrgId

  try {
    // 🔑 Department Admin: restrict to assigned departments (for management operations)
    if (userRole === 3) {
      const deptIdsResult = await query(
        `SELECT dept_id FROM user_departments WHERE user_id = $1`,
        [userId],
      )

      const deptIds = deptIdsResult.rows.map(r => r.dept_id)

      // No departments assigned → return empty list
      if (!deptIds.length) {
        return {
          statusCode: 200,
          status: 'success',
          data: [],
        }
      }

      const result = await query(
        `
        SELECT dept_id, org_id, name, description, status, created_at, updated_at
        FROM organization_departments
        WHERE org_id = $1
          AND status = 'active'
          AND dept_id = ANY($2)
        ORDER BY name ASC
        `,
        [orgId, deptIds],
      )

      return {
        statusCode: 200,
        status: 'success',
        data: result.rows || [],
      }
    }

    // ✅ Admin / User / Super Admin → all departments
    const result = await query(
      `
      SELECT dept_id, org_id, name, description, status, created_at, updated_at
      FROM organization_departments
      WHERE org_id = $1
        AND status = 'active'
      ORDER BY name ASC
      `,
      [orgId],
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: result.rows || [],
    }
  } catch (err: any) {
    console.error('Error fetching departments:', err)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to fetch departments', 500)
  }
})
