import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId
  let userRole
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: number }).user_id

    // Get user role for Department Admin filtering
    const userResult = await query('SELECT role_id FROM users WHERE user_id = $1', [userId])
    if (userResult.rows.length > 0) {
      userRole = userResult.rows[0].role_id
    }
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  let rolesQuery = 'SELECT * FROM public.roles WHERE role_id != 0 ORDER BY role_id ASC'

  // 🔑 Department Admin can work with USER role (2) and see their own DEPARTMENT ADMIN role (3)
  if (userRole === 3) {
    rolesQuery = 'SELECT * FROM public.roles WHERE role_id IN (2, 3) ORDER BY role_id ASC'
  }

  const roles = await query(rolesQuery, [])
  if (!roles?.rows?.length) {
    throw new CustomError('Roles not found', 404)
  }

  // Explicitly set 200 status
  setResponseStatus(event, 200)

  return {
    statusCode: 200,
    data: roles.rows,
    message: 'Roles fetched successfully',
  }
})
