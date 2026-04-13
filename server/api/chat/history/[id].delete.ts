import jwt from 'jsonwebtoken'
import { CustomError } from '../../../utils/custom.error'
import { query } from '../../../utils/db'
import { setResponseStatus } from 'h3'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Extract token from Authorization header or cookies
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

  // Verify token
  try {
    jwt.verify(token as string, config.jwtToken as string)
  } catch (err) {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  // Get chat ID from route parameter
  const chatId = event.context.params?.id
  if (!chatId) throw new CustomError('chat_id is required', 400)

  try {
    // Delete all chat history records for this chat_id
    const sql = `DELETE FROM chat_history WHERE chat_id = $1 RETURNING id`
    const result = await query(sql, [chatId])

    const deletedCount = result.rows.length

    setResponseStatus(event, 200)
    return {
      status: 'success',
      message: `Deleted ${deletedCount} history record${deletedCount !== 1 ? 's' : ''}`,
      deletedCount,
    }
  } catch (err: any) {
    throw new CustomError(err?.message || 'Failed to delete chat history', 500)
  }
})
