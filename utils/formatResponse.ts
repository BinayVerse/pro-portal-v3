export function escapeHtml(unsafe: string) {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function applyInlineFormatting(text: string) {
  return text.replace(/(\*\*|\*)(.+?)\1/g, '<strong>$2</strong>')
}


function autoLink(text: string) {
  if (!text) return ''
  const urlRe = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/gi
  return text.replace(urlRe, (match) => {
    const href = match.startsWith('http') ? match : `https://${match}`
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="text-primary-400 underline">${match}</a>`
  })
}

export function formatResponseToHtml(text: string) {
  if (!text) return ''
  const lines = text.split(/\r?\n/)
  const parts: string[] = []
  let listType: 'ul' | 'ol' | null = null
  const closeList = () => {
    if (listType) {
      parts.push(`</${listType}>`)
      listType = null
    }
  }
  const bulletRe = /^\s*[-*•]\s+(.*)$/
  const numberRe = /^\s*(\d+)[\.)]\s+(.*)$/
  const emojiBulletRe = /^\s*[⏳🚫✅❌⚠️]\s+(.*)$/
  let paraBuffer: string[] = []
  let pendingBlank = false
  const flushPara = () => {
    if (paraBuffer.length) {
      const t = autoLink(applyInlineFormatting(escapeHtml(paraBuffer.join(' ').trim())))
      if (t) parts.push(`<p>${t}</p>`)
      paraBuffer = []
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, '')
    if (!line.trim()) {
      // blank line: flush any paragraph buffer and mark pending; do not always close list
      flushPara()
      pendingBlank = true
      continue
    }

    // Detect explicit 'Question:' or 'Answer:' labels at line start and render them bolded
    const qaMatch = line.match(/^\s*(Question|Answer)\s*:\s*(.*)$/i)
    if (qaMatch) {
      // flush any pending paragraph so labels start fresh
      flushPara()
      const label = qaMatch[1]
      const rest = qaMatch[2] || ''
      const escapedRest = rest ? autoLink(applyInlineFormatting(escapeHtml(rest.trim()))) : ''
      if (escapedRest) {
        parts.push(`<p><strong>${escapeHtml(label)}:</strong> ${escapedRest}</p>`)
      } else {
        parts.push(`<p><strong>${escapeHtml(label)}:</strong></p>`)
      }
      // do not treat this line as a normal paragraph/list item
      continue
    }

    const b = line.match(bulletRe)
    const n = line.match(numberRe)
    const e = line.match(emojiBulletRe)
    // If there was a blank line before and we have an open list, only close it
    // if the new non-empty line is NOT another list item. This preserves numbered
    // lists that have blank lines between items (common in generated summaries).
    if (pendingBlank) {
      if (!b && !n && !e && listType) {
        closeList()
      }
      pendingBlank = false
    }
    if (b) {
      flushPara()
      if (listType !== 'ul') {
        closeList()
        parts.push('<ul class="list-disc pl-5 space-y-1">')
        listType = 'ul'
      }
      const item = autoLink(applyInlineFormatting(escapeHtml(b[1])))
      parts.push(`<li>${item}</li>`)
      continue
    }
    if (n) {
      flushPara()
      if (listType !== 'ol') {
        closeList()
        parts.push('<ol class="list-decimal pl-5 space-y-1">')
        listType = 'ol'
      }
      const item = autoLink(applyInlineFormatting(escapeHtml(n[2])))
      parts.push(`<li>${item}</li>`)
      continue
    }
    if (e) {
      flushPara()
      if (listType !== 'ul') {
        closeList()
        parts.push('<ul class="list-disc pl-5 space-y-1">')
        listType = 'ul'
      }
      const item = autoLink(applyInlineFormatting(escapeHtml(e[1])))
      parts.push(`<li>${item}</li>`)
      continue
    }
    closeList()
    paraBuffer.push(line.trim())
  }
  closeList()
  flushPara()

  const html = parts.join('') || `<p>${autoLink(applyInlineFormatting(escapeHtml(text.trim())))}</p>`
  return html
}


export function formatPreview(
  text: string,
  maxLength = 160,
  truncate = true
) {
  if (!text) return ''

  const html = formatResponseToHtml(text)

  const plain = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!truncate) return plain

  return plain.length > maxLength
    ? plain.slice(0, maxLength) + '…'
    : plain
}

