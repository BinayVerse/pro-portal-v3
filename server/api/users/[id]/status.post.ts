import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const params = await readBody(event)
  const config = useRuntimeConfig()

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine caller role/org and allow superadmin to change status across orgs
  let callerUserId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    callerUserId = decodedToken.user_id
  } catch (err) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const callerRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [callerUserId])
  if (!callerRow?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('Caller not found', 404)
  }
  const callerOrg = callerRow.rows[0].org_id
  const callerRole = callerRow.rows[0].role_id

  if (!userId) {
    setResponseStatus(event, 400)
    throw new CustomError('User ID is required', 400)
  }

  if (typeof params.is_active === 'undefined') {
    setResponseStatus(event, 400)
    throw new CustomError('is_active parameter is required', 400)
  }

  const isActive = params.is_active === true || params.is_active === 'true'

  try {
    // Fetch target user's org
    const targetRow = await query('SELECT org_id FROM users WHERE user_id = $1', [userId])
    if (!targetRow?.rows?.length) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found', 404)
    }
    const targetOrg = targetRow.rows[0].org_id

    if (callerRole !== 0 && String(callerOrg) !== String(targetOrg)) {
      setResponseStatus(event, 403)
      throw new CustomError('Forbidden: Cannot modify users from another organization', 403)
    }

    const updateQuery = `
      UPDATE users
      SET is_active = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $3
      WHERE user_id = $2
      RETURNING user_id, is_active
    `

    const result = await query(updateQuery, [isActive, userId, callerUserId])

    if (result.rowCount === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or unauthorized', 404)
    }

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: result.rows[0],
    }
  } catch (err: any) {
    console.error('Error updating user active status:', err)
    setResponseStatus(event, 500)
    throw new CustomError(err.message || 'Error updating user status', 500)
  }
})
