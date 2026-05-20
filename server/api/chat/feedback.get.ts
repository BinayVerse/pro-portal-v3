import { query } from "~/server/utils/db";
import jwt from 'jsonwebtoken'
import { logError } from '~/server/utils/logger'

export default defineEventHandler(async (event) => {
  try {
    // Verify authorization
    const config = useRuntimeConfig()

    const headerAuth = (event.node.req.headers['authorization'] as string) || ''
    const tokenFromHeader = headerAuth.startsWith('Bearer ')
      ? headerAuth.split(' ')[1]
      : headerAuth || undefined

    // Parse cookies
    const cookieHeader = String(event.node.req.headers['cookie'] || '')
    const parsedCookies: Record<string, string> = {}

    if (cookieHeader) {
      for (const part of cookieHeader.split(';')) {
        const [k, ...v] = part.split('=')
        if (!k) continue
        parsedCookies[k.trim()] = decodeURIComponent((v || []).join('=').trim())
      }
    }

    const tokenCookie =
      parsedCookies['auth-token'] ||
      parsedCookies['authToken'] ||
      undefined

    const token = tokenFromHeader || tokenCookie

    if (!token) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: No token provided",
      })
    }

    try {
      jwt.verify(token as string, config.jwtToken as string)
    } catch (err) {
      throw createError({
        statusCode: 401,
        statusMessage: "Unauthorized: Invalid token",
      })
    }

    // Get query parameters
    const { chat_id, user_id, channel = 'admin' } = getQuery(event)

    if (!user_id) {
      throw createError({
        statusCode: 400,
        statusMessage: "Missing required parameter: user_id",
      })
    }

    let sql = `SELECT message_id, feedback FROM public.message_feedback
               WHERE user_id = $1 AND channel = $2`
    const params: any[] = [user_id, channel]

    // If chat_id is provided, filter by that specific chat
    if (chat_id) {
      // Message IDs follow pattern: {chat_id}_{messageIndex}_{timestamp}
      sql += ` AND message_id LIKE $3`
      params.push(`${chat_id}_%`)
    }

    sql += ` ORDER BY created_at DESC`

    const result = await query(sql, params)

    // Convert to map for easy lookup
    // Extract base message key (chat_id + index) from message_id for flexible matching
    const feedbackMap: Record<string, 'helpful' | 'not_helpful'> = {}
    for (const row of result.rows) {
      if (row.message_id && row.feedback) {
        feedbackMap[row.message_id] = row.feedback

        // Also add with flexible key matching - extract chat_id and index for matching
        // Message IDs can be: {chat_id}_{index}_{timestamp} or {chat_id}_{index}_bot_{timestamp}
        const parts = String(row.message_id).split('_')
        if (parts.length >= 3) {
          const baseKey = `${parts[0]}_${parts[1]}`
          feedbackMap[baseKey] = row.feedback
        }
      }
    }

    return {
      success: true,
      data: feedbackMap,
    }
  } catch (error: any) {
    logError("Error retrieving feedback:", error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || "Failed to retrieve feedback",
    })
  }
})
