import { defineEventHandler, setResponseStatus } from 'h3'
import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const token = event.node.req.headers['authorization']?.split(' ')[1]

  if (!token) {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  let userId
  try {
    const decodedToken = jwt.verify(token, config.jwtToken as string)
    userId = (decodedToken as { user_id: number }).user_id
  } catch {
    setResponseStatus(event, 401)
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const userOrg = await query('SELECT org_id FROM users WHERE user_id = $1', [userId])
  if (!userOrg?.rows?.length) {
    setResponseStatus(event, 404)
    throw new CustomError('User not found or organization not assigned', 404)
  }

  const orgId = userOrg.rows[0].org_id

  const users = await query(
    `WITH distinct_users AS (
      SELECT DISTINCT ON (u.user_id)
          u.user_id,
          u.name,
          u.email,
          COALESCE(u.contact_number, '') AS contact_number,
          u.role_id,
          u.added_by,
          u.primary_contact,
          u.org_id,
          u.updated_at,
          u.created_at
      FROM users u
      WHERE u.org_id = $1
      ORDER BY u.user_id, u.created_at DESC  -- keep latest if duplicates exist
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
        END AS source
    FROM distinct_users du
    LEFT JOIN organizations o ON du.org_id = o.org_id
    LEFT JOIN roles r ON du.role_id = r.role_id
    ORDER BY du.name ASC;`,
    [orgId],
  )

  setResponseStatus(event, 200)
  return {
    statusCode: 200,
    status: 'success',
    data: users.rows ?? [],
    message: users.rows.length
      ? 'Users fetched successfully'
      : 'No users found in the same organization',
  }
})
