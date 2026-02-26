import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../../utils/db'
import { CustomError } from '../../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId
  let tokenUserOrg: any
  let tokenUserRole: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    userId = decodedToken.user_id
    const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
    if (!userRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }
    tokenUserOrg = userRow.rows[0].org_id
    tokenUserRole = userRow.rows[0].role_id

    if (!userId || !tokenUserOrg) {
      setResponseStatus(event, 401)
      throw new CustomError('Unauthorized: Invalid token data', 401)
    }
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  // Allow superadmin to request categories for specific org via query param
  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  const orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

  try {
    const categories = await query(
      `SELECT 
        dc.id, 
        dc.name, 
        dc.org_id, 
        dc.added_by,
        dc.created_at,
        dc.updated_at,
        u.name as added_by_name,
        COUNT(od.id) as document_count
      FROM document_category dc
      LEFT JOIN users u ON dc.added_by = u.user_id
      LEFT JOIN organization_documents od ON dc.id::text = od.file_category AND dc.org_id = od.org_id
      WHERE dc.org_id = $1
      GROUP BY dc.id, dc.name, dc.org_id, dc.added_by, dc.created_at, dc.updated_at, u.name
      ORDER BY dc.name ASC`,
      [orgId]
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      data: categories.rows ?? [],
      message: categories.rows.length
        ? 'Categories fetched successfully'
        : 'No categories found in your organization',
    }
  } catch (err) {
    setResponseStatus(event, 500)
    throw new CustomError('Error fetching categories', 500)
  }
})
