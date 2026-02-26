import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const orgId = getRouterParam(event, 'id')
  const config = useRuntimeConfig()

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine effective org: prefer query param for superadmin
  let tokenUserOrg: any
  let tokenUserRole: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    const userId = decodedToken.user_id
    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }
    tokenUserOrg = userRow.rows[0].org_id
    tokenUserRole = userRow.rows[0].role_id
  } catch (error) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  if (!orgId) {
    setResponseStatus(event, 400)
    throw new CustomError('Please provide a valid organization ID', 400)
  }

  // Determine allowed org for this request:
  // - If caller is superadmin (role_id === 0): allow either query param org or the path param orgId
  // - Otherwise: only allow token user's org
  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null

  let allowedOrg: string | null = null
  if (tokenUserRole === 0) {
    allowedOrg = requestedOrg ? String(requestedOrg) : String(orgId)
  } else {
    allowedOrg = String(tokenUserOrg)
  }

  if (String(allowedOrg) !== String(orgId)) {
    setResponseStatus(event, 403)
    throw new CustomError('Forbidden: Access denied to this organization', 403)
  }

  try {
    const categories = await query(
      `SELECT 
        id, 
        name, 
        org_id, 
        added_by,
        created_at,
        updated_at
      FROM document_category 
      WHERE org_id = $1 
      ORDER BY name ASC`,
      [orgId]
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: categories.rows ?? [],
      message: categories.rows.length
        ? 'Categories fetched successfully'
        : 'No categories found for this organization',
    }
  } catch (err) {
    setResponseStatus(event, 500)
    throw new CustomError('Error fetching categories', 500)
  }
})
