import jwt from 'jsonwebtoken'
import { CustomError } from '../../utils/custom.error'
import { query } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  const headerAuth = (event.node.req.headers['authorization'] as string) || ''
  const tokenFromHeader = headerAuth.startsWith('Bearer ') ? headerAuth.split(' ')[1] : headerAuth || undefined

  // Parse cookies from header
  const cookieHeader = String(event.node.req.headers['cookie'] || '')
  const parsedCookies: Record<string, string> = {}
  if (cookieHeader) {
    for (const part of cookieHeader.split(';')) {
      const [k, ...v] = part.split('=')
      if (!k) continue
      parsedCookies[k.trim()] = decodeURIComponent((v || []).join('=').trim())
    }
  }

  const tokenCookie = parsedCookies['auth-token'] || parsedCookies['authToken'] || undefined
  const token = tokenFromHeader || tokenCookie

  if (!token) throw new CustomError('Unauthorized: No token provided', 401)

  try {
    jwt.verify(token as string, config.jwtToken as string)
  } catch (err) {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const url = new URL(getRequestURL(event))
  const params = url.searchParams

  const user_id = params.get('user_id')
  const org_id = params.get('org_id')
  const chat_id = params.get('chat_id')
  const role = params.get('role')
  const limit = Math.min(Number(params.get('limit') || '50'), 500)
  const offset = Math.max(Number(params.get('offset') || '0'), 0)
  const since = params.get('since') // ISO date
  const until = params.get('until')

  const whereClauses: string[] = []
  const values: any[] = []
  let idx = 1

  if (user_id) { whereClauses.push(`user_id = $${idx++}`); values.push(user_id) }
  if (org_id) { whereClauses.push(`org_id = $${idx++}`); values.push(org_id) }
  if (chat_id) { whereClauses.push(`chat_id = $${idx++}`); values.push(chat_id) }
  if (role) { whereClauses.push(`role = $${idx++}`); values.push(role) }
  if (since) { whereClauses.push(`created_at >= $${idx++}`); values.push(since) }
  if (until) { whereClauses.push(`created_at <= $${idx++}`); values.push(until) }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : ''

  const sql = `SELECT * FROM chat_history ${whereSql} ORDER BY created_at DESC LIMIT $${idx++} OFFSET $${idx++}`
  values.push(limit, offset)

  try {
    const result = await query(sql, values)
    return { status: 'success', data: result.rows }
  } catch (err: any) {
    throw new CustomError(err?.message || 'Failed to fetch chat history', 500)
  }
})
