import { defineEventHandler, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  const body = await readBody(event) as any
  const priceId = body?.price_id || body?.id || null
  const config = useRuntimeConfig()
  const siteRaw = config.chargebeeSite
  const apiKey = config.chargebeeApiKey

  if (!priceId) return { success: false, error: 'Missing price_id in request body' }
  if (!siteRaw || !apiKey) return { success: false, error: 'Chargebee not configured (site/apiKey)' }

  function normalizeSite(s: string | undefined | null) {
    if (!s) return null
    try {
      let v = String(s).trim()
      v = v.replace(/^https?:\/\//i, '')
      v = v.replace(/\/$/, '')
      if (v.toLowerCase().endsWith('.chargebee.com')) {
        v = v.substring(0, v.length - '.chargebee.com'.length)
      }
      if (v.includes('/')) return null
      return v
    } catch (e) {
      return null
    }
  }

  const site = normalizeSite(siteRaw)
  if (!site) return { success: false, error: 'Invalid chargebeeSite configuration' }

  const auth = Buffer.from(`${apiKey}:`).toString('base64')

  // Try direct GET /prices/{id} first
  try {
    const url = `https://${site}.chargebee.com/api/v2/prices/${encodeURIComponent(String(priceId))}`
    console.log('Chargebee validate-price URL:', url)
    const resp = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
    const text = await resp.text()
    let json = null
    try { json = text ? JSON.parse(text) : null } catch (e) { json = null }

    if (resp.ok && json) {
      return { success: true, exists: true, price: json, status: resp.status }
    }

    // If direct GET failed with 404 or similar, fall back to listing prices
    console.log('Direct price lookup failed', { status: resp.status, body: text })
  } catch (e) {
    console.warn('Direct price lookup error', e)
  }

  // Fallback: search prices list
  try {
    const listUrl = `https://${site}.chargebee.com/api/v2/prices?limit=100`
    console.log('Chargebee prices list URL:', listUrl)
    const listResp = await fetch(listUrl, { headers: { Authorization: `Basic ${auth}` } })
    const listText = await listResp.text()
    let listJson = null
    try { listJson = listText ? JSON.parse(listText) : null } catch (e) { listJson = null }
    const list = (listJson && listJson.list) || []
    for (const item of list) {
      const p = item.price || item
      if (!p) continue
      if (String(p.id) === String(priceId) || String(p.name) === String(priceId)) {
        return { success: true, exists: true, price: p }
      }
    }

    return { success: true, exists: false }
  } catch (e: any) {
    console.error('Price validation failed', e?.message || e)
    return { success: false, error: e?.message || 'Failed to validate price' }
  }
})
