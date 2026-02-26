import jwt from 'jsonwebtoken'
import { CustomError } from '../../utils/custom.error'
import { query, getClient } from '../../utils/db'
import { setResponseStatus } from 'h3'
import { checkConversationLimitExceeded } from '../../utils/usageLimits'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Extract token
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

  let decoded: any = null
  try {
    decoded = jwt.verify(token as string, config.jwtToken as string)
  } catch (err) {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  const body = await readBody(event)
  if (!body) throw new CustomError('Request body is required', 400)

  // Expected fields
  const user_id = body.user_id || decoded?.user_id || decoded?.id
  const org_id = body.org_id || null
  const chat_id = body.chat_id || null
  const role = body.role || 'user' // 'user' or 'assistant' or 'interaction'
  const message = body.message || null
  const metadata = body.metadata || null
  const upsert = body.upsert === true || false

  if (!user_id) throw new CustomError('user_id is required', 400)
  if (!chat_id) throw new CustomError('chat_id is required', 400)
  if (!message) throw new CustomError('message is required', 400)

  // Check conversation limit if org_id is provided
  if (org_id) {
    const conversationLimitCheck = await checkConversationLimitExceeded(org_id)
    if (conversationLimitCheck.exceeded) {
      setResponseStatus(event, 403)
      throw new CustomError(conversationLimitCheck.message, 403)
    }
  }

  try {
    // If upsert requested and role is 'interaction', try to update existing interaction row
    if (upsert && role === 'interaction') {
      // Use an explicit transaction and row-level lock so the first INSERT is created and subsequent
      // requests update that same row atomically.
      const client = await getClient()
      try {
        await client.query('BEGIN')
        // Ensure only one transaction can create the initial interaction row for this chat_id
        // Use a session-level advisory lock derived from the chat_id so concurrent requests serialize
        try {
          await client.query('SELECT pg_advisory_xact_lock(hashtext($1)::bigint)', [chat_id])
        } catch (e) {
          // If hashtext cast fails, fall back to basic lock (best-effort)
          await client.query('SELECT pg_advisory_xact_lock(0)')
        }
        const sel = await client.query(`SELECT id, message, metadata FROM chat_history WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1 FOR UPDATE`, [chat_id])
        if (sel.rows && sel.rows.length > 0) {
          const existing = sel.rows[0]
          try {
            const existingMsg = existing.message || {}
            const existingMessages = Array.isArray(existingMsg.messages) ? existingMsg.messages : []
            const newMessages = message && Array.isArray(message.messages) ? message.messages : []

            let mergedMessages: any[] = []
            if (existingMessages.length && newMessages.length) {
              const kMax = Math.min(existingMessages.length, newMessages.length)
              let overlap = 0
              const decodeHtml = (str: any) => {
                if (!str) return ''
                return String(str)
                  .replace(/&amp;/g, '&')
                  .replace(/&lt;/g, '<')
                  .replace(/&gt;/g, '>')
                  .replace(/&quot;/g, '"')
                  .replace(/&#39;/g, "'")
                  .replace(/&#(\d+);/g, (_m: any, num: any) => String.fromCharCode(Number(num)))
              }
              const normalizeText = (t: any) => decodeHtml(t || '')
                .toString()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim()
              const msgKey = (m: any) => {
                if (!m) return ''
                const role = m.role || m.from || ''
                const text = (m.text || m.response || m.answer || m.content || (m.message && m.message.text) || '')
                const norm = normalizeText(text)
                const metaType = m.meta_type || m.meta?.type || ''
                return `${norm}|${metaType}|${role}`
              }

              for (let k = kMax; k > 0; k--) {
                let match = true
                for (let i = 0; i < k; i++) {
                  const a = msgKey(existingMessages[existingMessages.length - k + i])
                  const b = msgKey(newMessages[i])
                  if (a !== b) { match = false; break }
                }
                if (match) { overlap = k; break }
              }
              mergedMessages = [...existingMessages, ...newMessages.slice(overlap)]
            } else {
              mergedMessages = existingMessages.concat(newMessages)
            }

            const mergedMessage = { messages: mergedMessages.length ? mergedMessages : (message.messages || existingMsg.messages || []) }
            const updateSql = `UPDATE chat_history SET message = $1::jsonb, metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $3 RETURNING *`
            const params = [JSON.stringify(mergedMessage), JSON.stringify(metadata || {}), existing.id]
            const result = await client.query(updateSql, params)
            await client.query('COMMIT')
            setResponseStatus(event, 201)
            return { status: 'success', data: result.rows[0] }
          } catch (e) {
            // fallback to overwrite
            const mergedMessage = message
            const updateSql = `UPDATE chat_history SET message = $1::jsonb, metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $3 RETURNING *`
            const params = [JSON.stringify(mergedMessage), JSON.stringify(metadata || {}), existing.id]
            const result = await client.query(updateSql, params)
            await client.query('COMMIT')
            setResponseStatus(event, 201)
            return { status: 'success', data: result.rows[0] }
          }
        }

        // No existing row: insert (this will be committed within the transaction)
        const insertSql = `
          INSERT INTO chat_history (
            id, user_id, org_id, chat_id, role, message, metadata, created_at
          ) VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()
          ) RETURNING *;
        `
        try {
          const params = [user_id, org_id, chat_id, 'interaction', JSON.stringify(message), JSON.stringify(metadata || {})]
          const result = await client.query(insertSql, params)
          await client.query('COMMIT')
          setResponseStatus(event, 201)
          return { status: 'success', data: result.rows[0] }
        } catch (errInner: any) {
          // Try insert without gen_random_uuid fallback
          if (errInner?.message?.includes('gen_random_uuid')) {
            const insertSql2 = `
              INSERT INTO chat_history (
                user_id, org_id, chat_id, role, message, metadata, created_at
              ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()) RETURNING *;
            `
            const params = [user_id, org_id, chat_id, 'interaction', JSON.stringify(message), JSON.stringify(metadata || {})]
            const result = await client.query(insertSql2, params)
            await client.query('COMMIT')
            setResponseStatus(event, 201)
            return { status: 'success', data: result.rows[0] }
          }
          await client.query('ROLLBACK')
          throw errInner
        }
      } catch (txErr) {
        try { await client.query('ROLLBACK') } catch (e) { /* ignore */ }
        throw txErr
      } finally {
        try { client.release() } catch (e) { /* ignore */ }
      }
    }

    // Default: insert a new row
    const insertSql = `
      INSERT INTO chat_history (
        id, user_id, org_id, chat_id, role, message, metadata, created_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()
      ) RETURNING *;
    `

    const params = [user_id, org_id, chat_id, role, JSON.stringify(message), JSON.stringify(metadata || {})]

    const result = await query(insertSql, params)
    setResponseStatus(event, 201)
    return { status: 'success', data: result.rows[0] }
  } catch (err: any) {
    // If gen_random_uuid() not available, fallback to insert without it
    if (err?.message?.includes('gen_random_uuid')) {
      const insertSql = `
        INSERT INTO chat_history (
          user_id, org_id, chat_id, role, message, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()) RETURNING *;
      `
      const params = [user_id, org_id, chat_id, role, JSON.stringify(message), JSON.stringify(metadata || {})]
      const result = await query(insertSql, params)
      setResponseStatus(event, 201)
      return { status: 'success', data: result.rows[0] }
    }

    throw new CustomError(err?.message || 'Failed to insert chat history', 500)
  }
})
