import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'
import { formatDateTime } from '../../../utils'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // const { timezone: clientTimezone } = await readBody(event)
  // const userTimezone = clientTimezone || 'UTC'
  const userTimezone = 'UTC'

  let userId
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: number }).user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userRow = await query('SELECT org_id, role_id FROM users WHERE user_id = $1', [userId])
  if (!userRow?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found or organization not assigned', 404)
  }

  const tokenUserOrg = userRow.rows[0].org_id
  const tokenUserRole = userRow.rows[0].role_id
  const tokenUserId = userId

  // Allow superadmin to request users for a specific org via query param
  const q = getQuery(event) as Record<string, any>
  const requestedOrg = q?.org || q?.org_id || null
  const orgId = tokenUserRole === 0 && requestedOrg ? String(requestedOrg) : tokenUserOrg

  // For Department Admin (role_id = 3), get their departments
  let adminDepartmentIds: string[] = []

  if (tokenUserRole === 3) {
    try {
      const deptResult = await query(
        `SELECT dept_id FROM user_departments WHERE user_id = $1`,
        [String(tokenUserId)],
      )
      adminDepartmentIds = deptResult.rows.map((row) => String(row.dept_id))
      // console.log(`[all.get.ts] Department Admin ${tokenUserId} has departments:`, adminDepartmentIds)
    } catch (e) {
      console.error('Failed to fetch department assignments for Department Admin:', e)
    }
  }

  // Build the main query with Department Admin filtering
  let whereClause = `
  WHERE u.org_id = $1
`
  const queryParams: any[] = [orgId]

  // 🟢 Admin (role_id = 1): see everyone except super admin
  if (tokenUserRole === 1) {
    whereClause += `
    AND u.role_id != 0
  `
  }

  // 🔵 Department Admin (role_id = 3): see all REGULAR users (not admins)
  else if (tokenUserRole === 3) {
    whereClause += `
    AND u.role_id NOT IN (0, 1)
  `
  }

  // 🔑 Super Admin (role_id = 0): no additional filter


  const users = await query(
    `
      WITH distinct_users AS (
        SELECT DISTINCT ON (u.user_id)
            u.user_id,
            u.name,
            u.email,
            COALESCE(u.contact_number, '') AS contact_number,
            u.role_id,
            u.added_by,
            u.primary_contact,
            u.org_id,
            COALESCE(u.updated_at, NULL) AS updated_at,
            COALESCE(u.created_at, NULL) AS created_at,
            COALESCE(u.is_active, true) AS is_active
        FROM users u
        ${whereClause}
        ORDER BY u.user_id, u.created_at DESC
      )
      SELECT
          du.user_id,
          du.name,
          du.email,
          du.contact_number,
          du.role_id,
          du.added_by,
          du.primary_contact,
          o.org_name,
          r.role_name AS role,
          du.updated_at,
          du.created_at,
          CASE WHEN du.is_active = true THEN 'active' ELSE 'inactive' END AS status,

          -- ✅ DEPARTMENTS
          COALESCE(
            ARRAY_AGG(ud.dept_id) FILTER (WHERE ud.dept_id IS NOT NULL),
            '{}'
          ) AS departments,

          COALESCE((
            SELECT SUM(t.total_tokens)
            FROM token_cost_calculation t
            WHERE t.user_id = du.user_id
              AND t.org_id = $1
          ), 0) AS tokens_used,

          CASE
            WHEN du.added_by = 'slack_auto_provision' THEN 'Slack'
            WHEN du.added_by = 'teams_auto_provision' THEN 'Teams'
            ELSE 'Manual'
          END AS source,

          GREATEST(
            COALESCE(
              (SELECT MAX(t.created_at)
              FROM token_cost_calculation t
              WHERE t.user_id = du.user_id AND t.org_id = $1),
              '1970-01-01'::timestamp
            ),
            COALESCE(du.updated_at, '1970-01-01'::timestamp)
          ) AS last_active

      FROM distinct_users du
      LEFT JOIN organizations o ON du.org_id = o.org_id
      LEFT JOIN roles r ON du.role_id = r.role_id
      LEFT JOIN user_departments ud ON ud.user_id = du.user_id
      GROUP BY
        du.user_id,
        du.name,
        du.email,
        du.contact_number,
        du.role_id,
        du.added_by,
        du.primary_contact,
        o.org_name,
        r.role_name,
        du.updated_at,
        du.created_at,
        du.is_active
      ORDER BY du.name ASC;
      `,
    queryParams,
  )


  const formattedUsers = users.rows.map(user => ({
    ...user,
    updated_at: formatDateTime(user.updated_at, userTimezone),
    created_at: formatDateTime(user.created_at, userTimezone),
    last_active: formatDateTime(user.last_active, userTimezone),
    departments: user.departments || [],
  }))

  setResponseStatus(event, 200)
  return {
    statusCode: 200,
    status: 'success',
    data: formattedUsers ?? [],
    message: formattedUsers.length
      ? 'Users fetched successfully'
      : 'No users found in the same organization',
  }
})
