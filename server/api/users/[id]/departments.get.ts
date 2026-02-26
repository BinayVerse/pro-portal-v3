import { defineEventHandler, getRouterParam, setResponseStatus } from 'h3'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const userId = getRouterParam(event, 'id')
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let callerUserId: any
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string) as { user_id: number }
    callerUserId = decodedToken.user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  if (!userId) {
    setResponseStatus(event, 400)
    throw new CustomError('User ID is required', 400)
  }

  try {
    const result = await query(
      `SELECT ud.dept_id 
       FROM user_departments ud
       WHERE ud.user_id = $1
       ORDER BY ud.dept_id ASC`,
      [String(userId)],
    )

    setResponseStatus(event, 200)
    return {
      statusCode: 200,
      status: 'success',
      departments: result.rows.map((row) => row.dept_id),
    }
  } catch (err: any) {
    console.error('Error fetching user departments:', err)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to fetch user departments', 500)
  }
})
