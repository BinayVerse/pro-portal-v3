import type { H3Event } from 'h3'
import { defineEventHandler, readBody, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event: H3Event) => {
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

  const userResult = await query(
    'SELECT org_id FROM users WHERE user_id = $1',
    [userId],
  )

  if (!userResult.rows.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found', 404)
  }

  const orgId = userResult.rows[0].org_id

  // Get caller info
  const callerResult = await query(
    `SELECT role_id FROM users WHERE user_id = $1 AND org_id = $2`,
    [userId, orgId]
  )

  if (callerResult.rows.length === 0) {
    setResponseStatus(event, 403)
    throw new CustomError('User not found in organization', 403)
  }

  const callerRole = callerResult.rows[0].role_id
  const body = await readBody(event)

  const { userIds, departments } = body

  // Validation
  if (!Array.isArray(userIds) || userIds.length === 0) {
    setResponseStatus(event, 400)
    throw new CustomError('userIds must be a non-empty array', 400)
  }

  if (!Array.isArray(departments) || departments.length === 0) {
    setResponseStatus(event, 400)
    throw new CustomError('departments must be a non-empty array', 400)
  }

  try {
    // 🔑 PERMISSION CHECK 1: Validate Department Admin can only unassign from their own departments
    if (callerRole === 3) {
      const adminDeptResult = await query(
        `SELECT dept_id FROM user_departments WHERE user_id = $1`,
        [userId]
      )
      const adminDepts = adminDeptResult.rows.map((r) => String(r.dept_id))
      const allAuthorized = departments.every((deptId: string) => adminDepts.includes(String(deptId)))

      if (!allAuthorized) {
        setResponseStatus(event, 403)
        throw new CustomError('Department Admins can only unassign users from their own departments', 403)
      }
    }

    // 🔑 PERMISSION CHECK 2: Validate target users are editable by caller
    const targetUsersResult = await query(
      `SELECT user_id, role_id FROM users WHERE user_id = ANY($1) AND org_id = $2`,
      [userIds, orgId]
    )

    const targetUsers = targetUsersResult.rows

    if (targetUsers.length !== userIds.length) {
      setResponseStatus(event, 400)
      throw new CustomError('One or more users not found in this organization', 400)
    }

    // Department Admin cannot bulk unassign other DAs or CAs
    if (callerRole === 3) {
      const unauthorizedUsers = targetUsers.filter((u) => u.role_id === 1 || u.role_id === 3)
      if (unauthorizedUsers.length > 0) {
        setResponseStatus(event, 403)
        throw new CustomError(
          'Department Admins cannot manage other admins or users with higher roles',
          403
        )
      }
    }

    // 🔑 PERMISSION CHECK 3: For Department Admin, verify target users are in their departments
    if (callerRole === 3) {
      const adminDeptResult = await query(
        `SELECT dept_id FROM user_departments WHERE user_id = $1`,
        [userId]
      )
      const adminDepts = adminDeptResult.rows.map((r) => String(r.dept_id))

      // Check each target user is in at least one of DA's departments
      for (const targetUserId of userIds) {
        const userDeptResult = await query(
          `SELECT dept_id FROM user_departments WHERE user_id = $1`,
          [targetUserId]
        )
        const userDepts = userDeptResult.rows.map((r) => String(r.dept_id))

        // User must be in at least one of admin's departments
        const hasOverlap = userDepts.some((d) => adminDepts.includes(d))
        const isUnassigned = userDepts.length === 0

        if (!hasOverlap && !isUnassigned) {
          setResponseStatus(event, 403)
          throw new CustomError(
            `You can only unassign users that are in your departments or unassigned`,
            403
          )
        }
      }
    }

    // 🔑 BULK DELETE: Remove user-department combinations
    for (const targetUserId of userIds) {
      await query(
        `DELETE FROM user_departments WHERE user_id = $1 AND dept_id = ANY($2)`,
        [targetUserId, departments]
      )
    }

    // Return success response
    return {
      success: true,
      data: {
        userIds,
        departments,
        succeeded: userIds.length,
        failed: 0,
        errors: [],
      },
      message: `Successfully unassigned ${userIds.length} user(s) from ${departments.length} department(s)`,
    }
  } catch (error: any) {
    if (error instanceof CustomError) {
      setResponseStatus(event, error.statusCode || 500)
      throw error
    }

    console.error('Bulk unassign departments error:', error)
    setResponseStatus(event, 500)
    throw new CustomError('Failed to unassign departments', 500)
  }
})
