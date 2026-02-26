import { query } from '../../utils/db'
import { CustomError } from '../../utils/custom.error'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Get token from header or cookie
  let token = event.node.req.headers['authorization']?.split(' ')[1]
  if (!token) {
    const cookieHeader = String(event.node.req.headers['cookie'] || '')
    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.split('=')
        if (!k) continue
        const key = k.trim()
        const val = decodeURIComponent((v || []).join('=').trim())
        if (key === 'auth-token' || key === 'authToken') {
          token = val
          break
        }
      }
    }
  }

  if (!token) throw new CustomError('Unauthorized: No token provided', 401)

  let userId: string
  try {
    const decoded = jwt.verify(token, config.jwtToken as string) as { user_id: string }
    userId = decoded.user_id
  } catch {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  // Ensure caller is super admin
  const roleCheck = await query('SELECT role_id FROM users WHERE user_id = $1', [userId])
  const role = roleCheck?.rows?.[0]?.role_id
  if (role !== 0) throw new CustomError("Forbidden: Super admin access required", 403)

  // Check optional timezone query param and validate
  const { timezone } = getQuery(event) as { timezone?: string }
  let tz: string | null = null
  if (timezone) {
    if (!/^[A-Za-z_\/]+$/.test(timezone)) {
      throw new CustomError('Invalid timezone format', 400)
    }
    tz = timezone
  }

  // Fetch per-organization stats, converting last_used_at to requested timezone if provided
  const orgsQ = await query(
    tz
      ? `
    SELECT
      o.org_id,
      o.org_name,
      o.created_at,
      COUNT(DISTINCT u.user_id) FILTER (WHERE u.role_id IS DISTINCT FROM '0') AS total_users,
      COUNT(DISTINCT d.id) AS docs_uploaded,
      COALESCE((
        SELECT SUM(t2.total_tokens) FROM token_cost_calculation t2 WHERE t2.org_id = o.org_id
      ), 0) AS total_tokens,
      (
        SELECT MAX(t3.created_at) FROM token_cost_calculation t3 WHERE t3.org_id = o.org_id
      ) AS last_used_at,
      (
        SELECT (MAX(t3.created_at) AT TIME ZONE $1)::date FROM token_cost_calculation t3 WHERE t3.org_id = o.org_id
      ) AS last_used_date
    FROM organizations o
    LEFT JOIN users u ON o.org_id = u.org_id
    LEFT JOIN organization_documents d ON o.org_id = d.org_id
    GROUP BY o.org_id, o.org_name, o.created_at
    ORDER BY o.org_name ASC
  `
      : `
    SELECT
      o.org_id,
      o.org_name,
      o.created_at,
      COUNT(DISTINCT u.user_id) FILTER (WHERE u.role_id IS DISTINCT FROM '0') AS total_users,
      COUNT(DISTINCT d.id) AS docs_uploaded,
      COALESCE((
        SELECT SUM(t2.total_tokens) FROM token_cost_calculation t2 WHERE t2.org_id = o.org_id
      ), 0) AS total_tokens,
      (
        SELECT MAX(t3.created_at) FROM token_cost_calculation t3 WHERE t3.org_id = o.org_id
      ) AS last_used_at
    FROM organizations o
    LEFT JOIN users u ON o.org_id = u.org_id
    LEFT JOIN organization_documents d ON o.org_id = d.org_id
    GROUP BY o.org_id, o.org_name, o.created_at
    ORDER BY o.org_name ASC
  `,
    tz ? [tz] : undefined,
  )

  const organizations = (orgsQ.rows || []).map((r: any) => ({
    org_id: r.org_id,
    org_name: r.org_name,
    created_at: r.created_at,
    total_users: Number(r.total_users || 0),
    docs_uploaded: Number(r.docs_uploaded || 0),
    total_tokens: Number(r.total_tokens || 0),
    last_used_at: r.last_used_at,
    last_used_date: r.last_used_date,
  }))

  // Summary
  const summary = organizations.reduce(
    (acc, org) => {
      acc.total_orgs += 1
      acc.total_users += org.total_users
      acc.total_docs += org.docs_uploaded
      acc.total_tokens += org.total_tokens
      return acc
    },
    { total_orgs: 0, total_users: 0, total_docs: 0, total_tokens: 0 },
  )

  return {
    statusCode: 200,
    status: 'success',
    data: { organizations, summary },
    message: 'Organizations fetched successfully',
  }
})
