import jwt from 'jsonwebtoken'
import { CustomError } from '../utils/custom.error'
import { predictRag } from '~/server/utils/predictRag'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()

  // Extract auth token from Authorization header or cookie
  const headerAuth = (event.node.req.headers['authorization'] as string) || ''
  const tokenFromHeader = headerAuth.startsWith('Bearer ') ? headerAuth.split(' ')[1] : headerAuth || undefined

  // Parse cookies from header as fallback (avoid useCookie to ensure runtime availability)
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

  if (!token) {
    throw new CustomError('Unauthorized: No token provided', 401)
  }

  // Validate token and extract payload
  let decoded: any = null
  try {
    decoded = jwt.verify(token as string, config.jwtToken as string)
  } catch (err) {
    throw new CustomError('Unauthorized: Invalid token', 401)
  }

  // Read payload
  const body = await readBody(event)
  if (!body) {
    throw new CustomError('Request body is required', 400)
  }

  // Basic payload validation
  const question = String(body.question || '').trim()
  const wa_id = body.wa_id || body.user_id || body.userId
  const org_id = body.org_id || body.orgId
  const request_source = body.request_source || 'admin'

  if (!question) {
    throw new CustomError('question is required in payload', 400)
  }

  // If not an admin request, ensure token user matches wa_id
  const tokenUserId = decoded?.user_id || decoded?.userId || decoded?.id
  if (request_source !== 'admin' && wa_id && tokenUserId && String(wa_id) !== String(tokenUserId)) {
    throw new CustomError('Unauthorized: wa_id does not match token user', 401)
  }

  try {
    // Determine user_id
    const user_id = body.user_id || wa_id || decoded?.user_id || decoded?.id
    if (!user_id) throw new CustomError('user_id is required', 401)

    // Generate or reuse chat_id
    let chat_id = body.chat_id || body.chatId || null
    try {
      if (!chat_id) {
        // Node 18+ supported randomUUID
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { randomUUID } = require('crypto')
        chat_id = randomUUID()
      }
    } catch (e) {
      if (!chat_id) chat_id = `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    }

    // Call RAG service
    const result = await predictRag(body, token as string)

    // Normalize assistant text from result for storage/display
    const assistantText = (result && (result.response || result.answer || result.text || result.data?.response || result.data?.answer || result.data?.text)) || ''
    const assistantDocSource = result?.document_source || result?.documentSource || result?.source || result?.data?.document_source || result?.data?.documentSource || ''

    // Format assistant text as Question/Answer block so history stores same view as UI
    const formattedAssistantText = question ? `Question: ${question}\n\nAnswer:\n${assistantText}` : assistantText

    // Persist full conversation into a single 'interaction' row: create if not exists, else update
    try {
      const db = await import('~/server/utils/db')

      // Attempt to read latest row for this chat_id (regardless of role) to persist as interaction
      const selectSql = `SELECT id, message, metadata FROM chat_history WHERE chat_id = $1 ORDER BY created_at DESC LIMIT 1`
      const sel = await db.query(selectSql, [chat_id])
      let existing = sel.rows && sel.rows.length ? sel.rows[0] : null

      // Build conversation array starting from existing message or provided history
      let conv: Array<any> = []
      if (existing && existing.message) {
        const m = existing.message
        if (Array.isArray(m.messages)) {
          // preserve existing message objects but ensure assistant response fields are strings
          conv = m.messages.map((msg: any) => {
            if (!msg) return msg
            if (msg.role === 'user') {
              return msg // user messages are fine as-is
            }
            // assistant: preserve all meta fields but normalize response content to string
            const resRaw = msg.response || msg.text || msg.answer || msg.data?.response || msg.data?.answer || msg.content
            const responseStr = typeof resRaw === 'string' ? resRaw : JSON.stringify(resRaw)
            // return a shallow copy preserving other keys (meta_type, categories, selected, etc.)
            return { ...msg, response: responseStr }
          })
        } else if (m.user || m.assistant) {
          if (m.user) conv.push({ role: 'user', text: m.user.text || m.user })
          if (m.assistant) conv.push({ role: 'assistant', response: m.assistant })
        }
      } else if (Array.isArray(body.history)) {
        for (const h of body.history) {
          if (!h) continue
          const role = (h.role || 'user')
          const content = h.content || h.message || ''
          if (role === 'user') conv.push({ role: 'user', text: content })
          else conv.push({ role: 'assistant', response: content })
        }
      }

      // append current user + assistant (store assistant as normalized text)
      conv.push({ role: 'user', text: question })
      conv.push({ role: 'assistant', response: formattedAssistantText, raw: result, document_source: assistantDocSource })

      const newMessage = { messages: conv }
      const metadataObj = { request_source }

      if (existing && existing.id) {
        try {
          const existingMsg = existing.message || {}
          const existingMessages = Array.isArray(existingMsg.messages) ? existingMsg.messages : []
          const incomingMessages = Array.isArray(newMessage.messages) ? newMessage.messages : []

          let mergedMessages: any[] = []
          if (existingMessages.length && incomingMessages.length) {
            const kMax = Math.min(existingMessages.length, incomingMessages.length)
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
                const b = msgKey(incomingMessages[i])
                if (a !== b) { match = false; break }
              }
              if (match) { overlap = k; break }
            }
            mergedMessages = [...existingMessages, ...incomingMessages.slice(overlap)]
          } else {
            mergedMessages = existingMessages.concat(incomingMessages)
          }

          const mergedMessage = { messages: mergedMessages.length ? mergedMessages : (newMessage.messages || existingMsg.messages || []) }
          const updateSql = `UPDATE chat_history SET message = $1::jsonb, metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb, updated_at = NOW() WHERE id = $3 RETURNING *`
          await db.query(updateSql, [JSON.stringify(mergedMessage), JSON.stringify(metadataObj), existing.id])
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to update interaction row, attempting insert:', (e as any)?.message || e)
          existing = null
        }
      }

      if (!existing) {
        try {
          const insertSql = `INSERT INTO chat_history (user_id, org_id, chat_id, role, message, metadata, created_at)
            VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW()) RETURNING *;`
          await db.query(insertSql, [user_id, org_id, chat_id, 'interaction', JSON.stringify(newMessage), JSON.stringify(metadataObj)])
        } catch (e) {
          // eslint-disable-next-line no-console
          console.warn('Failed to insert interaction row:', (e as any)?.message || e)
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('Failed to persist conversation as interaction:', e?.message || e)
    }

    // Normalize response fields for client
    const responseText = assistantText || (result?.response || result?.answer || result?.text || result?.data?.response || result?.data?.answer || result?.data?.text || '')
    const documentSource = assistantDocSource || (result?.document_source || result?.documentSource || result?.source || result?.data?.document_source || result?.data?.documentSource || '')

    setResponseStatus(event, 201)
    return {
      success: true,
      message: 'RAG prediction process completed.',
      status_code: 201,
      data: {
        response: responseText,
        document_source: documentSource,
        chat_id,
      },
    }
  } catch (err: any) {
    const message = err?.message || 'Failed to get prediction from RAG'
    const status = err?.statusCode || 500
    throw new CustomError(message, status)
  }
})
