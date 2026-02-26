import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'id')
  const config = useRuntimeConfig()

  const token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Determine caller's role and org
  let callerUserId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    callerUserId = decodedToken.user_id
  } catch (error) {
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
    throw new CustomError('Please provide a valid user ID', 400)
  }

  // Fetch target user's org
  const targetRow = await query('SELECT org_id FROM users WHERE user_id = $1', [userId])
  if (!targetRow?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found', 404)
  }
  const targetOrg = targetRow.rows[0].org_id

  // If caller is not superadmin, enforce same org
  if (callerRole !== 0 && String(callerOrg) !== String(targetOrg)) {
    setResponseStatus(event, 403)
    throw new CustomError('Forbidden: Cannot delete users from another organization', 403)
  }

  try {
    const deleteUserQuery = `
      DELETE FROM users
      WHERE user_id = $1
      RETURNING user_id;
    `
    const result = await query(deleteUserQuery, [userId])

    if (result.rowCount === 0) {
      setResponseStatus(event, 404)
      throw new CustomError('User not found or unauthorized', 404)
    }

    // Successfully deleted
    setResponseStatus(event, 204)
    return null // No content on success
  } catch (err) {
    setResponseStatus(event, 500)
    throw new CustomError('Error deleting user', 500)
  }
})
