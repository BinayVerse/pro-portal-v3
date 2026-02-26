import { defineStore } from 'pinia'
import { ref } from 'vue'
import dayjs from 'dayjs'
import { useAuthStore } from '~/stores/auth/index'
import { useArtefactsStore } from '~/stores/artefacts'
import { formatResponseToHtml } from '~/utils/formatResponse'

export const useChatStore = defineStore('chat', () => {
  const auth = useAuthStore()

  const messages = ref<any[]>([])
  const conversations = ref<any[]>([])
  const loading = ref(false)
  const historyLoading = ref(false)
  const currentChatId = ref<string | null>(null)

  // Track current selected category/document for marking in UI
  const selectedCategoryId = ref<string | null>(null)
  const selectedDocumentId = ref<string | null>(null)

  const USAGE_LIMIT_TEXT = 'usage limit for your plan has been reached'

  function isUsageLimitMessage(text?: string) {
    return typeof text === 'string' &&
      text.toLowerCase().includes(USAGE_LIMIT_TEXT)
  }

  function cleanUsageLimitContent(text: string) {
    return text
      .replace(/question\s*:\s*.*?\n+/is, '')
      .replace(/answer\s*:\s*/i, '')
      .trim()
  }


  function formatMessageFromRow(r: any) {
    const msg = r.message || {}

    // New interaction format: { messages: [ {role, ...}, ... ] }
    if (msg && typeof msg === 'object' && Array.isArray(msg.messages)) {
      const mapped: any[] = []
      // Group messages: user messages add as-is, assistant messages may carry meta and should be grouped
      let pendingUser: any[] = []
      for (const m of msg.messages) {
        if (!m) continue
        if (m.role === 'user') {
          const userText = typeof m.text === 'string' ? m.text : JSON.stringify(m.text || m.content || m)
          mapped.push({ from: 'user', content: userText })
        } else {
          // assistant: if meta_type present, create a single bot message with meta
          const metaType = m.meta_type || m.meta?.type || m.metaType || undefined
          const content = typeof m.response === 'string' ? m.response : m.text || JSON.stringify(m.response || m.answer || m)
          const botMsg: any = { from: 'bot', content, contentHtml: undefined }
          if (m.citations && m.citations.length) botMsg.citations = m.citations
          if (m.document_source || m.documentSource) botMsg.citations = [m.document_source || m.documentSource]
          if (metaType) {
            botMsg.meta = { type: metaType }
            // Ensure history view shows disabled controls
            botMsg.meta.disabled = true
            // propagate known meta fields if present
            if (m.categoryId) botMsg.meta.categoryId = m.categoryId
            if (m.categoryName) botMsg.meta.categoryName = m.categoryName
            if (m.documents) botMsg.meta.documents = m.documents
            if (m.artefactId) botMsg.meta.artefactId = m.artefactId
            if (m.hasMore !== undefined) botMsg.meta.hasMore = m.hasMore
            if (m.noDocuments) botMsg.meta.noDocuments = m.noDocuments
            // preserve actions when present
            if (m.actions) botMsg.meta.actions = m.actions
          }
          mapped.push(botMsg)
        }
      }
      return mapped
    }

    if (msg && typeof msg === 'object' && (msg.user || msg.assistant)) {
      const mapped: any[] = []
      if (msg.user) {
        const userText = typeof msg.user === 'string' ? msg.user : msg.user.text || JSON.stringify(msg.user)
        mapped.push({ from: 'user', content: userText })
      }
      if (msg.assistant) {
        const assistant = msg.assistant
        let content = ''
        let citations: string[] = []
        if (typeof assistant === 'string') content = assistant
        else if (assistant.response) content = assistant.response
        else if (assistant.data && assistant.data.response) content = assistant.data.response
        else if (assistant.answer) content = assistant.answer
        else content = JSON.stringify(assistant)

        if (assistant.document_source) citations = [assistant.document_source]
        if (assistant.documentSource) citations = [assistant.documentSource]
        if (assistant.data && assistant.data.document_source) citations = [assistant.data.document_source]

        mapped.push({ from: 'bot', content, contentHtml: undefined, citations })
      }
      return mapped
    }

    // fallback
    return [{ from: 'user', content: JSON.stringify(r) }]
  }

  function extractContent(m: any) {
    if (!m) return ''
    if (typeof m === 'string') return m
    // m may be a message object
    const candidate = m.response || m.text || m.answer || m.content || m.message || m
    if (!candidate) return ''
    if (typeof candidate === 'string') return candidate
    if (typeof candidate === 'object') {
      return (
        candidate.response ||
        candidate.text ||
        candidate.answer ||
        candidate.data?.response ||
        JSON.stringify(candidate)
      )
    }
    return String(candidate)
  }

  function ensureChatId() {
    if (currentChatId.value) return currentChatId.value
    try {
      // @ts-ignore - browser crypto
      const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`
      currentChatId.value = String(id)
    } catch (e) {
      currentChatId.value = `chat_${Date.now()}_${Math.floor(Math.random() * 10000)}`
    }
    return currentChatId.value
  }

  async function fetchConversations() {
    historyLoading.value = true
    try {
      const token = auth.token || undefined
      const userId = auth.user?.user_id
      if (!token || !userId) {
        conversations.value = []
        historyLoading.value = false
        return
      }

      const res: any = await $fetch(`/api/chat/history?user_id=${encodeURIComponent(userId)}&limit=50`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const rows = res?.data || []
      const map = new Map<string, any>()
      for (const r of rows) {
        const cid = r.chat_id || 'unknown'
        const existing = map.get(cid)
        if (!existing || new Date(r.created_at) > new Date(existing.created_at)) {
          const msg = r.message || {}
          // header
          let header = ''
          if (msg && typeof msg === 'object' && Array.isArray(msg.messages) && msg.messages.length) {
            // first user message or first available text
            const first = msg.messages.find((m: any) => m && m.role === 'user') || msg.messages[0]
            header = first && (first.text || first.content || JSON.stringify(first))

            if (isUsageLimitMessage(header)) {
              header = cleanUsageLimitContent(header)
            }

          } else if (msg && typeof msg === 'object' && msg.user) header = typeof msg.user === 'string' ? msg.user : msg.user.text || ''
          else if (msg && (msg.title || msg.subject)) header = msg.title || msg.subject
          else if (typeof msg === 'string') header = msg
          else if (msg.text) header = msg.text
          else header = JSON.stringify(msg)
          header = (header || '').toString().trim()
          if (header.length > 80) header = header.slice(0, 77) + '...'

          // body
          let body = ''
          if (msg && typeof msg === 'object' && Array.isArray(msg.messages) && msg.messages.length) {
            // latest assistant response
            const lastAssistant = [...msg.messages].reverse().find((m: any) => m && m.role === 'assistant')
            if (lastAssistant) {
              body = extractContent(lastAssistant)
              if (isUsageLimitMessage(body)) {
                body = cleanUsageLimitContent(body)
              }
            }

          } else if (msg && typeof msg === 'object' && msg.assistant) {
            const a = msg.assistant
            if (typeof a === 'string') body = a
            else if (a.response) body = a.response
            else if (a.data && a.data.response) body = a.data.response
            else if (a.answer) body = a.answer
          }
          if (!body && msg.response) body = msg.response
          if (!body && msg.text && typeof msg.text === 'string') body = msg.text
          if (!body && typeof msg === 'string') body = msg
          body = (body || '').toString().trim()
          if (body.length > 300) body = body.slice(0, 297) + '...'

          const formatted = r.created_at ? dayjs(r.created_at).format('MM/DD/YYYY hh:mm A') : ''
          map.set(cid, { chat_id: cid, header, body, last_at: r.created_at, last_at_formatted: formatted })
        }
      }

      conversations.value = Array.from(map.values()).sort((a, b) => new Date(b.last_at).getTime() - new Date(a.last_at).getTime())
    } catch (err: any) {
      // rethrow so callers can handle
      throw err
    } finally {
      historyLoading.value = false
    }
  }

  async function loadConversation(chatId: string) {
    if (!chatId) return
    messages.value = []
    currentChatId.value = chatId
    loading.value = true
    try {
      const token = auth.token || undefined
      if (!token) throw new Error('unauthorized')
      const res: any = await $fetch(`/api/chat/history?chat_id=${encodeURIComponent(chatId)}&limit=500`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      const rows = res?.data || []
      const ordered = (rows || []).slice().reverse()
      const mapped: any[] = []
      for (const r of ordered) {
        const msg = r.message || {}

        if (msg && typeof msg === 'object' && Array.isArray(msg.messages)) {
          for (const m of msg.messages) {
            if (!m) continue
            if (m.role === 'user') {
              const userText = typeof m.text === 'string' ? m.text : JSON.stringify(m.text || m.content || m)
              mapped.push({ from: 'user', content: userText })
            } else {
              const metaType = m.meta_type || m.meta?.type || m.metaType || undefined
              let content = typeof m.response === 'string'
                ? m.response
                : m.text || JSON.stringify(m.response || m.answer || m)

              if (isUsageLimitMessage(content)) {
                content = cleanUsageLimitContent(content)
              }

              const botMsg: any = {
                from: 'bot',
                content,
                contentHtml: isUsageLimitMessage(content)
                  ? undefined
                  : formatResponseToHtml(content),
              }
              if (m.citations && m.citations.length) botMsg.citations = m.citations
              if (m.document_source || m.documentSource) botMsg.citations = [m.document_source || m.documentSource]
              if (metaType) {
                botMsg.meta = { type: metaType }
                // mark as disabled when shown from history
                botMsg.meta.disabled = true
                if (m.categories) botMsg.meta.categories = m.categories
                if (m.categoryId) botMsg.meta.categoryId = m.categoryId
                if (m.categoryName) botMsg.meta.categoryName = m.categoryName
                if (m.documents) botMsg.meta.documents = m.documents
                if (m.artefactId) botMsg.meta.artefactId = m.artefactId
                if (m.hasMore !== undefined) botMsg.meta.hasMore = m.hasMore
                if (m.noDocuments) botMsg.meta.noDocuments = m.noDocuments
                if (m.actions) botMsg.meta.actions = m.actions
              }
              mapped.push(botMsg)
            }
          }
          continue
        }

        if (msg && typeof msg === 'object' && (msg.user || msg.assistant)) {
          if (msg.user) {
            const userText = typeof msg.user === 'string' ? msg.user : msg.user.text || JSON.stringify(msg.user)
            mapped.push({ from: 'user', content: userText })
          }
          if (msg.assistant) {
            const assistant = msg.assistant
            let content = ''
            let citations: string[] = []
            if (typeof assistant === 'string') content = assistant
            else if (assistant.response) content = assistant.response
            else if (assistant.data && assistant.data.response) content = assistant.data.response
            else if (assistant.answer) content = assistant.answer
            else content = JSON.stringify(assistant)

            if (assistant.document_source) citations = [assistant.document_source]
            if (assistant.documentSource) citations = [assistant.documentSource]
            if (assistant.data && assistant.data.document_source) citations = [assistant.data.document_source]

            if (isUsageLimitMessage(content)) {
              content = cleanUsageLimitContent(content)
            }

            mapped.push({
              from: 'bot',
              content,
              contentHtml: isUsageLimitMessage(content)
                ? undefined
                : formatResponseToHtml(content),
              citations
            })
          }
        } else {
          const role = r.role || (r.message && r.message.role) || 'user'
          let content = ''
          let citations: string[] = []
          if (typeof msg === 'string') content = msg
          else if (msg.text) content = msg.text
          else if (msg.response) content = msg.response
          else content = JSON.stringify(msg)
          if (msg.document_source) citations = [msg.document_source]
          if (msg.documentSource) citations = [msg.documentSource]
          mapped.push({ from: role === 'user' ? 'user' : 'bot', content, contentHtml: role === 'user' ? undefined : formatResponseToHtml(content), citations })
        }
      }

      messages.value = mapped

      // Reconstruct selection markers from history by looking at each user message and the immediately preceding
      // agent_list/document_list. Decode HTML entities and normalize names for matching. Only mark selection on that
      // specific list message; do not propagate to other messages.
      try {
        selectedCategoryId.value = null
        selectedDocumentId.value = null

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
        const normalizeName = (s: any) => {
          const t = decodeHtml(String(s || ''))
          return t
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/&amp;|&/g, '&')
            .replace(/[^a-z0-9\s&]/gi, '')
            .replace(/\s+/g, ' ')
            .trim()
        }

        for (let i = 0; i < mapped.length; i++) {
          const cur = mapped[i]
          if (!cur || cur.from !== 'user' || !cur.content) continue
          const prev = i > 0 ? mapped[i - 1] : null
          if (!prev || !prev.meta) continue

          const typed = normalizeName(cur.content)
          if (!typed) continue

          // If the immediately preceding message is an agent_list, try to match category name/id
          if (prev.meta.type === 'agent_list' && Array.isArray(prev.meta.categories)) {
            let matchedId: string | null = null
            for (const c of prev.meta.categories) {
              if (!c) continue
              const nameNorm = normalizeName(c.name)
              const idNorm = normalizeName(c.id)
              if (nameNorm === typed || idNorm === typed || nameNorm.startsWith(typed)) {
                matchedId = String(c.id)
                break
              }
            }
            if (matchedId) {
              prev.meta.categories = prev.meta.categories.map((c: any) => ({ ...c, selected: String(c.id) === matchedId }))
              prev.meta.selectedCategoryId = matchedId
            }
          }

          // If the immediately preceding message is a document_list, try to match document name/id
          if (prev.meta.type === 'document_list' && Array.isArray(prev.meta.documents)) {
            let matchedDoc: string | null = null
            for (const d of prev.meta.documents) {
              if (!d) continue
              const nameNorm = normalizeName(d.name)
              const idNorm = normalizeName(d.id)
              if (nameNorm === typed || idNorm === typed || nameNorm.startsWith(typed)) {
                matchedDoc = String(d.id)
                break
              }
            }
            if (matchedDoc) {
              prev.meta.documents = prev.meta.documents.map((d: any) => ({ ...d, selected: String(d.id) === matchedDoc }))
              prev.meta.selectedDocumentId = matchedDoc
              if (prev.meta.categoryId) prev.meta.selectedCategoryId = String(prev.meta.categoryId)
            }
          }
        }
      } catch (e) {
        // ignore
      }

    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(payload: any) {
    loading.value = true

    // Greeting detection utilities
    const GREETING_WORDS = [
      'hi',
      'hello',
      'hey',
      'greetings',
      'hola',
      'yo',
      'howdy',
      'sup',
      'good morning',
      'good afternoon',
      'good evening',
      'hiya',
      'heya',
      'heyya',
      'hallo',
      'helo',
      'hlo',
      'hlw',
    ]

    // Matches strings made up of only emojis and optional whitespace/punctuation
    const ONLY_EMOJI_RE = /^\s*(?:[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D])+[\s!,.?]*$/u

    // simple levenshtein distance for fuzzy matching small typos
    function levenshtein(a: string, b: string) {
      if (!a) return b.length
      if (!b) return a.length
      const m = a.length
      const n = b.length
      const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))
      for (let i = 0; i <= m; i++) dp[i][0] = i
      for (let j = 0; j <= n; j++) dp[0][j] = j
      for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1
          dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
        }
      }
      return dp[m][n]
    }

    function normalizeGreetingText(s: string) {
      if (!s) return ''
      // collapse repeated letters (e.g. hiiii -> hi)
      let t = s.toLowerCase().trim()
      t = t.replace(/([a-z])\1+/g, '$1')
      // remove punctuation except spaces
      t = t.replace(/[^a-z\s]/g, '')
      return t
    }

    function isGreeting(text: string) {
      if (!text) return false
      if (ONLY_EMOJI_RE.test(text)) return true
      const norm = normalizeGreetingText(text)
      if (!norm) return false
      const tokens = norm.split(/\s+/)
      // Only consider greeting intent for short inputs (avoid classifying full questions as greetings)
      if (tokens.length > 3) return false

      // If the first token is a question word, treat as question not greeting (e.g., "how", "what")
      const QUESTION_WORDS = new Set([
        'how',
        'what',
        'when',
        'why',
        'who',
        'which',
        'where',
        'whats',
        'howmany',
        'howmuch',
      ])
      const first = tokens[0]
      if (QUESTION_WORDS.has(first)) return false

      // check multi-word greetings first
      for (const g of GREETING_WORDS) {
        if (g.includes(' ') && norm.startsWith(g)) return true
      }

      for (const g of GREETING_WORDS) {
        if (first === g) return true
        // Only attempt fuzzy matching when the token lengths are similar; this prevents
        // short tokens like "how" from matching longer greetings like "howdy".
        if (Math.abs(first.length - g.length) > 1) continue
        // allow fuzzy match up to distance 1 for short words, 2 for longer
        const threshold = g.length >= 5 ? 2 : 1
        if (levenshtein(first, g) <= threshold) return true
      }
      return false
    }

    const GREETING_VARIANTS = [
      "Hi there! 👋 I'm here to help.",
      "Hello! 👋 I’m ready to help you out.",
      "Hey! 🙌 I'm ready to help you.",
      "Hi! 😊 Let’s get started.",
    ]

    function pickGreeting() {
      const idx = Math.floor(Math.random() * GREETING_VARIANTS.length)
      return GREETING_VARIANTS[idx]
    }

    try {
      const token = auth.token || undefined
      if (!token) throw new Error('unauthorized')

      // determine the user text
      const userText = (payload && (payload.question || payload.text || payload.message || '')) || ''

      // ensure chat id for this session
      const chatId = ensureChatId()

      // optimistic add user message but avoid duplicates if last user message already equals this one
      if (userText) {
        const last = messages.value.length ? messages.value[messages.value.length - 1] : null
        const lastText = last && last.from === 'user' ? String(last.content || '').trim() : ''
        const cur = String(userText || '').trim()
        if (!last || lastText !== cur) {
          messages.value.push({ from: 'user', content: userText })
        }
      }

      const textToCheck = String(userText || '').trim()

      // If message is empty, proceed to call the API (to let server handle edge cases)
      if (textToCheck) {
        const isOnlyEmoji = ONLY_EMOJI_RE.test(textToCheck)
        const matchesGreeting = isGreeting(textToCheck)

        if (isOnlyEmoji || matchesGreeting) {
          // Short-circuit: return a static greeting and show AI agent options
          const greetingText = pickGreeting()
          const botMessage: any = {
            from: 'bot',
            content: greetingText,
            contentHtml: formatResponseToHtml(greetingText),
          }
          messages.value.push(botMessage)

          // Persist greeting as a single 'interaction' row (create or update)
          try {
            const authStore = useAuthStore()
            const uid = authStore.user?.user_id
            const oid = authStore.user?.org_id
            const requestSource = payload?.request_source || 'admin'

            const messagePayload = {
              messages: [
                { role: 'user', text: userText },
                { role: 'assistant', response: greetingText },
              ],
            }

            await $fetch('/api/chat/history', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
              body: {
                user_id: uid,
                org_id: oid,
                chat_id: chatId,
                role: 'interaction',
                upsert: true,
                message: messagePayload,
                metadata: { request_source: requestSource, type: 'greeting' },
              },
            })
          } catch (e) {
            console.warn('Failed to persist greeting interaction:', (e as any)?.message || e)
          }

          // Push interactive agent options (categories)
          await showAgentOptions()

          return botMessage
        }
      }

      // If the most recent bot message is an interactive agent_list and the user typed an agent name,
      // auto-select that category instead of calling RAG. This preserves exact user selection behavior.
      try {
        const lastAgentMsg = [...messages.value].reverse().find((m: any) => m && m.meta && m.meta.type === 'agent_list' && !m.meta.disabled)
        if (lastAgentMsg && Array.isArray(lastAgentMsg.meta.categories) && textToCheck) {
          const normalize = (s: any) => String(s || '').toLowerCase().replace(/&amp;|&/g, '&').replace(/[^a-z0-9\s&]/gi, '').replace(/\s+/g, ' ').trim()
          const typed = normalize(textToCheck)
          const matched = lastAgentMsg.meta.categories.find((c: any) => normalize(c.name) === typed || normalize(c.id) === typed)
          if (matched && matched.id) {
            // call selectCategory to produce document_list and persist selection
            try {
              const sel = await selectCategory(matched.id)
              return sel
            } catch (e) {
              // fallthrough to normal behavior on error
            }
          }
        }
      } catch (e) {
        // ignore and proceed to RAG
      }

      // Proceed with normal RAG prediction
      const res: any = await $fetch('/api/predict_rag', {
        method: 'POST',
        body: { ...payload, chat_id: chatId },
        headers: { Authorization: `Bearer ${token}` },
      })

      const apiResponse = res || {}
      let content = ''
      let docSource = ''
      if (apiResponse.success) {
        content = apiResponse.data?.response || ''
        docSource = apiResponse.data?.document_source || apiResponse.data?.documentSource || ''
        if (apiResponse.data?.chat_id) currentChatId.value = apiResponse.data.chat_id
      } else if (apiResponse.status === 'success' && apiResponse.data) {
        const d = apiResponse.data
        content = d.response || d.answer || d.text || ''
        docSource = d.document_source || d.documentSource || ''
        if (d.chat_id) currentChatId.value = d.chat_id
      } else {
        content = JSON.stringify(apiResponse)
      }

      // Present RAG response as a Question / Answer block for clarity
      const userQuestion = String(userText || '').trim()

      let finalContent = content
      let finalHtml: string | undefined = undefined

      if (isUsageLimitMessage(content)) {
        finalContent = content
        finalHtml = undefined
      } else {
        const serverProvidedQA =
          typeof content === 'string' &&
          (/^\s*Question\s*:/i.test(content) || /\n\s*Answer\s*:/i.test(content))

        finalContent = serverProvidedQA
          ? content
          : (userQuestion ? `Question: ${userQuestion}\n\nAnswer:\n${content}` : content)

        finalHtml = formatResponseToHtml(finalContent)
      }

      const botMessage: any = {
        from: 'bot',
        content: finalContent,
        contentHtml: finalHtml,
      }

      if (docSource) botMessage.citations = [docSource]
      messages.value.push(botMessage)


      if (isUsageLimitMessage(finalContent)) {
        // 🚫 Do NOT persist usage-limit messages
        return botMessage
      }

      // Persist the interaction so history stores the same QA content
      try { await persistInteraction() } catch (e) { /* ignore */ }

      return botMessage
    } catch (err: any) {
      throw err
    } finally {
      loading.value = false
    }
  }

  // Show AI agent options (document categories)
  async function showAgentOptions() {
    try {
      const artefactsStore = useArtefactsStore()
      const orgId = auth.user?.org_id || undefined
      if (!orgId) return

      // ensure categories and artifacts are loaded
      await Promise.all([artefactsStore.fetchCategories(orgId), artefactsStore.fetchArtefacts()])
      const cats = artefactsStore.categories || []
      const artefacts = artefactsStore.artefacts || []

      // helper to check if a category has any summarized documents
      const categoryHasSummaries = (categoryName: string) => {
        if (!categoryName) return false
        const nameStr = String(categoryName).toString()
        return artefacts.some((d: any) => {
          const catVal = (d.category || d.fileCategory || d.file_category || d.category_name || '').toString()
          const summarized = String(d.summarized || '').toLowerCase()
          return catVal === nameStr && (summarized === 'yes' || summarized === 'true' || summarized === '1')
        })
      }

      // filter categories to those with summaries
      const filteredCats = (cats || []).filter((c: any) => categoryHasSummaries(c.name))

      const items = (filteredCats || []).slice(0, 5).map((c: any) => ({ id: c.id, name: c.name }))
      const hasMore = (filteredCats || []).length > 5

      const msg: any = {
        from: 'bot',
        content: "Which AI Agent would you like to start with?",
        contentHtml: formatResponseToHtml("Which AI Agent would you like to start with?"),
        meta: {
          type: 'agent_list',
          // ensure categories don't carry stale selected flags on this new list
          categories: (items || []).map((c: any) => ({ id: c.id, name: c.name, selected: false })),
          hasMore,
        },
      }

      // Lock (disable) previous agent_list messages but preserve their selected flags so history reflects user choices
      try {
        for (const mm of messages.value) {
          if (mm && mm.meta && mm.meta.type === 'agent_list') {
            mm.meta.disabled = true
            mm.meta.actions = []
            mm.meta.hasMore = false
            // keep mm.meta.categories selected flags intact
          }
        }
      } catch (e) {
        // ignore
      }

      messages.value.push(msg)
      return msg
    } catch (err: any) {
      console.error('Failed to load agent options:', err)
    }
  }

  // Show full agent/category list
  async function showAllAgentOptions() {
    try {
      const artefactsStore = useArtefactsStore()
      const orgId = auth.user?.org_id || undefined
      if (!orgId) return

      // ensure all categories and artefacts are loaded
      await Promise.all([artefactsStore.getAllCategories(), artefactsStore.fetchArtefacts()])
      const cats = artefactsStore.categories || []
      const artefacts = artefactsStore.artefacts || []

      const categoryHasSummaries = (categoryName: string) => {
        if (!categoryName) return false
        const nameStr = String(categoryName).toString()
        return artefacts.some((d: any) => {
          const catVal = (d.category || d.fileCategory || d.file_category || d.category_name || '').toString()
          const summarized = String(d.summarized || '').toLowerCase()
          return catVal === nameStr && (summarized === 'yes' || summarized === 'true' || summarized === '1')
        })
      }

      const filteredCats = (cats || []).filter((c: any) => categoryHasSummaries(c.name))
      const items = (filteredCats || []).map((c: any) => ({ id: c.id, name: c.name }))

      const msg: any = {
        from: 'bot',
        content: "Which AI Agent would you like to start with?",
        contentHtml: formatResponseToHtml("Which AI Agent would you like to start with?"),
        meta: {
          type: 'agent_list',
          categories: (items || []).map((c: any) => ({ id: c.id, name: c.name, selected: false })),
          hasMore: false,
        },
      }

      // Lock previous agent_list messages so they can't be changed, but keep their selected flags
      try {
        for (const mm of messages.value) {
          if (mm && mm.meta && mm.meta.type === 'agent_list') {
            mm.meta.disabled = true
            mm.meta.actions = []
            mm.meta.hasMore = false
          }
        }
      } catch (e) {
        // ignore
      }

      messages.value.push(msg)
      return msg
    } catch (err: any) {
      console.error('Failed to load all agent options:', err)
    }
  }

  // When a category is selected, show top documents for that category
  async function selectCategory(categoryId: number, originMsg?: any) {
    try {
      const artefactsStore = useArtefactsStore()
      const orgId = auth.user?.org_id || undefined
      if (!orgId) return

      // Ensure artefacts are loaded
      await artefactsStore.fetchArtefacts()

      const categoryObj = artefactsStore.categories.find((c: any) => c.id === categoryId)
      const categoryName = categoryObj?.name
      if (!categoryName) {
        const msg: any = { from: 'bot', content: 'Category not found.' }
        messages.value.push(msg)
        await persistInteraction()
        return msg
      }

      // Disable previous agent lists so they are not interactive; remove actions and more button from disabled messages
      for (const m of messages.value) {
        if (m.meta && m.meta.type === 'agent_list') {
          // lock previous lists but preserve their selected flags
          m.meta.disabled = true
          m.meta.actions = []
          m.meta.hasMore = false
        }
      }

      // mark selection locally
      selectedCategoryId.value = String(categoryId)
      selectedDocumentId.value = null

      // Mark the originating agent_list message with selected category so history reflects exact user action
      try {
        // Determine target message: prefer provided originMsg, else most recent agent_list
        let target: any = originMsg || null
        if (!target) {
          for (let i = messages.value.length - 1; i >= 0; i--) {
            const m = messages.value[i]
            if (m && m.meta && m.meta.type === 'agent_list') { target = m; break }
          }
        }

        if (target && target.meta && Array.isArray(target.meta.categories)) {
          target.meta.categories = target.meta.categories.map((c: any) => ({ ...c, selected: String(c.id) === String(categoryId) }))
          target.meta.selectedCategoryId = categoryId
        }
      } catch (e) {
        // ignore
      }

      // Filter artefacts: check multiple potential category fields including 'category'
      const docs = (artefactsStore.artefacts || []).filter((d: any) => {
        const catVal = (d.category || d.fileCategory || d.file_category || d.category_name || '').toString()
        return catVal === categoryName.toString()
      })

      if (!docs || docs.length === 0) {
        const msg: any = {
          from: 'bot',
          content: `No knowledge base found for this AI agent.`,
          contentHtml: formatResponseToHtml(`No knowledge base found for this AI agent.`),
          meta: {
            type: 'document_list',
            categoryId,
            categoryName,
            documents: [],
            hasMore: false,
            noDocuments: true,
            actions: [
              { id: 'back', label: 'Back' },
              { id: 'start_over', label: 'Start Over' },
            ],
          },
        }
        messages.value.push(msg)
        await persistInteraction()
        return msg
      }

      const items = (docs || []).slice(0, 5).map((d: any) => ({ id: d.id, name: d.name, summarized: d.summarized }))
      const hasMore = (docs || []).length > 5

      const msg: any = {
        from: 'bot',
        content: `Ask a question or tap here to explore the knowledge base.`,
        contentHtml: formatResponseToHtml(`Ask a question or tap here to explore the knowledge base.`),
        meta: {
          type: 'document_list',
          categoryId,
          categoryName,
          documents: items,
          hasMore,
          actions: [
            { id: 'back', label: 'Back' },
            { id: 'start_over', label: 'Start Over' },
          ],
        },
      }

      messages.value.push(msg)
      await persistInteraction()
      return msg
    } catch (err: any) {
      console.error('Failed to load documents for category:', err)
    }
  }

  // When a document is selected, show its summary (fetch if required)
  async function selectDocument(artefactId: number) {
    try {
      const artefactsStore = useArtefactsStore()
      // Ensure artefacts are loaded
      await artefactsStore.fetchArtefacts()

      const doc = (artefactsStore.artefacts || []).find((d: any) => String(d.id) === String(artefactId))
      if (!doc) {
        const notFoundMsg: any = { from: 'bot', content: 'Document not found.' }
        messages.value.push(notFoundMsg)
        return notFoundMsg
      }

      // Disable previous document lists so they are not interactive; remove actions and more button from disabled messages
      messages.value.forEach((m) => {
        if (m.meta && m.meta.type === 'document_list') {
          m.meta.disabled = true
          m.meta.actions = []
          m.meta.hasMore = false
        }
      })

      // mark selected document
      selectedDocumentId.value = String(artefactId)

      // Mark the originating document_list message with selected document so history reflects exact user action
      try {
        // Clear selected markers across all document_list messages first
        for (const mm of messages.value) {
          if (mm && mm.meta && mm.meta.type === 'document_list' && Array.isArray(mm.meta.documents)) {
            mm.meta.documents = mm.meta.documents.map((d: any) => ({ ...d, selected: false }))
            if (mm.meta.selectedDocumentId) delete mm.meta.selectedDocumentId
          }
        }

        for (let i = messages.value.length - 1; i >= 0; i--) {
          const m = messages.value[i]
          if (m && m.meta && m.meta.type === 'document_list') {
            if (m.meta.documents && Array.isArray(m.meta.documents)) {
              m.meta.documents = m.meta.documents.map((d: any) => ({ ...d, selected: String(d.id) === String(artefactId) }))
            }
            m.meta.selectedDocumentId = artefactId
            break
          }
        }
      } catch (e) {
        // ignore
      }

      // If summary exists, show it
      if (doc.summary) {
        const msg: any = {
          from: 'bot',
          content: doc.summary,
          contentHtml: formatResponseToHtml(doc.summary),
          meta: {
            type: 'document_summary',
            artefactId: artefactId,
            actions: [
              { id: 'back', label: 'Back' },
              { id: 'start_over', label: 'Start Over' },
            ],
          },
        }
        messages.value.push(msg)
        await persistInteraction()
        return msg
      }

      // Else, trigger summarization and wait for it
      const summarization = await artefactsStore.summarizeArtefact(artefactId)
      if (!summarization || !summarization.success) {
        const errMsg: any = { from: 'bot', content: 'Failed to generate summary for this document.' }
        messages.value.push(errMsg)
        await persistInteraction()
        return errMsg
      }

      // Reload artefacts to pick up summary
      await artefactsStore.fetchArtefacts()
      const updated = (artefactsStore.artefacts || []).find((d: any) => String(d.id) === String(artefactId))
      const summaryText = updated?.summary || 'Summary generated, but content not found.'
      const msg: any = {
        from: 'bot',
        content: summaryText,
        contentHtml: formatResponseToHtml(summaryText),
        meta: {
          type: 'document_summary',
          artefactId: artefactId,
          actions: [
            { id: 'back', label: 'Back' },
            { id: 'start_over', label: 'Start Over' },
          ],
        },
      }
      messages.value.push(msg)
      await persistInteraction()
      return msg
    } catch (err: any) {
      console.error('Failed to load document summary:', err)
      const errMsg: any = { from: 'bot', content: 'Failed to load document summary.' }
      messages.value.push(errMsg)
      return errMsg
    }
  }

  async function persistInteraction() {
    try {
      const token = auth.token || undefined
      if (!token) return
      const uid = auth.user?.user_id
      const oid = auth.user?.org_id
      const chatId = ensureChatId()

      // Build messages payload from in-memory messages
      const payloadMsgs: any[] = []
      for (const m of messages.value) {
        if (!m) continue
        if (m.from === 'user') payloadMsgs.push({ role: 'user', text: m.content })
        else {
          const assistantObj: any = { role: 'assistant', response: m.content }
          if (m.citations && m.citations.length) assistantObj.citations = m.citations

          // Preserve meta details so history can render agent/document lists and summaries (disabled in history UI)
          if (m.meta && m.meta.type) {
            assistantObj.meta_type = m.meta.type
            // copy common meta fields
            if (m.meta.categories) assistantObj.categories = m.meta.categories
            if (m.meta.documents) assistantObj.documents = m.meta.documents
            if (m.meta.categoryId) assistantObj.categoryId = m.meta.categoryId
            if (m.meta.categoryName) assistantObj.categoryName = m.meta.categoryName
            if (m.meta.artefactId) assistantObj.artefactId = m.meta.artefactId
            if (m.meta.hasMore !== undefined) assistantObj.hasMore = m.meta.hasMore
            if (m.meta.noDocuments !== undefined) assistantObj.noDocuments = m.meta.noDocuments
            if (m.meta.actions) assistantObj.actions = m.meta.actions

            // categoryName should be populated from m.meta when available; no content-based fallback needed
          }

          payloadMsgs.push(assistantObj)
        }
      }

      const body = {
        user_id: uid,
        org_id: oid,
        chat_id: chatId,
        role: 'interaction',
        upsert: true,
        message: { messages: payloadMsgs },
        metadata: { request_source: 'admin' },
      }

      await $fetch('/api/chat/history', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body,
      })
    } catch (e) {
      console.warn('Failed to persist interaction:', (e as any)?.message || e)
    }
  }

  // Disable interactive messages (agent/document lists and summaries) in the current chat
  let _persistTimer: any = null
  const PERSIST_DEBOUNCE_MS = 1000

  function disableInteractiveMessages() {
    try {
      for (const m of messages.value) {
        if (!m || !m.meta) continue
        // mark interactive meta as disabled and clear actions so UI shows as non-interactive
        if (m.meta.type === 'agent_list' || m.meta.type === 'document_list' || m.meta.type === 'document_summary' || m.meta.actions) {
          m.meta.disabled = true
          if (m.meta.actions) m.meta.actions = []
          if (m.meta.hasMore !== undefined) m.meta.hasMore = false
        }
      }
      // Note: do not clear per-message selected flags here. We want previous agent/document selections
      // to remain visible and locked in the chat UI. Global selectedCategoryId/selectedDocumentId are
      // left as-is; clearing them should be handled only when the user deliberately starts a new flow.
    } catch (e) {
      console.warn('Failed to disable interactive messages:', (e as any)?.message || e)
    }
  }

  function schedulePersistInteraction() {
    try {
      if (_persistTimer) clearTimeout(_persistTimer)
      _persistTimer = setTimeout(() => {
        _persistTimer = null
        // call persistInteraction but don't await
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        persistInteraction()
      }, PERSIST_DEBOUNCE_MS)
    } catch (e) {
      console.warn('Failed to schedule persistInteraction:', (e as any)?.message || e)
    }
  }

  async function startOver(showAgent = false) {
    // clear chat and optionally show agent options
    messages.value = []
    selectedCategoryId.value = null
    selectedDocumentId.value = null
    // create a fresh chat id immediately so subsequent actions use a new session id
    currentChatId.value = null
    ensureChatId()
    if (showAgent) await showAgentOptions()
  }

  function setLoading(val: boolean) {
    try { loading.value = !!val } catch (e) { /* ignore */ }
  }

  async function goBack() {
    try {
      // If the last visible message is a document_summary, try to restore the previous document_list
      const msgs = messages.value || []
      const lastMsg = msgs.length ? msgs[msgs.length - 1] : null
      if (lastMsg && lastMsg.meta && lastMsg.meta.type === 'document_summary') {
        // Find the most recent document_list message earlier in the conversation
        for (let i = msgs.length - 1; i >= 0; i--) {
          const m = msgs[i]
          if (m && m.meta && m.meta.type === 'document_list') {
            // Re-open this document list
            const listMeta = m.meta
            const categoryId = listMeta.categoryId
            const categoryName = listMeta.categoryName
            const documents = listMeta.documents || []
            // mark selection
            selectedCategoryId.value = categoryId ? String(categoryId) : null
            selectedDocumentId.value = null

            // push a fresh document_list message to make it interactive again
            const msg: any = {
              from: 'bot',
              content: `Ask a question or tap here to explore the knowledge base.`,
              contentHtml: formatResponseToHtml(`Ask a question or tap here to explore the knowledge base.`),
              meta: {
                type: 'document_list',
                categoryId: categoryId,
                categoryName: categoryName,
                documents: documents,
                hasMore: listMeta.hasMore || false,
                actions: [
                  { id: 'back', label: 'Back' },
                  { id: 'start_over', label: 'Start Over' },
                ],
              },
            }

            messages.value.push(msg)
            return msg
          }
        }
      }

      // default behaviour: show agent options
      selectedDocumentId.value = null
      selectedCategoryId.value = null
      await showAgentOptions()
    } catch (err: any) {
      console.error('Failed to go back:', err)
      await showAgentOptions()
    }
  }

  return {
    messages,
    conversations,
    loading,
    historyLoading,
    fetchConversations,
    loadConversation,
    sendMessage,
    showAgentOptions,
    showAllAgentOptions,
    selectCategory,
    selectDocument,
    startOver,
    goBack,
    disableInteractiveMessages,
    persistInteraction,
    schedulePersistInteraction,
    selectedCategoryId,
    selectedDocumentId,
    setLoading,
  }
})
