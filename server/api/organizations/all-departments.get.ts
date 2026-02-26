import { defineEventHandler, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'

/**
 * Get ALL organization departments without role-based filtering
 * Used for display/mapping purposes (e.g., showing department names in document list)
 * Department Admins can see all department names even if they don't have access to them
 */
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
    // 🔑 Return ALL departments without filtering
    // This endpoint is used for display/mapping purposes only
    // Department Admins need to see all department names even if they don't have access to them
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
    console.error('Error fetching all departments:', err)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to fetch departments', 500)
  }
})
